"""
Main CDK Stack for AstraMentor Backend Infrastructure
"""
from aws_cdk import (
    Stack,
    Tags,
    CfnOutput,
    Duration,
    RemovalPolicy,
    aws_ec2 as ec2,
    aws_elasticloadbalancingv2 as elbv2,
    aws_certificatemanager as acm,
    aws_rds as rds,
    aws_elasticache as elasticache,
    aws_dynamodb as dynamodb,
    aws_secretsmanager as secretsmanager,
    aws_s3 as s3,
    aws_cloudfront as cloudfront,
    aws_cloudfront_origins as origins,
    aws_ecs as ecs,
    aws_ecs_patterns as ecs_patterns,
    aws_ecr as ecr,
    aws_iam as iam,
    aws_logs as logs,
    aws_applicationautoscaling as appscaling,
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cw_actions,
    aws_sns as sns,
    aws_sns_subscriptions as sns_subs,
    aws_budgets as budgets,
)
from constructs import Construct


class AstraMentorStack(Stack):
    """
    Main stack for AstraMentor backend infrastructure.
    
    Creates all AWS resources needed for the AI-powered tutoring platform:
    - VPC and networking
    - ECS Fargate compute
    - RDS PostgreSQL database
    - ElastiCache Redis
    - DynamoDB tables
    - S3 storage
    - CloudFront CDN
    - Monitoring and alarms
    """

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Get context values
        environment = self.node.try_get_context("environment") or "production"
        project = self.node.try_get_context("project") or "astramentor"
        budget_limit = self.node.try_get_context("budget_limit") or 300

        # Apply tags to all resources
        Tags.of(self).add("Project", project)
        Tags.of(self).add("Environment", environment)
        Tags.of(self).add("ManagedBy", "CDK")
        Tags.of(self).add("CostCenter", "astramentor-backend")

        # Create VPC with public and private subnets across 2 AZs
        self.vpc = ec2.Vpc(
            self,
            "AstraMentorVPC",
            max_azs=2,
            nat_gateways=1,  # Cost optimization: single NAT gateway
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="Public",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name="Private",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24
                )
            ]
        )

        # Security group for ECS tasks
        self.ecs_security_group = ec2.SecurityGroup(
            self,
            "ECSSecurityGroup",
            vpc=self.vpc,
            description="Security group for ECS Fargate tasks",
            allow_all_outbound=True
        )

        # Security group for RDS
        self.rds_security_group = ec2.SecurityGroup(
            self,
            "RDSSecurityGroup",
            vpc=self.vpc,
            description="Security group for RDS PostgreSQL",
            allow_all_outbound=False
        )

        # Allow ECS to connect to RDS on port 5432
        self.rds_security_group.add_ingress_rule(
            peer=self.ecs_security_group,
            connection=ec2.Port.tcp(5432),
            description="Allow ECS tasks to connect to PostgreSQL"
        )

        # Security group for ElastiCache Redis
        self.redis_security_group = ec2.SecurityGroup(
            self,
            "RedisSecurityGroup",
            vpc=self.vpc,
            description="Security group for ElastiCache Redis",
            allow_all_outbound=False
        )

        # Allow ECS to connect to Redis on port 6379
        self.redis_security_group.add_ingress_rule(
            peer=self.ecs_security_group,
            connection=ec2.Port.tcp(6379),
            description="Allow ECS tasks to connect to Redis"
        )

        # Application Load Balancer
        self.alb = elbv2.ApplicationLoadBalancer(
            self,
            "AstraMentorALB",
            vpc=self.vpc,
            internet_facing=True,
            load_balancer_name=f"{project}-alb"
        )

        # Allow ALB to receive traffic from internet
        self.alb.connections.allow_from_any_ipv4(
            ec2.Port.tcp(80),
            "Allow HTTP from internet"
        )
        self.alb.connections.allow_from_any_ipv4(
            ec2.Port.tcp(443),
            "Allow HTTPS from internet"
        )

        # Allow ALB to connect to ECS tasks
        self.ecs_security_group.add_ingress_rule(
            peer=self.alb.connections.security_groups[0],
            connection=ec2.Port.tcp(8000),
            description="Allow ALB to connect to ECS tasks"
        )

        # HTTP listener (redirect to HTTPS in production)
        http_listener = self.alb.add_listener(
            "HTTPListener",
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            default_action=elbv2.ListenerAction.fixed_response(
                status_code=200,
                content_type="text/plain",
                message_body="AstraMentor API - Use HTTPS for secure connections"
            )
        )

        # RDS PostgreSQL database
        # Create database credentials in Secrets Manager
        self.db_credentials = secretsmanager.Secret(
            self,
            "DBCredentials",
            secret_name=f"{project}-db-credentials",
            generate_secret_string=secretsmanager.SecretStringGenerator(
                secret_string_template='{"username": "astramentor"}',
                generate_string_key="password",
                exclude_punctuation=True,
                password_length=32
            )
        )

        # Create RDS PostgreSQL instance
        self.database = rds.DatabaseInstance(
            self,
            "AstraMentorDB",
            engine=rds.DatabaseInstanceEngine.postgres(
                version=rds.PostgresEngineVersion.VER_15_4
            ),
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.BURSTABLE3,
                ec2.InstanceSize.MICRO  # t3.micro - free tier eligible
            ),
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            security_groups=[self.rds_security_group],
            credentials=rds.Credentials.from_secret(self.db_credentials),
            database_name="astramentor",
            allocated_storage=20,  # GB - free tier eligible
            storage_encrypted=True,
            backup_retention=Duration.days(7),
            deletion_protection=False,  # Set to True in production
            removal_policy=RemovalPolicy.SNAPSHOT,
            publicly_accessible=False
        )

        # ElastiCache Redis cluster
        # Create subnet group for Redis
        redis_subnet_group = elasticache.CfnSubnetGroup(
            self,
            "RedisSubnetGroup",
            description="Subnet group for ElastiCache Redis",
            subnet_ids=self.vpc.select_subnets(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ).subnet_ids,
            cache_subnet_group_name=f"{project}-redis-subnet-group"
        )

        # Create Redis cluster
        self.redis_cluster = elasticache.CfnCacheCluster(
            self,
            "RedisCluster",
            cache_node_type="cache.t3.micro",  # Free tier eligible
            engine="redis",
            num_cache_nodes=1,
            vpc_security_group_ids=[self.redis_security_group.security_group_id],
            cache_subnet_group_name=redis_subnet_group.cache_subnet_group_name,
            cluster_name=f"{project}-redis"
        )
        self.redis_cluster.add_dependency(redis_subnet_group)

        # DynamoDB tables
        # Chat messages table
        self.chat_messages_table = dynamodb.Table(
            self,
            "ChatMessagesTable",
            table_name=f"{project}-chat-messages",
            partition_key=dynamodb.Attribute(
                name="session_id",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="timestamp",
                type=dynamodb.AttributeType.NUMBER
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,  # On-demand pricing
            encryption=dynamodb.TableEncryption.AWS_MANAGED,
            removal_policy=RemovalPolicy.DESTROY,  # Change to RETAIN in production
            point_in_time_recovery=False  # Enable in production
        )

        # Agent interactions table
        self.agent_interactions_table = dynamodb.Table(
            self,
            "AgentInteractionsTable",
            table_name=f"{project}-agent-interactions",
            partition_key=dynamodb.Attribute(
                name="user_id",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="timestamp",
                type=dynamodb.AttributeType.NUMBER
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            encryption=dynamodb.TableEncryption.AWS_MANAGED,
            removal_policy=RemovalPolicy.DESTROY,
            point_in_time_recovery=False
        )

        # S3 bucket for repository storage
        self.repository_bucket = s3.Bucket(
            self,
            "RepositoryBucket",
            bucket_name=f"{project}-repositories-{self.account}",
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            versioning=False,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,  # Clean up on stack deletion
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="TransitionToIA",
                    enabled=True,
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.INFREQUENT_ACCESS,
                            transition_after=Duration.days(30)
                        )
                    ]
                ),
                s3.LifecycleRule(
                    id="DeleteOldFiles",
                    enabled=True,
                    expiration=Duration.days(90)
                )
            ]
        )

        # CloudFront distribution for API
        self.distribution = cloudfront.Distribution(
            self,
            "APIDistribution",
            default_behavior=cloudfront.BehaviorOptions(
                origin=origins.LoadBalancerV2Origin(
                    self.alb,
                    protocol_policy=cloudfront.OriginProtocolPolicy.HTTP_ONLY
                ),
                viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                allowed_methods=cloudfront.AllowedMethods.ALLOW_ALL,
                cache_policy=cloudfront.CachePolicy.CACHING_DISABLED,  # API responses shouldn't be cached
                origin_request_policy=cloudfront.OriginRequestPolicy.ALL_VIEWER
            ),
            price_class=cloudfront.PriceClass.PRICE_CLASS_100,  # Cost optimization: US/Europe only
            comment=f"{project} API distribution"
        )

        # ECR repository for container images
        self.ecr_repository = ecr.Repository(
            self,
            "ECRRepository",
            repository_name=f"{project}-backend",
            removal_policy=RemovalPolicy.DESTROY,
            empty_on_delete=True
        )

        # ECS cluster
        self.ecs_cluster = ecs.Cluster(
            self,
            "ECSCluster",
            vpc=self.vpc,
            cluster_name=f"{project}-cluster",
            container_insights=True
        )

        # CloudWatch log group for ECS tasks
        log_group = logs.LogGroup(
            self,
            "ECSLogGroup",
            log_group_name=f"/ecs/{project}",
            retention=logs.RetentionDays.ONE_WEEK,  # Cost optimization
            removal_policy=RemovalPolicy.DESTROY
        )

        # IAM role for ECS task execution (ECR, CloudWatch, Secrets Manager)
        task_execution_role = iam.Role(
            self,
            "TaskExecutionRole",
            assumed_by=iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AmazonECSTaskExecutionRolePolicy"
                )
            ]
        )
        
        # Grant access to database credentials
        self.db_credentials.grant_read(task_execution_role)

        # IAM role for ECS tasks (S3, DynamoDB, RDS, Bedrock, CloudWatch)
        task_role = iam.Role(
            self,
            "TaskRole",
            assumed_by=iam.ServicePrincipal("ecs-tasks.amazonaws.com")
        )
        
        # Grant S3 access
        self.repository_bucket.grant_read_write(task_role)
        
        # Grant DynamoDB access
        self.chat_messages_table.grant_read_write_data(task_role)
        self.agent_interactions_table.grant_read_write_data(task_role)
        
        # Grant Bedrock access
        task_role.add_to_policy(
            iam.PolicyStatement(
                actions=[
                    "bedrock:InvokeModel",
                    "bedrock:InvokeModelWithResponseStream"
                ],
                resources=["*"]
            )
        )
        
        # Grant CloudWatch metrics access
        task_role.add_to_policy(
            iam.PolicyStatement(
                actions=[
                    "cloudwatch:PutMetricData"
                ],
                resources=["*"]
            )
        )

        # Fargate task definition
        task_definition = ecs.FargateTaskDefinition(
            self,
            "TaskDefinition",
            cpu=512,  # 0.5 vCPU
            memory_limit_mib=1024,  # 1 GB
            execution_role=task_execution_role,
            task_role=task_role
        )

        # Container definition
        container = task_definition.add_container(
            "AppContainer",
            image=ecs.ContainerImage.from_ecr_repository(self.ecr_repository, "latest"),
            logging=ecs.LogDriver.aws_logs(
                stream_prefix="astramentor",
                log_group=log_group
            ),
            environment={
                "AWS_REGION": self.region,
                "REDIS_URL": f"redis://{self.redis_cluster.attr_redis_endpoint_address}:6379/0",
                "DYNAMODB_CHAT_TABLE": self.chat_messages_table.table_name,
                "DYNAMODB_INTERACTIONS_TABLE": self.agent_interactions_table.table_name,
                "S3_BUCKET_NAME": self.repository_bucket.bucket_name,
                "BEDROCK_REGION": self.region,
            },
            secrets={
                "DATABASE_URL": ecs.Secret.from_secrets_manager(
                    self.db_credentials,
                    field="password"
                )
            }
        )
        
        container.add_port_mappings(
            ecs.PortMapping(container_port=8000, protocol=ecs.Protocol.TCP)
        )

        # Target group for ALB
        target_group = elbv2.ApplicationTargetGroup(
            self,
            "TargetGroup",
            vpc=self.vpc,
            port=8000,
            protocol=elbv2.ApplicationProtocol.HTTP,
            target_type=elbv2.TargetType.IP,
            health_check=elbv2.HealthCheck(
                path="/health",
                interval=Duration.seconds(30),
                timeout=Duration.seconds(5),
                healthy_threshold_count=2,
                unhealthy_threshold_count=3
            )
        )

        # Add target group to HTTP listener
        http_listener.add_target_groups(
            "DefaultTarget",
            target_groups=[target_group]
        )

        # Fargate service
        self.fargate_service = ecs.FargateService(
            self,
            "FargateService",
            cluster=self.ecs_cluster,
            task_definition=task_definition,
            desired_count=1,
            security_groups=[self.ecs_security_group],
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            assign_public_ip=False
        )

        # Attach service to target group
        self.fargate_service.attach_to_application_target_group(target_group)

        # Auto-scaling configuration
        scaling = self.fargate_service.auto_scale_task_count(
            min_capacity=1,
            max_capacity=5
        )

        # CPU-based scaling
        scaling.scale_on_cpu_utilization(
            "CPUScaling",
            target_utilization_percent=70,
            scale_in_cooldown=Duration.seconds(60),
            scale_out_cooldown=Duration.seconds(60)
        )

        # Memory-based scaling
        scaling.scale_on_memory_utilization(
            "MemoryScaling",
            target_utilization_percent=80,
            scale_in_cooldown=Duration.seconds(60),
            scale_out_cooldown=Duration.seconds(60)
        )

        # SNS topic for alarms
        alarm_topic = sns.Topic(
            self,
            "AlarmTopic",
            topic_name=f"{project}-alarms",
            display_name="AstraMentor Alarms"
        )

        # Cost alarm at $250 threshold (before hitting $300 budget)
        cost_alarm = cloudwatch.Alarm(
            self,
            "CostAlarm",
            alarm_name=f"{project}-cost-alarm",
            alarm_description="Alert when monthly costs exceed $250",
            metric=cloudwatch.Metric(
                namespace="AWS/Billing",
                metric_name="EstimatedCharges",
                dimensions_map={
                    "Currency": "USD"
                },
                statistic="Maximum",
                period=Duration.hours(6)
            ),
            threshold=250,
            evaluation_periods=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
        )
        cost_alarm.add_alarm_action(cw_actions.SnsAction(alarm_topic))

        # Error rate alarm (5% threshold)
        error_rate_alarm = cloudwatch.Alarm(
            self,
            "ErrorRateAlarm",
            alarm_name=f"{project}-error-rate-alarm",
            alarm_description="Alert when error rate exceeds 5%",
            metric=self.alb.metric_http_code_target(
                code=elbv2.HttpCodeTarget.TARGET_5XX_COUNT,
                period=Duration.minutes(5)
            ),
            threshold=5,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING
        )
        error_rate_alarm.add_alarm_action(cw_actions.SnsAction(alarm_topic))

        # Latency alarm (p95 > 1s)
        latency_alarm = cloudwatch.Alarm(
            self,
            "LatencyAlarm",
            alarm_name=f"{project}-latency-alarm",
            alarm_description="Alert when p95 latency exceeds 1 second",
            metric=self.alb.metric_target_response_time(
                statistic="p95",
                period=Duration.minutes(5)
            ),
            threshold=1,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
        )
        latency_alarm.add_alarm_action(cw_actions.SnsAction(alarm_topic))

        # Outputs
        CfnOutput(
            self,
            "StackName",
            value=self.stack_name,
            description="Stack name"
        )
        
        CfnOutput(
            self,
            "Environment",
            value=environment,
            description="Deployment environment"
        )
        
        CfnOutput(
            self,
            "BudgetLimit",
            value=str(budget_limit),
            description="Monthly budget limit in USD"
        )
        
        CfnOutput(
            self,
            "VPCId",
            value=self.vpc.vpc_id,
            description="VPC ID"
        )
        
        CfnOutput(
            self,
            "ALBDNSName",
            value=self.alb.load_balancer_dns_name,
            description="Application Load Balancer DNS name"
        )
        
        CfnOutput(
            self,
            "DatabaseEndpoint",
            value=self.database.db_instance_endpoint_address,
            description="RDS PostgreSQL endpoint"
        )
        
        CfnOutput(
            self,
            "DatabaseSecretArn",
            value=self.db_credentials.secret_arn,
            description="ARN of database credentials secret"
        )
        
        CfnOutput(
            self,
            "RedisEndpoint",
            value=self.redis_cluster.attr_redis_endpoint_address,
            description="ElastiCache Redis endpoint"
        )
        
        CfnOutput(
            self,
            "ChatMessagesTableName",
            value=self.chat_messages_table.table_name,
            description="DynamoDB chat messages table name"
        )
        
        CfnOutput(
            self,
            "AgentInteractionsTableName",
            value=self.agent_interactions_table.table_name,
            description="DynamoDB agent interactions table name"
        )
        
        CfnOutput(
            self,
            "RepositoryBucketName",
            value=self.repository_bucket.bucket_name,
            description="S3 bucket for repository storage"
        )
        
        CfnOutput(
            self,
            "CloudFrontDomain",
            value=self.distribution.distribution_domain_name,
            description="CloudFront distribution domain name"
        )
        
        CfnOutput(
            self,
            "ECRRepositoryUri",
            value=self.ecr_repository.repository_uri,
            description="ECR repository URI for container images"
        )
        
        CfnOutput(
            self,
            "ECSClusterName",
            value=self.ecs_cluster.cluster_name,
            description="ECS cluster name"
        )
        
        CfnOutput(
            self,
            "ECSServiceName",
            value=self.fargate_service.service_name,
            description="ECS Fargate service name"
        )
        
        CfnOutput(
            self,
            "AlarmTopicArn",
            value=alarm_topic.topic_arn,
            description="SNS topic ARN for alarms"
        )
