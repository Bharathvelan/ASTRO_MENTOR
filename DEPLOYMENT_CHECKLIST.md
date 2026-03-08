# AstraMentor Deployment Checklist

Quick reference checklist for deploying AstraMentor.

---

## Pre-Deployment Checklist

### Tools Installation
- [ ] AWS CLI installed and configured
- [ ] Python 3.11+ installed
- [ ] Node.js 18+ installed
- [ ] Poetry installed
- [ ] Docker installed
- [ ] AWS CDK CLI installed (`npm install -g aws-cdk`)

### AWS Account Setup
- [ ] AWS account created
- [ ] Billing enabled
- [ ] IAM user created with admin access
- [ ] Access keys generated
- [ ] AWS CLI configured (`aws configure`)
- [ ] Account verified (`aws sts get-caller-identity`)
- [ ] CDK bootstrapped (`cdk bootstrap`)

### AWS Cognito Setup
- [ ] User pool created
- [ ] App client created
- [ ] User pool ID saved
- [ ] App client ID saved

---

## Backend Deployment Checklist

### Environment Configuration
- [ ] Cloned repository
- [ ] Navigated to `astramentor-backend/`
- [ ] Ran `poetry install`
- [ ] Copied `.env.example` to `.env`
- [ ] Updated `.env` with:
  - [ ] AWS credentials
  - [ ] Cognito pool ID
  - [ ] Cognito client ID
  - [ ] AWS region
  - [ ] CORS origins

### Infrastructure Deployment
- [ ] Made scripts executable (`chmod +x scripts/*.sh`)
- [ ] Ran `./scripts/deploy.sh`
- [ ] Deployment completed successfully (10-15 min)
- [ ] Saved ALB DNS name from outputs
- [ ] Saved ECR repository URI from outputs

### Application Deployment
- [ ] Ran `./scripts/docker-build.sh`
- [ ] Docker image built successfully
- [ ] Image pushed to ECR
- [ ] Ran `./scripts/migrate.sh`
- [ ] Database migrations completed

### Verification
- [ ] Health check passes: `curl http://<alb-dns>/health`
- [ ] API docs accessible: `http://<alb-dns>/docs`
- [ ] ECS task running
- [ ] No errors in CloudWatch logs

---

## Frontend Deployment Checklist

### Environment Configuration
- [ ] Navigated to `astramentor-frontend/`
- [ ] Ran `npm install`
- [ ] Copied `.env.example` to `.env.local`
- [ ] Updated `.env.local` with:
  - [ ] Backend API URL (ALB DNS)
  - [ ] Cognito user pool ID
  - [ ] Cognito client ID
  - [ ] Cognito region

### Vercel Deployment
- [ ] Installed Vercel CLI (`npm install -g vercel`)
- [ ] Logged in to Vercel (`vercel login`)
- [ ] Deployed to production (`vercel --prod`)
- [ ] Deployment completed successfully
- [ ] Saved Vercel URL

### CORS Update
- [ ] Updated backend `.env` with Vercel URL in CORS_ORIGINS
- [ ] Redeployed backend (`./scripts/deploy.sh`)

### Verification
- [ ] Landing page loads
- [ ] Can register new user
- [ ] Can login
- [ ] Dashboard loads
- [ ] No console errors

---

## Post-Deployment Checklist

### User Setup
- [ ] Created first admin user
- [ ] Verified email address
- [ ] Tested login

### Monitoring Setup
- [ ] Subscribed email to SNS alarm topic
- [ ] Confirmed SNS subscription
- [ ] Verified alarm notifications work

### Cost Monitoring
- [ ] Set up billing alarm ($250 threshold)
- [ ] Checked current month costs
- [ ] Reviewed cost breakdown by service

### Testing
- [ ] Tested health endpoint
- [ ] Tested API documentation
- [ ] Tested user registration
- [ ] Tested user login
- [ ] Tested repository upload
- [ ] Tested AI chat
- [ ] Tested code execution

---

## Optional Enhancements

### Custom Domain
- [ ] Registered domain name
- [ ] Created Route 53 hosted zone
- [ ] Requested SSL certificate
- [ ] Added DNS records
- [ ] Updated frontend URL
- [ ] Updated backend CORS

### Security Hardening
- [ ] Enabled GuardDuty
- [ ] Enabled Security Hub
- [ ] Enabled AWS Config
- [ ] Reviewed security groups
- [ ] Rotated access keys

### Backup Configuration
- [ ] Enabled RDS automated backups
- [ ] Enabled DynamoDB point-in-time recovery
- [ ] Enabled S3 versioning
- [ ] Tested backup restoration

### Monitoring Enhancements
- [ ] Created CloudWatch dashboard
- [ ] Set up custom metrics
- [ ] Configured log insights queries
- [ ] Set up error tracking (Sentry)

---

## Maintenance Checklist

### Daily
- [ ] Check service health
- [ ] Review error logs
- [ ] Monitor costs

### Weekly
- [ ] Review CloudWatch alarms
- [ ] Check cost trends
- [ ] Review security groups
- [ ] Check for failed deployments

### Monthly
- [ ] Update dependencies
- [ ] Review and optimize costs
- [ ] Rotate credentials
- [ ] Review documentation
- [ ] Analyze usage patterns

---

## Troubleshooting Checklist

### Backend Issues
- [ ] Check ECS task status
- [ ] Review CloudWatch logs
- [ ] Verify database connectivity
- [ ] Check security group rules
- [ ] Verify environment variables
- [ ] Check IAM permissions

### Frontend Issues
- [ ] Check Vercel deployment logs
- [ ] Verify environment variables
- [ ] Check browser console errors
- [ ] Verify API connectivity
- [ ] Check CORS configuration
- [ ] Test authentication flow

### Cost Issues
- [ ] Review Cost Explorer
- [ ] Check Bedrock usage
- [ ] Review data transfer costs
- [ ] Optimize caching
- [ ] Review log retention
- [ ] Check auto-scaling settings

---

## Rollback Checklist

### Application Rollback
- [ ] Identified previous working version
- [ ] Tagged previous Docker image
- [ ] Deployed previous image
- [ ] Verified rollback successful
- [ ] Monitored for errors

### Database Rollback
- [ ] Identified target migration
- [ ] Backed up current database
- [ ] Ran downgrade migration
- [ ] Verified data integrity
- [ ] Tested application

### Infrastructure Rollback
- [ ] Identified previous CDK version
- [ ] Checked out previous commit
- [ ] Ran `cdk deploy`
- [ ] Verified resources
- [ ] Updated documentation

---

## Cleanup Checklist (If Needed)

### Backend Cleanup
- [ ] Ran `./scripts/destroy.sh`
- [ ] Verified CloudFormation stack deleted
- [ ] Deleted ECR images
- [ ] Deleted CloudWatch log groups
- [ ] Deleted S3 bucket contents

### Frontend Cleanup
- [ ] Ran `vercel remove`
- [ ] Verified project deleted
- [ ] Removed custom domain (if configured)

### AWS Cleanup
- [ ] Deleted Cognito user pool
- [ ] Deleted IAM users/roles (if created)
- [ ] Verified no remaining resources
- [ ] Checked final bill

---

## Success Criteria

### Backend
- ✅ Health endpoint returns "healthy"
- ✅ API documentation accessible
- ✅ ECS task running
- ✅ Database connected
- ✅ Redis connected
- ✅ No errors in logs

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

### Cost
- ✅ Monthly cost < $300
- ✅ Billing alarm set
- ✅ Cost breakdown reviewed
- ✅ Optimization opportunities identified

---

## Quick Commands Reference

```bash
# Check backend health
curl http://<alb-dns>/health

# View backend logs
aws logs tail /ecs/astramentor --follow

# Check ECS task status
aws ecs list-tasks --cluster astramentor-cluster

# Check current costs
aws ce get-cost-and-usage \
  --time-period Start=$(date +%Y-%m-01),End=$(date +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics BlendedCost

# Redeploy backend
cd astramentor-backend && ./scripts/deploy.sh

# Redeploy frontend
cd astramentor-frontend && vercel --prod

# Destroy everything
cd astramentor-backend && ./scripts/destroy.sh
```

---

## Support Resources

- **Deployment Guide**: `DEPLOYMENT_QUICKSTART.md`
- **Backend Docs**: `astramentor-backend/docs/DEPLOYMENT.md`
- **Frontend Docs**: `astramentor-frontend/README.md`
- **Architecture**: `astramentor-backend/docs/ARCHITECTURE.md`
- **API Reference**: `astramentor-backend/docs/API.md`

---

**Last Updated**: March 6, 2026
**Version**: 1.0.0
