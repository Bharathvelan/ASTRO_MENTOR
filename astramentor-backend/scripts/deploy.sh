#!/bin/bash
# Deployment script for AstraMentor backend infrastructure

set -e

echo "=== AstraMentor Backend Deployment ==="
echo ""

# Check prerequisites
echo "Checking prerequisites..."
command -v aws >/dev/null 2>&1 || { echo "AWS CLI is required but not installed. Aborting." >&2; exit 1; }
command -v cdk >/dev/null 2>&1 || { echo "AWS CDK CLI is required but not installed. Run: npm install -g aws-cdk" >&2; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "Python 3 is required but not installed. Aborting." >&2; exit 1; }

# Check AWS credentials
echo "Checking AWS credentials..."
aws sts get-caller-identity >/dev/null 2>&1 || { echo "AWS credentials not configured. Run: aws configure" >&2; exit 1; }

# Navigate to infrastructure directory
cd "$(dirname "$0")/../infrastructure"

# Install CDK dependencies
echo ""
echo "Installing CDK dependencies..."
if [ ! -d ".venv" ]; then
    python3 -m venv .venv
fi
source .venv/bin/activate
pip install -q -r requirements.txt

# Synthesize CloudFormation template
echo ""
echo "Synthesizing CloudFormation template..."
cdk synth

# Deploy stack
echo ""
echo "Deploying stack to AWS..."
echo "This will create resources that may incur costs."
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cdk deploy --require-approval never
    echo ""
    echo "=== Deployment Complete ==="
    echo ""
    echo "Next steps:"
    echo "1. Build and push Docker image: ./scripts/docker-build.sh"
    echo "2. Run database migrations: ./scripts/migrate.sh"
    echo "3. Check deployment: aws ecs describe-services --cluster astramentor-cluster --services astramentor-service"
else
    echo "Deployment cancelled."
    exit 1
fi
