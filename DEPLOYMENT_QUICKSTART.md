# AstraMentor Deployment Quickstart Guide

## 🚀 Complete Deployment in 30 Minutes

This guide will walk you through deploying both the backend and frontend of AstraMentor.

---

## Prerequisites Checklist

Before starting, ensure you have:

- [ ] AWS Account with billing enabled
- [ ] Credit card on file (for AWS charges)
- [ ] Command line access (Terminal/PowerShell)
- [ ] ~30 minutes of time

---

## Part 1: Backend Deployment (AWS)

### Step 1: Install Required Tools (10 minutes)

**On Windows:**
```powershell
# Install Chocolatey (if not installed)
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install tools
choco install awscli python nodejs docker-desktop -y

# Install Poetry
(Invoke-WebRequest -Uri https://install.python-poetry.org -UseBasicParsing).Content | python -

# Install AWS CDK
npm install -g aws-cdk

# Restart terminal and verify
aws --version
python --version
node --version
docker --version
poetry --version
cdk --version
```

**On macOS/Linux:**
```bash
# Install Homebrew (macOS) or use apt (Linux)
# macOS:
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install tools
brew install awscli python@3.11 node docker
# Or on Linux: sudo apt install awscli python3.11 nodejs docker.io

# Install Poetry
curl -sSL https://install.python-poetry.org | python3 -

# Install AWS CDK
npm install -g aws-cdk

# Verify installations
aws --version
python3 --version
node --version
docker --version
poetry --version
cdk --version
```

### Step 2: Configure AWS Credentials (5 minutes)

1. **Create AWS Access Keys:**
   - Go to https://console.aws.amazon.com/iam/
   - Click "Users" → Your username → "Security credentials"
   - Click "Create access key"
   - Choose "Command Line Interface (CLI)"
   - Download the credentials

2. **Configure AWS CLI:**
```bash
aws configure
```

Enter when prompted:
- **AWS Access Key ID**: [paste your key]
- **AWS Secret Access Key**: [paste your secret]
- **Default region**: `us-east-1`
- **Default output format**: `json`

3. **Verify:**
```bash
aws sts get-caller-identity
```

You should see your account ID and user ARN.

### Step 3: Set Up AWS Cognito (5 minutes)

**Option A: Using AWS Console (Easier)**

1. Go to https://console.aws.amazon.com/cognito/
2. Click "Create user pool"
3. Configure:
   - Sign-in options: Email
   - Password policy: Default
   - MFA: Optional (skip for now)
   - User pool name: `astramentor-users`
4. Create app client:
   - App client name: `astramentor-client`
   - Generate client secret: Yes
5. **Save these values:**
   - User Pool ID (e.g., `us-east-1_ABC123`)
   - App Client ID (e.g., `1a2b3c4d5e6f7g8h9i0j`)

**Option B: Using AWS CLI (Faster)**

```bash
# Create user pool
POOL_ID=$(aws cognito-idp create-user-pool \
  --pool-name astramentor-users \
  --auto-verified-attributes email \
  --policies '{"PasswordPolicy":{"MinimumLength":8}}' \
  --query 'UserPool.Id' \
  --output text)

echo "User Pool ID: $POOL_ID"

# Create app client
CLIENT_ID=$(aws cognito-idp create-user-pool-client \
  --user-pool-id $POOL_ID \
  --client-name astramentor-client \
  --generate-secret \
  --query 'UserPoolClient.ClientId' \
  --output text)

echo "App Client ID: $CLIENT_ID"

# Save these values!
```

### Step 4: Bootstrap AWS CDK (2 minutes)

```bash
# Get your AWS account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Bootstrap CDK (only needed once per account/region)
cdk bootstrap aws://$ACCOUNT_ID/us-east-1
```

### Step 5: Deploy Backend Infrastructure (15 minutes)

```bash
# Navigate to backend directory
cd astramentor-backend

# Install Python dependencies
poetry install

# Configure environment variables
cp .env.example .env

# Edit .env file with your values
# On Windows: notepad .env
# On macOS/Linux: nano .env
```

**Edit `.env` file:**
```env
# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here

# AWS Cognito (from Step 3)
COGNITO_USER_POOL_ID=us-east-1_ABC123
COGNITO_CLIENT_ID=1a2b3c4d5e6f7g8h9i0j

# AWS Bedrock
BEDROCK_REGION=us-east-1

# Application
DEBUG=false
CORS_ORIGINS=["http://localhost:3000"]
```

**Deploy infrastructure:**
```bash
# Make scripts executable (macOS/Linux)
chmod +x scripts/*.sh

# Deploy CDK stack
./scripts/deploy.sh

# On Windows, run:
# cd infrastructure
# cdk deploy --require-approval never
```

**This will create:**
- VPC and networking
- Load balancer
- ECS Fargate cluster
- PostgreSQL database
- Redis cache
- DynamoDB tables
- S3 bucket
- CloudFront CDN

**Expected time:** 10-15 minutes

**Save the outputs** - you'll see something like:
```
Outputs:
AstraMentorStack.ALBDNSName = astramentor-alb-123456789.us-east-1.elb.amazonaws.com
AstraMentorStack.ECRRepositoryUri = 123456789.dkr.ecr.us-east-1.amazonaws.com/astramentor
```

### Step 6: Build and Deploy Application (10 minutes)

```bash
# Build Docker image and push to ECR
./scripts/docker-build.sh

# On Windows:
# docker build -t astramentor .
# aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <ECR_URI>
# docker tag astramentor:latest <ECR_URI>:latest
# docker push <ECR_URI>:latest
```

### Step 7: Run Database Migrations (2 minutes)

```bash
# Run migrations
./scripts/migrate.sh

# On Windows:
# poetry run alembic upgrade head
```

### Step 8: Verify Backend Deployment (1 minute)

```bash
# Get your ALB DNS name from Step 5 outputs
ALB_DNS="astramentor-alb-123456789.us-east-1.elb.amazonaws.com"

# Test health endpoint
curl http://$ALB_DNS/health

# Expected response:
# {"status":"healthy","timestamp":"2024-01-15T10:30:00Z","components":{"database":"healthy","redis":"healthy"}}
```

**If you see "healthy" - your backend is deployed! 🎉**

---

## Part 2: Frontend Deployment (Vercel)

### Step 1: Install Vercel CLI (1 minute)

```bash
npm install -g vercel
```

### Step 2: Configure Frontend (3 minutes)

```bash
# Navigate to frontend directory
cd ../astramentor-frontend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local
```

**Edit `.env.local`:**
```env
# Backend API (use your ALB DNS from backend deployment)
NEXT_PUBLIC_API_URL=http://astramentor-alb-123456789.us-east-1.elb.amazonaws.com

# AWS Cognito (same values from backend)
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_ABC123
NEXT_PUBLIC_COGNITO_CLIENT_ID=1a2b3c4d5e6f7g8h9i0j
NEXT_PUBLIC_COGNITO_REGION=us-east-1

# OAuth (optional - can configure later)
NEXT_PUBLIC_COGNITO_DOMAIN=astramentor-auth.auth.us-east-1.amazoncognito.com
```

### Step 3: Deploy to Vercel (5 minutes)

**Option A: Using Vercel CLI**

```bash
# Login to Vercel
vercel login

# Deploy
vercel --prod

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? astramentor-frontend
# - Directory? ./
# - Override settings? No
```

**Option B: Using Vercel Dashboard**

1. Go to https://vercel.com/new
2. Import Git repository or drag & drop the `astramentor-frontend` folder
3. Configure:
   - Framework: Next.js
   - Root directory: ./
   - Build command: `npm run build`
   - Output directory: `.next`
4. Add environment variables from `.env.local`
5. Click "Deploy"

### Step 4: Update CORS (2 minutes)

After deployment, update backend CORS to allow your frontend domain:

```bash
# Get your Vercel URL (e.g., astramentor-frontend.vercel.app)
FRONTEND_URL="https://astramentor-frontend.vercel.app"

# Update backend .env
cd ../astramentor-backend
# Edit .env and update CORS_ORIGINS
# CORS_ORIGINS=["https://astramentor-frontend.vercel.app"]

# Redeploy backend
./scripts/deploy.sh
```

### Step 5: Verify Frontend Deployment (1 minute)

1. Open your Vercel URL in a browser
2. You should see the AstraMentor landing page
3. Try to register a new account
4. Try to login

**If you can see the landing page - your frontend is deployed! 🎉**

---

## Part 3: Post-Deployment Setup

### 1. Create Your First User (2 minutes)

**Option A: Via Frontend**
1. Go to your Vercel URL
2. Click "Sign Up"
3. Enter email and password
4. Verify email (check spam folder)

**Option B: Via AWS Console**
1. Go to AWS Cognito console
2. Select your user pool
3. Click "Create user"
4. Enter email and temporary password
5. User will be prompted to change password on first login

### 2. Subscribe to Alarms (2 minutes)

```bash
# Get SNS topic ARN
TOPIC_ARN=$(aws cloudformation describe-stacks \
  --stack-name AstraMentorStack \
  --query "Stacks[0].Outputs[?OutputKey=='AlarmTopicArn'].OutputValue" \
  --output text)

# Subscribe your email
aws sns subscribe \
  --topic-arn $TOPIC_ARN \
  --protocol email \
  --notification-endpoint your-email@example.com

# Check your email and confirm subscription
```

### 3. Monitor Costs (Ongoing)

```bash
# Check current month costs
aws ce get-cost-and-usage \
  --time-period Start=$(date +%Y-%m-01),End=$(date +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics BlendedCost

# Set up billing alarm (optional)
aws cloudwatch put-metric-alarm \
  --alarm-name astramentor-billing-alarm \
  --alarm-description "Alert when costs exceed $250" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 21600 \
  --evaluation-periods 1 \
  --threshold 250 \
  --comparison-operator GreaterThanThreshold
```

---

## Testing Your Deployment

### 1. Test Backend API

```bash
# Health check
curl http://your-alb-dns/health

# API documentation
open http://your-alb-dns/docs
```

### 2. Test Frontend

1. **Landing Page**: Visit your Vercel URL
2. **Registration**: Create a new account
3. **Login**: Sign in with your credentials
4. **Dashboard**: Should see the dashboard home
5. **Upload Repository**: Try uploading a small code repository (ZIP file)
6. **Chat**: Ask the AI a question about your code

### 3. Test Full Flow

1. Upload a repository (e.g., a small Python project)
2. Wait for indexing to complete
3. Open the chat panel
4. Ask: "What does this code do?"
5. Verify you get a response from the AI

---

## Troubleshooting

### Backend Issues

**Problem: Health check fails**
```bash
# Check ECS task logs
aws logs tail /ecs/astramentor --follow

# Check task status
aws ecs list-tasks --cluster astramentor-cluster
```

**Problem: Database connection error**
```bash
# Verify RDS is running
aws rds describe-db-instances \
  --db-instance-identifier astramentor-db \
  --query "DBInstances[0].DBInstanceStatus"
```

**Problem: High costs**
```bash
# Check Bedrock usage
aws ce get-cost-and-usage \
  --time-period Start=$(date -d '7 days ago' +%Y-%m-%d),End=$(date +%Y-%m-%d) \
  --granularity DAILY \
  --metrics BlendedCost \
  --group-by Type=SERVICE \
  --filter file://filter.json

# Create filter.json:
# {"Dimensions":{"Key":"SERVICE","Values":["Amazon Bedrock"]}}
```

### Frontend Issues

**Problem: Can't connect to backend**
- Check `NEXT_PUBLIC_API_URL` in Vercel environment variables
- Verify CORS is configured correctly in backend
- Check browser console for errors

**Problem: Authentication fails**
- Verify Cognito credentials in environment variables
- Check Cognito user pool is active
- Verify user email is confirmed

### Getting Help

1. **Check logs:**
   - Backend: `aws logs tail /ecs/astramentor --follow`
   - Frontend: Vercel dashboard → Your project → Logs

2. **Check documentation:**
   - Backend: `astramentor-backend/docs/`
   - Frontend: `astramentor-frontend/README.md`

3. **Common issues:**
   - See `astramentor-backend/docs/DEPLOYMENT.md` for detailed troubleshooting

---

## Cost Breakdown

**Expected Monthly Costs (5K interactions):**

| Service | Cost |
|---------|------|
| ECS Fargate (0.5 vCPU, 1GB) | $15-20 |
| RDS PostgreSQL (t3.micro) | $15 |
| ElastiCache Redis (t3.micro) | $12 |
| DynamoDB (on-demand) | $5-10 |
| S3 Storage | $1-5 |
| CloudFront | $5-10 |
| AWS Bedrock (Claude + Titan) | $65-110 |
| Data Transfer | $5-10 |
| **Total** | **$125-200/month** |

**Free Tier Benefits (First 12 months):**
- RDS: 750 hours/month free
- ElastiCache: 750 hours/month free
- S3: 5GB storage free
- CloudFront: 50GB transfer free

**Cost Optimization Tips:**
1. Use Claude Haiku for simple queries (10x cheaper)
2. Enable aggressive caching
3. Set up auto-scaling to scale down during low usage
4. Use S3 lifecycle policies to archive old data

---

## Next Steps

### Immediate
- [ ] Test all features
- [ ] Create your first user
- [ ] Upload a test repository
- [ ] Subscribe to cost alarms

### Short-term (Week 1)
- [ ] Configure custom domain
- [ ] Set up SSL certificate
- [ ] Enable CloudWatch dashboards
- [ ] Configure backup automation

### Long-term (Month 1)
- [ ] Implement remaining optional endpoints
- [ ] Add monitoring and alerting
- [ ] Optimize costs
- [ ] Gather user feedback

---

## Cleanup (If Needed)

To delete all resources and stop charges:

```bash
# Delete backend infrastructure
cd astramentor-backend
./scripts/destroy.sh

# Or manually:
# cdk destroy

# Delete frontend
vercel remove astramentor-frontend

# Delete Cognito user pool
aws cognito-idp delete-user-pool --user-pool-id <pool-id>
```

---

## Success! 🎉

You now have a fully deployed AstraMentor platform:

- ✅ Backend API running on AWS
- ✅ Frontend deployed on Vercel
- ✅ Database and caching configured
- ✅ AI agents ready to help users learn
- ✅ Monitoring and alarms set up

**Your URLs:**
- Frontend: https://astramentor-frontend.vercel.app
- Backend API: http://your-alb-dns
- API Docs: http://your-alb-dns/docs

**Estimated deployment time:** 30-45 minutes
**Monthly cost:** $125-200 (within $300 budget)

Enjoy your AI-powered coding tutor! 🚀
