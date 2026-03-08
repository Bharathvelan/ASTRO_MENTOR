# AstraMentor Infrastructure

AWS CDK infrastructure for the AstraMentor backend.

## Prerequisites

- AWS CLI configured with credentials
- Python 3.11+
- Node.js 18+ (for CDK CLI)
- AWS CDK CLI: `npm install -g aws-cdk`

## Setup

```bash
cd infrastructure
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

## Deploy

```bash
# Synthesize CloudFormation template
cdk synth

# Deploy to AWS
cdk deploy

# Deploy with confirmation skip (use with caution)
cdk deploy --require-approval never
```

## Destroy

```bash
cdk destroy
```

## Context Configuration

Edit `cdk.json` to configure:
- `region`: AWS region (default: us-east-1)
- `environment`: Deployment environment (default: production)
- `project`: Project name (default: astramentor)
- `budget_limit`: Monthly budget limit in USD (default: 300)

## Resources Created

- VPC with public/private subnets across 2 AZs
- Application Load Balancer
- ECS Fargate cluster and service
- RDS PostgreSQL (t3.micro)
- ElastiCache Redis (cache.t3.micro)
- DynamoDB tables (on-demand)
- S3 bucket for repository storage
- CloudFront distribution
- CloudWatch Logs and alarms
- IAM roles and security groups

## Cost Optimization

All resources are configured for cost optimization:
- Free tier eligible instances (t3.micro)
- On-demand DynamoDB billing
- 7-day log retention
- S3 lifecycle policies
- Single NAT gateway
- Auto-scaling with conservative limits

Estimated monthly cost: $150-220 (within $300 budget)
