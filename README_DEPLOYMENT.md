# 🚀 AstraMentor Deployment Guide

Welcome! This guide will help you deploy the complete AstraMentor platform (backend + frontend) to production.

---

## 📚 Documentation Overview

We've created several guides to help you deploy AstraMentor:

### 1. **DEPLOYMENT_QUICKSTART.md** ⭐ START HERE
   - **Best for**: First-time deployment
   - **Time**: 30-45 minutes
   - **Content**: Step-by-step instructions with commands
   - **Includes**: Prerequisites, backend deployment, frontend deployment, testing

### 2. **DEPLOYMENT_CHECKLIST.md**
   - **Best for**: Tracking progress and ensuring nothing is missed
   - **Time**: Reference document
   - **Content**: Checkboxes for every step
   - **Includes**: Pre-deployment, deployment, post-deployment, maintenance

### 3. **DEPLOYMENT_ARCHITECTURE.md**
   - **Best for**: Understanding how everything fits together
   - **Time**: 15 minutes read
   - **Content**: Visual diagrams and architecture explanations
   - **Includes**: Component diagrams, data flows, security layers

### 4. **astramentor-backend/docs/DEPLOYMENT.md**
   - **Best for**: Detailed backend deployment reference
   - **Time**: Reference document
   - **Content**: Comprehensive backend deployment guide
   - **Includes**: Troubleshooting, rollback, scaling, security

---

## 🎯 Quick Start (TL;DR)

If you just want to get started quickly:

```bash
# 1. Install tools
npm install -g aws-cdk vercel
pip install poetry

# 2. Configure AWS
aws configure

# 3. Deploy backend
cd astramentor-backend
poetry install
cp .env.example .env
# Edit .env with your AWS credentials
./scripts/deploy.sh
./scripts/docker-build.sh
./scripts/migrate.sh

# 4. Deploy frontend
cd ../astramentor-frontend
npm install
cp .env.example .env.local
# Edit .env.local with backend URL
vercel --prod

# 5. Test
curl http://<your-alb-dns>/health
open https://<your-vercel-url>
```

**For detailed instructions, see DEPLOYMENT_QUICKSTART.md**

---

## 📋 What You'll Deploy

### Backend (AWS)
- **FastAPI application** running on ECS Fargate
- **PostgreSQL database** for structured data
- **Redis cache** for performance
- **DynamoDB** for chat messages
- **S3** for repository storage
- **AWS Bedrock** for AI (Claude 3.5)
- **CloudWatch** for monitoring

### Frontend (Vercel)
- **Next.js 14 application** with TypeScript
- **AWS Amplify** for authentication
- **Monaco editor** for code editing
- **React Flow** for knowledge graphs
- **SSE streaming** for real-time chat

---

## 💰 Cost Estimate

**Monthly costs for 5,000 interactions:**

| Component | Cost |
|-----------|------|
| AWS Bedrock (AI) | $65-110 |
| ECS Fargate | $15-20 |
| RDS PostgreSQL | $15 |
| ElastiCache Redis | $12 |
| DynamoDB | $5-10 |
| S3 + CloudFront | $5-10 |
| Other AWS services | $5-10 |
| Vercel (Frontend) | $0 (free tier) |
| **Total** | **$125-200/month** |

✅ **Within $300 budget**

**Free tier benefits (first 12 months):**
- RDS: 750 hours/month free
- ElastiCache: 750 hours/month free
- S3: 5GB storage free
- CloudFront: 50GB transfer free

---

## ⏱️ Time Estimate

| Phase | Time |
|-------|------|
| Install tools | 10 min |
| Configure AWS | 5 min |
| Set up Cognito | 5 min |
| Deploy backend infrastructure | 15 min |
| Build and deploy backend app | 10 min |
| Deploy frontend | 10 min |
| Post-deployment setup | 10 min |
| Testing | 10 min |
| **Total** | **~75 minutes** |

---

## ✅ Prerequisites

Before you start, make sure you have:

- [ ] AWS account with billing enabled
- [ ] Credit card on file (for AWS charges)
- [ ] Command line access (Terminal/PowerShell)
- [ ] Basic familiarity with command line
- [ ] ~1-2 hours of time

**No prior AWS or deployment experience required!** The guides walk you through everything.

---

## 🎓 Deployment Paths

Choose the path that fits your needs:

### Path 1: Full Production Deployment (Recommended)
**Goal**: Deploy both backend and frontend to production

1. Read **DEPLOYMENT_QUICKSTART.md** (30 min)
2. Follow the steps to deploy backend to AWS (30 min)
3. Follow the steps to deploy frontend to Vercel (15 min)
4. Test the deployment (15 min)

**Total time**: ~90 minutes
**Result**: Fully deployed, production-ready platform

### Path 2: Backend Only (Testing)
**Goal**: Deploy just the backend for API testing

1. Read **DEPLOYMENT_QUICKSTART.md** Part 1 (15 min)
2. Deploy backend to AWS (45 min)
3. Test with curl or Postman (15 min)

**Total time**: ~75 minutes
**Result**: Backend API ready for testing

### Path 3: Local Development
**Goal**: Run everything locally for development

1. See **astramentor-backend/README.md** for backend setup
2. See **astramentor-frontend/README.md** for frontend setup
3. Run both locally

**Total time**: ~30 minutes
**Result**: Local development environment

---

## 📖 Step-by-Step Guide

### Step 1: Choose Your Guide

**New to deployment?** → Start with **DEPLOYMENT_QUICKSTART.md**

**Want to track progress?** → Use **DEPLOYMENT_CHECKLIST.md**

**Want to understand architecture?** → Read **DEPLOYMENT_ARCHITECTURE.md**

### Step 2: Install Prerequisites

Follow the tool installation section in **DEPLOYMENT_QUICKSTART.md**

Required tools:
- AWS CLI
- Python 3.11+
- Node.js 18+
- Poetry
- Docker
- AWS CDK CLI

### Step 3: Deploy Backend

Follow Part 1 of **DEPLOYMENT_QUICKSTART.md**

This will:
1. Configure AWS credentials
2. Set up AWS Cognito for authentication
3. Deploy infrastructure with CDK
4. Build and push Docker image
5. Run database migrations
6. Verify deployment

### Step 4: Deploy Frontend

Follow Part 2 of **DEPLOYMENT_QUICKSTART.md**

This will:
1. Configure environment variables
2. Deploy to Vercel
3. Update backend CORS
4. Verify deployment

### Step 5: Post-Deployment

Follow Part 3 of **DEPLOYMENT_QUICKSTART.md**

This will:
1. Create your first user
2. Subscribe to cost alarms
3. Test the full system
4. Monitor costs

---

## 🧪 Testing Your Deployment

After deployment, test these features:

### Backend Tests
```bash
# Health check
curl http://your-alb-dns/health

# API documentation
open http://your-alb-dns/docs

# Upload repository (requires auth token)
curl -X POST http://your-alb-dns/api/v1/repo/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@test-repo.zip"
```

### Frontend Tests
1. Visit your Vercel URL
2. Register a new account
3. Verify email
4. Login
5. Upload a repository
6. Chat with the AI
7. Execute code in playground

### Full Integration Test
1. Upload a small Python project
2. Wait for indexing to complete
3. Ask: "What does this code do?"
4. Verify AI responds with code analysis
5. Try code execution in playground

---

## 🔧 Troubleshooting

### Common Issues

**Problem**: AWS CLI not configured
```bash
# Solution
aws configure
# Enter your access key, secret key, region (us-east-1)
```

**Problem**: CDK bootstrap fails
```bash
# Solution
cdk bootstrap aws://ACCOUNT-ID/us-east-1
# Replace ACCOUNT-ID with your AWS account ID
```

**Problem**: Docker build fails
```bash
# Solution
# Make sure Docker is running
docker ps
# If not, start Docker Desktop
```

**Problem**: Health check fails
```bash
# Solution
# Check ECS task logs
aws logs tail /ecs/astramentor --follow
# Look for errors in the logs
```

**Problem**: Frontend can't connect to backend
```bash
# Solution
# 1. Verify NEXT_PUBLIC_API_URL in Vercel
# 2. Check CORS_ORIGINS in backend .env
# 3. Redeploy backend with updated CORS
```

**For more troubleshooting**, see:
- **DEPLOYMENT_QUICKSTART.md** - Troubleshooting section
- **astramentor-backend/docs/DEPLOYMENT.md** - Detailed troubleshooting

---

## 📊 Monitoring Your Deployment

### Daily Checks
```bash
# Check health
curl http://your-alb-dns/health

# Check costs
aws ce get-cost-and-usage \
  --time-period Start=$(date +%Y-%m-01),End=$(date +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics BlendedCost
```

### Weekly Checks
- Review CloudWatch alarms
- Check error logs
- Review cost trends
- Verify backups

### Monthly Checks
- Update dependencies
- Review and optimize costs
- Rotate credentials
- Review security

---

## 🛡️ Security Best Practices

✅ **Implemented by default:**
- VPC with private subnets
- Security groups (least privilege)
- Encryption at rest (RDS, DynamoDB, S3)
- TLS 1.2+ for all connections
- JWT authentication
- Input sanitization
- Rate limiting
- Code execution sandbox

⚠️ **Recommended additions:**
- Enable GuardDuty
- Enable Security Hub
- Set up AWS Config
- Regular security audits
- Rotate access keys monthly

---

## 📈 Scaling Your Deployment

### Current Capacity (MVP)
- 1-5 ECS tasks
- ~1,000 requests/minute
- ~5,000 interactions/month
- Cost: $125-200/month

### Scaling Options

**Vertical Scaling** (increase resources):
```python
# In infrastructure/stacks/astramentor_stack.py
cpu=1024,  # Increase from 512
memory_limit_mib=2048,  # Increase from 1024
```

**Horizontal Scaling** (add more tasks):
```python
# In infrastructure/stacks/astramentor_stack.py
min_capacity=2,  # Increase from 1
max_capacity=10  # Increase from 5
```

**Database Scaling**:
```bash
# Upgrade RDS instance
aws rds modify-db-instance \
  --db-instance-identifier astramentor-db \
  --db-instance-class db.t3.small
```

---

## 🧹 Cleanup (If Needed)

To delete all resources and stop charges:

```bash
# Delete backend
cd astramentor-backend
./scripts/destroy.sh

# Delete frontend
vercel remove astramentor-frontend

# Delete Cognito
aws cognito-idp delete-user-pool --user-pool-id <pool-id>

# Verify all resources deleted
aws cloudformation list-stacks --stack-status-filter DELETE_COMPLETE
```

---

## 📞 Getting Help

### Documentation
- **DEPLOYMENT_QUICKSTART.md** - Step-by-step deployment
- **DEPLOYMENT_CHECKLIST.md** - Progress tracking
- **DEPLOYMENT_ARCHITECTURE.md** - Architecture diagrams
- **astramentor-backend/docs/** - Detailed backend docs
- **astramentor-frontend/README.md** - Frontend documentation

### Common Resources
- AWS Documentation: https://docs.aws.amazon.com
- Vercel Documentation: https://vercel.com/docs
- Next.js Documentation: https://nextjs.org/docs
- FastAPI Documentation: https://fastapi.tiangolo.com

### Troubleshooting
1. Check the troubleshooting section in **DEPLOYMENT_QUICKSTART.md**
2. Review CloudWatch logs: `aws logs tail /ecs/astramentor --follow`
3. Check Vercel deployment logs in the Vercel dashboard
4. Review the detailed troubleshooting in **astramentor-backend/docs/DEPLOYMENT.md**

---

## 🎉 Success Criteria

Your deployment is successful when:

### Backend
- ✅ Health endpoint returns `{"status":"healthy"}`
- ✅ API documentation accessible at `/docs`
- ✅ ECS task running without errors
- ✅ Database connected
- ✅ Redis connected

### Frontend
- ✅ Landing page loads
- ✅ User can register
- ✅ User can login
- ✅ Dashboard loads
- ✅ Can upload repository
- ✅ AI chat works

### Monitoring
- ✅ CloudWatch logs flowing
- ✅ Alarms configured
- ✅ SNS notifications working
- ✅ Cost tracking enabled

### Performance
- ✅ Health check < 200ms
- ✅ API response < 1s
- ✅ Frontend load < 3s
- ✅ No 5xx errors

---

## 🚀 Next Steps After Deployment

### Immediate (Day 1)
1. Test all features thoroughly
2. Create your first user account
3. Upload a test repository
4. Subscribe to cost alarms
5. Monitor for errors

### Short-term (Week 1)
1. Configure custom domain (optional)
2. Set up SSL certificate
3. Enable CloudWatch dashboards
4. Configure backup automation
5. Invite beta users

### Long-term (Month 1)
1. Implement remaining optional endpoints
2. Add comprehensive monitoring
3. Optimize costs based on usage
4. Gather user feedback
5. Plan feature enhancements

---

## 📝 Deployment Summary

**What you're deploying:**
- Production-ready AI-powered coding tutor
- Multi-agent system with adaptive difficulty
- Advanced RAG pipeline with hybrid retrieval
- Code execution sandbox
- Real-time chat with SSE streaming
- Knowledge graph visualization
- Repository management

**Where it's deployed:**
- Backend: AWS (ECS Fargate, RDS, Redis, DynamoDB, S3)
- Frontend: Vercel (Next.js, global CDN)
- AI: AWS Bedrock (Claude 3.5 Sonnet, Haiku, Titan)

**Cost:**
- $125-200/month (within $300 budget)
- Free tier benefits for first 12 months

**Time:**
- ~75-90 minutes for full deployment
- ~30 minutes for backend only
- ~15 minutes for frontend only

---

## 🎯 Ready to Deploy?

1. **Start here**: Open **DEPLOYMENT_QUICKSTART.md**
2. **Track progress**: Use **DEPLOYMENT_CHECKLIST.md**
3. **Understand architecture**: Read **DEPLOYMENT_ARCHITECTURE.md**
4. **Get detailed help**: See **astramentor-backend/docs/DEPLOYMENT.md**

**Good luck with your deployment! 🚀**

---

**Last Updated**: March 6, 2026
**Version**: 1.0.0
**Status**: Production Ready
