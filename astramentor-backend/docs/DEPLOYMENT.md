# AstraMentor Backend Deployment Guide

## Prerequisites

### Required Tools

1. **AWS CLI** (v2.x)
   ```bash
   # Install on macOS
   brew install awscli
   
   # Install on Linux
   curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
   unzip awscliv2.zip
   sudo ./aws/install
   
   # Verify installation
   aws --version
   ```

2. **AWS CDK CLI** (v2.x)
   ```bash
   npm install -g aws-cdk
   
   # Verify installation
   cdk --version
   ```

3. **Python 3.11+**
   ```bash
   # Check version
   python3 --version
   ```

4. **Poetry** (dependency management)
   ```bash
   curl -sSL https://install.python-poetry.org | python3 -
   
   # Verify installation
   poetry --version
   ```

5. **Docker** (for building images)
   ```bash
   # Install Docker Desktop or Docker Engine
   docker --version
   ```

### AWS Account Setup

1. **Create AWS Account** (if you don't have one)
   - Sign up at https://aws.amazon.com

2. **Configure AWS Credentials**
   ```bash
   aws configure
   ```
   
   Enter:
   - AWS Access Key ID
   - AWS Secret Access Key
   - Default region: `us-east-1`
   - Default output format: `json`

3. **Verify Credentials**
   ```bash
   aws sts get-caller-identity
   ```

4. **Bootstrap CDK** (first time only)
   ```bash
   cdk bootstrap aws://ACCOUNT-ID/us-east-1
   ```

### AWS Cognito Setup

1. **Create User Pool**
   ```bash
   aws cognito-idp create-user-pool \
     --pool-name astramentor-users \
     --auto-verified-attributes email \
     --policies '{"PasswordPolicy":{"MinimumLength":8}}'
   ```

2. **Create User Pool Client**
   ```bash
   aws cognito-idp create-user-pool-client \
     --user-pool-id <pool-id> \
     --client-name astramentor-client \
     --generate-secret
   ```

3. **Note the Pool ID and Client ID** for environment variables

## Deployment Steps

### Step 1: Clone Repository

```bash
git clone https://github.com/astramentor/backend.git
cd backend
```

### Step 2: Install Dependencies

```bash
# Install Python dependencies
poetry install

# Install CDK dependencies
cd infrastructure
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

### Step 3: Configure Environment

Create `.env` file:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/astramentor
REDIS_URL=redis://localhost:6379/0

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret

# AWS Bedrock
BEDROCK_REGION=us-east-1

# AWS Cognito
COGNITO_USER_POOL_ID=your_pool_id
COGNITO_CLIENT_ID=your_client_id

# DynamoDB
DYNAMODB_CHAT_TABLE=astramentor-chat-messages
DYNAMODB_INTERACTIONS_TABLE=astramentor-agent-interactions

# S3
S3_BUCKET_NAME=astramentor-repositories

# Application
DEBUG=false
CORS_ORIGINS=["https://yourdomain.com"]
```

### Step 4: Deploy Infrastructure

```bash
# Make scripts executable
chmod +x scripts/*.sh

# Deploy CDK stack
./scripts/deploy.sh
```

This will:
- Synthesize CloudFormation template
- Create all AWS resources
- Output resource identifiers

**Expected Duration**: 10-15 minutes

**Resources Created**:
- VPC with subnets
- Application Load Balancer
- ECS Fargate cluster
- RDS PostgreSQL
- ElastiCache Redis
- DynamoDB tables
- S3 bucket
- CloudFront distribution
- CloudWatch Logs and alarms
- IAM roles

### Step 5: Build and Push Docker Image

```bash
# Build and push to ECR
./scripts/docker-build.sh
```

This will:
- Login to ECR
- Build Docker image
- Tag image
- Push to ECR

**Expected Duration**: 5-10 minutes

### Step 6: Run Database Migrations

```bash
# Run Alembic migrations
./scripts/migrate.sh
```

This will:
- Retrieve database credentials
- Connect to RDS
- Run all migrations

**Expected Duration**: 1-2 minutes

### Step 7: Verify Deployment

```bash
# Get ALB DNS name
aws cloudformation describe-stacks \
  --stack-name AstraMentorStack \
  --query "Stacks[0].Outputs[?OutputKey=='ALBDNSName'].OutputValue" \
  --output text

# Test health endpoint
curl http://<alb-dns-name>/health

# Expected response:
# {"status":"healthy","timestamp":"...","components":{"database":"healthy","redis":"healthy"}}
```

### Step 8: Update ECS Service

```bash
# Force new deployment with latest image
aws ecs update-service \
  --cluster astramentor-cluster \
  --service astramentor-service \
  --force-new-deployment
```

### Step 9: Monitor Deployment

```bash
# Watch ECS service events
aws ecs describe-services \
  --cluster astramentor-cluster \
  --services astramentor-service \
  --query "services[0].events[0:5]"

# Check task status
aws ecs list-tasks \
  --cluster astramentor-cluster \
  --service-name astramentor-service

# View logs
aws logs tail /ecs/astramentor --follow
```

## Post-Deployment Configuration

### 1. Subscribe to Alarms

```bash
# Get SNS topic ARN
aws cloudformation describe-stacks \
  --stack-name AstraMentorStack \
  --query "Stacks[0].Outputs[?OutputKey=='AlarmTopicArn'].OutputValue" \
  --output text

# Subscribe email to topic
aws sns subscribe \
  --topic-arn <topic-arn> \
  --protocol email \
  --notification-endpoint your-email@example.com

# Confirm subscription via email
```

### 2. Configure Custom Domain (Optional)

```bash
# Create Route 53 hosted zone
aws route53 create-hosted-zone \
  --name yourdomain.com \
  --caller-reference $(date +%s)

# Request SSL certificate
aws acm request-certificate \
  --domain-name yourdomain.com \
  --validation-method DNS

# Add CNAME record for validation
# Add A record pointing to ALB
```

### 3. Enable CloudWatch Dashboards

```bash
# Create custom dashboard
aws cloudwatch put-dashboard \
  --dashboard-name AstraMentor \
  --dashboard-body file://dashboard.json
```

### 4. Set Up Backup Automation

```bash
# Enable automated RDS snapshots (already configured)
# Enable DynamoDB point-in-time recovery
aws dynamodb update-continuous-backups \
  --table-name astramentor-chat-messages \
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true
```

## Environment-Specific Deployments

### Development Environment

```bash
# Deploy with dev context
cdk deploy --context environment=development
```

### Staging Environment

```bash
# Deploy with staging context
cdk deploy --context environment=staging
```

### Production Environment

```bash
# Deploy with production context
cdk deploy --context environment=production

# Enable additional protections
# - RDS deletion protection
# - DynamoDB point-in-time recovery
# - Longer log retention
# - Multi-AZ deployments
```

## Rollback Procedures

### Rollback Application

```bash
# Revert to previous Docker image
./scripts/docker-build.sh <previous-tag>

# Update ECS service
aws ecs update-service \
  --cluster astramentor-cluster \
  --service astramentor-service \
  --force-new-deployment
```

### Rollback Database

```bash
# Downgrade one migration
poetry run alembic downgrade -1

# Downgrade to specific revision
poetry run alembic downgrade <revision>
```

### Rollback Infrastructure

```bash
# Revert CDK stack
cdk deploy --previous-parameters
```

## Troubleshooting

### Deployment Fails

**Check CloudFormation Events:**
```bash
aws cloudformation describe-stack-events \
  --stack-name AstraMentorStack \
  --max-items 20
```

**Common Issues:**
- Insufficient IAM permissions
- Resource limits exceeded
- Invalid parameter values
- Dependency conflicts

### ECS Task Fails to Start

**Check Task Logs:**
```bash
aws logs tail /ecs/astramentor --follow
```

**Common Issues:**
- Image pull errors (check ECR permissions)
- Environment variable errors
- Database connection failures
- Memory/CPU limits too low

### Database Connection Errors

**Check Security Groups:**
```bash
aws ec2 describe-security-groups \
  --filters "Name=group-name,Values=*RDS*"
```

**Verify Connectivity:**
```bash
# From ECS task
aws ecs execute-command \
  --cluster astramentor-cluster \
  --task <task-id> \
  --command "nc -zv <db-endpoint> 5432" \
  --interactive
```

### High Costs

**Check Cost Explorer:**
```bash
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=SERVICE
```

**Common Cost Drivers:**
- NAT Gateway data transfer
- Bedrock API usage
- CloudWatch Logs storage
- Data transfer out

**Cost Optimization:**
- Use Haiku for simple queries
- Implement aggressive caching
- Reduce log retention
- Use S3 lifecycle policies

## Monitoring & Maintenance

### Daily Checks

```bash
# Check service health
curl http://<alb-dns-name>/health

# Check ECS service status
aws ecs describe-services \
  --cluster astramentor-cluster \
  --services astramentor-service \
  --query "services[0].{Status:status,Running:runningCount,Desired:desiredCount}"

# Check recent errors
aws logs filter-log-events \
  --log-group-name /ecs/astramentor \
  --filter-pattern "ERROR" \
  --start-time $(date -d '1 hour ago' +%s)000
```

### Weekly Checks

```bash
# Review CloudWatch alarms
aws cloudwatch describe-alarms \
  --state-value ALARM

# Check cost trends
aws ce get-cost-forecast \
  --time-period Start=$(date +%Y-%m-01),End=$(date -d 'next month' +%Y-%m-01) \
  --metric BLENDED_COST \
  --granularity MONTHLY

# Review security groups
aws ec2 describe-security-groups \
  --query "SecurityGroups[?IpPermissions[?IpRanges[?CidrIp=='0.0.0.0/0']]]"
```

### Monthly Checks

```bash
# Review and rotate credentials
# Update dependencies
poetry update

# Review and optimize costs
# Analyze CloudWatch Logs Insights
# Review and update documentation
```

## Scaling Guidelines

### Vertical Scaling

**Increase Task Resources:**
```python
# In infrastructure/stacks/astramentor_stack.py
task_definition = ecs.FargateTaskDefinition(
    self,
    "TaskDefinition",
    cpu=1024,  # Increase from 512
    memory_limit_mib=2048,  # Increase from 1024
    ...
)
```

### Horizontal Scaling

**Adjust Auto-Scaling:**
```python
# In infrastructure/stacks/astramentor_stack.py
scaling = self.fargate_service.auto_scale_task_count(
    min_capacity=2,  # Increase from 1
    max_capacity=10  # Increase from 5
)
```

### Database Scaling

**Upgrade RDS Instance:**
```bash
aws rds modify-db-instance \
  --db-instance-identifier astramentor-db \
  --db-instance-class db.t3.small \
  --apply-immediately
```

## Security Hardening

### Enable Additional Security Features

```bash
# Enable GuardDuty
aws guardduty create-detector --enable

# Enable Security Hub
aws securityhub enable-security-hub

# Enable AWS Config
aws configservice put-configuration-recorder \
  --configuration-recorder name=default,roleARN=<role-arn> \
  --recording-group allSupported=true,includeGlobalResourceTypes=true
```

### Regular Security Audits

```bash
# Run AWS Trusted Advisor checks
aws support describe-trusted-advisor-checks

# Scan for vulnerabilities
poetry run safety check

# Check for outdated dependencies
poetry show --outdated
```

## Disaster Recovery

### Backup Strategy

- **RDS**: Automated daily snapshots (7-day retention)
- **DynamoDB**: On-demand backups + point-in-time recovery
- **S3**: Versioning enabled
- **Infrastructure**: CDK code in Git

### Recovery Procedures

**Restore RDS:**
```bash
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier astramentor-db-restored \
  --db-snapshot-identifier <snapshot-id>
```

**Restore DynamoDB:**
```bash
aws dynamodb restore-table-from-backup \
  --target-table-name astramentor-chat-messages-restored \
  --backup-arn <backup-arn>
```

**Restore S3:**
```bash
aws s3api list-object-versions \
  --bucket astramentor-repositories \
  --prefix <key>

aws s3api get-object \
  --bucket astramentor-repositories \
  --key <key> \
  --version-id <version-id> \
  <output-file>
```

## Support & Resources

- **Documentation**: https://docs.astramentor.com
- **GitHub**: https://github.com/astramentor/backend
- **AWS Support**: https://console.aws.amazon.com/support
- **Community**: https://community.astramentor.com
