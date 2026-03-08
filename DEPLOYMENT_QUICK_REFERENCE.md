# AstraMentor Deployment - Quick Reference Card

One-page reference for deploying AstraMentor. Print this or keep it handy!

---

## 🎯 Deployment in 5 Steps

```
1. INSTALL TOOLS → 2. CONFIGURE AWS → 3. DEPLOY BACKEND → 4. DEPLOY FRONTEND → 5. TEST
   (10 min)           (5 min)            (30 min)            (15 min)           (10 min)
```

---

## 📦 Required Tools

```bash
# Install all at once (macOS)
brew install awscli python@3.11 node docker
curl -sSL https://install.python-poetry.org | python3 -
npm install -g aws-cdk vercel

# Verify
aws --version && python3 --version && node --version && \
docker --version && poetry --version && cdk --version
```

---

## ⚙️ AWS Configuration

```bash
# Configure credentials
aws configure
# Enter: Access Key, Secret Key, Region (us-east-1), Format (json)

# Bootstrap CDK (once per account)
cdk bootstrap aws://$(aws sts get-caller-identity --query Account --output text)/us-east-1
```

---

## 🔐 Cognito Setup

```bash
# Create user pool
POOL_ID=$(aws cognito-idp create-user-pool \
  --pool-name astramentor-users \
  --auto-verified-attributes email \
  --policies '{"PasswordPolicy":{"MinimumLength":8}}' \
  --query 'UserPool.Id' --output text)

# Create app client
CLIENT_ID=$(aws cognito-idp create-user-pool-client \
  --user-pool-id $POOL_ID \
  --client-name astramentor-client \
  --generate-secret \
  --query 'UserPoolClient.ClientId' --output text)

# Save these!
echo "Pool ID: $POOL_ID"
echo "Client ID: $CLIENT_ID"
```

---

## 🚀 Backend Deployment

```bash
cd astramentor-backend

# 1. Install dependencies
poetry install

# 2. Configure environment
cp .env.example .env
# Edit .env with AWS credentials and Cognito IDs

# 3. Deploy infrastructure
chmod +x scripts/*.sh
./scripts/deploy.sh
# Save ALB DNS from outputs!

# 4. Build and push Docker image
./scripts/docker-build.sh

# 5. Run migrations
./scripts/migrate.sh

# 6. Verify
curl http://<ALB-DNS>/health
# Should return: {"status":"healthy"}
```

---

## 🎨 Frontend Deployment

```bash
cd astramentor-frontend

# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit with:
# - NEXT_PUBLIC_API_URL=http://<ALB-DNS>
# - NEXT_PUBLIC_COGNITO_USER_POOL_ID=<POOL-ID>
# - NEXT_PUBLIC_COGNITO_CLIENT_ID=<CLIENT-ID>

# 3. Deploy to Vercel
vercel login
vercel --prod
# Save Vercel URL!

# 4. Update backend CORS
cd ../astramentor-backend
# Edit .env: CORS_ORIGINS=["https://<VERCEL-URL>"]
./scripts/deploy.sh
```

---

## ✅ Testing Checklist

```bash
# Backend
curl http://<ALB-DNS>/health          # ✓ Returns healthy
open http://<ALB-DNS>/docs            # ✓ API docs load

# Frontend
open https://<VERCEL-URL>             # ✓ Landing page loads
# ✓ Can register
# ✓ Can login
# ✓ Dashboard loads
# ✓ Can upload repo
# ✓ AI chat works
```

---

## 📊 Cost Monitoring

```bash
# Check current costs
aws ce get-cost-and-usage \
  --time-period Start=$(date +%Y-%m-01),End=$(date +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics BlendedCost

# Set billing alarm
aws cloudwatch put-metric-alarm \
  --alarm-name astramentor-billing \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 21600 \
  --evaluation-periods 1 \
  --threshold 250 \
  --comparison-operator GreaterThanThreshold
```

---

## 🔍 Monitoring Commands

```bash
# View logs
aws logs tail /ecs/astramentor --follow

# Check ECS status
aws ecs describe-services \
  --cluster astramentor-cluster \
  --services astramentor-service

# List running tasks
aws ecs list-tasks \
  --cluster astramentor-cluster

# Check alarms
aws cloudwatch describe-alarms --state-value ALARM
```

---

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Health check fails | Check logs: `aws logs tail /ecs/astramentor --follow` |
| Can't connect to DB | Verify security groups allow ECS → RDS |
| Frontend 404 | Check `NEXT_PUBLIC_API_URL` in Vercel env vars |
| CORS error | Update `CORS_ORIGINS` in backend `.env` |
| High costs | Check Bedrock usage, enable caching |
| Task won't start | Check ECR image exists, verify IAM permissions |

---

## 🔄 Update Commands

```bash
# Update backend code
cd astramentor-backend
./scripts/docker-build.sh
aws ecs update-service \
  --cluster astramentor-cluster \
  --service astramentor-service \
  --force-new-deployment

# Update frontend
cd astramentor-frontend
vercel --prod

# Update infrastructure
cd astramentor-backend
./scripts/deploy.sh
```

---

## 🧹 Cleanup Commands

```bash
# Delete everything
cd astramentor-backend
./scripts/destroy.sh

# Delete frontend
vercel remove astramentor-frontend

# Delete Cognito
aws cognito-idp delete-user-pool --user-pool-id <POOL-ID>
```

---

## 📁 Important Files

```
Backend:
├── .env                          # Environment variables
├── scripts/deploy.sh             # Deploy infrastructure
├── scripts/docker-build.sh       # Build Docker image
├── scripts/migrate.sh            # Run migrations
└── infrastructure/               # CDK code

Frontend:
├── .env.local                    # Environment variables
├── vercel.json                   # Vercel config
└── package.json                  # Dependencies
```

---

## 🔑 Environment Variables

### Backend (.env)
```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<your-key>
AWS_SECRET_ACCESS_KEY=<your-secret>
COGNITO_USER_POOL_ID=<pool-id>
COGNITO_CLIENT_ID=<client-id>
BEDROCK_REGION=us-east-1
CORS_ORIGINS=["https://<vercel-url>"]
DEBUG=false
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://<alb-dns>
NEXT_PUBLIC_COGNITO_USER_POOL_ID=<pool-id>
NEXT_PUBLIC_COGNITO_CLIENT_ID=<client-id>
NEXT_PUBLIC_COGNITO_REGION=us-east-1
```

---

## 💰 Cost Breakdown

| Service | Monthly Cost |
|---------|--------------|
| AWS Bedrock | $65-110 |
| ECS Fargate | $15-20 |
| RDS PostgreSQL | $15 |
| ElastiCache Redis | $12 |
| DynamoDB | $5-10 |
| S3 + CloudFront | $5-10 |
| Other | $5-10 |
| Vercel | $0 (free) |
| **Total** | **$125-200** |

---

## 🎯 Success Metrics

```
✅ Health check: < 200ms
✅ API response: < 1s
✅ Frontend load: < 3s
✅ Error rate: < 1%
✅ Monthly cost: < $300
✅ Uptime: > 99%
```

---

## 📞 Quick Links

- **Full Guide**: DEPLOYMENT_QUICKSTART.md
- **Checklist**: DEPLOYMENT_CHECKLIST.md
- **Architecture**: DEPLOYMENT_ARCHITECTURE.md
- **Backend Docs**: astramentor-backend/docs/
- **Frontend Docs**: astramentor-frontend/README.md

---

## 🆘 Emergency Contacts

```bash
# Check service status
aws ecs describe-services \
  --cluster astramentor-cluster \
  --services astramentor-service

# Force restart
aws ecs update-service \
  --cluster astramentor-cluster \
  --service astramentor-service \
  --force-new-deployment

# Rollback (use previous image tag)
./scripts/docker-build.sh <previous-tag>
```

---

## 📝 Deployment Checklist

```
Pre-Deployment:
□ AWS account created
□ Tools installed
□ AWS CLI configured
□ CDK bootstrapped
□ Cognito user pool created

Backend:
□ Dependencies installed
□ .env configured
□ Infrastructure deployed
□ Docker image built
□ Migrations run
□ Health check passes

Frontend:
□ Dependencies installed
□ .env.local configured
□ Deployed to Vercel
□ Backend CORS updated
□ Landing page loads

Post-Deployment:
□ First user created
□ Alarms subscribed
□ Costs monitored
□ Full flow tested
```

---

## 🚀 Deployment Timeline

```
0:00 - Install tools (10 min)
0:10 - Configure AWS (5 min)
0:15 - Deploy backend (30 min)
0:45 - Deploy frontend (15 min)
1:00 - Test & verify (10 min)
1:10 - DONE! ✅
```

---

**Print this page and keep it handy during deployment!**

**Last Updated**: March 6, 2026
