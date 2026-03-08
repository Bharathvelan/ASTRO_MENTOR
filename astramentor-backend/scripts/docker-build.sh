#!/bin/bash
# Docker build and push script for AstraMentor backend

set -e

echo "=== AstraMentor Docker Build & Push ==="
echo ""

# Get AWS account ID and region
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=${AWS_REGION:-us-east-1}
ECR_REPOSITORY="astramentor-backend"
IMAGE_TAG=${1:-latest}

echo "AWS Account: $AWS_ACCOUNT_ID"
echo "AWS Region: $AWS_REGION"
echo "ECR Repository: $ECR_REPOSITORY"
echo "Image Tag: $IMAGE_TAG"
echo ""

# Login to ECR
echo "Logging in to ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Build Docker image
echo ""
echo "Building Docker image..."
cd "$(dirname "$0")/.."
docker build -t $ECR_REPOSITORY:$IMAGE_TAG .

# Tag image for ECR
echo ""
echo "Tagging image for ECR..."
docker tag $ECR_REPOSITORY:$IMAGE_TAG $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:$IMAGE_TAG

# Push to ECR
echo ""
echo "Pushing image to ECR..."
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:$IMAGE_TAG

echo ""
echo "=== Docker Build & Push Complete ==="
echo ""
echo "Image: $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:$IMAGE_TAG"
echo ""
echo "Next steps:"
echo "1. Update ECS service to use new image"
echo "2. Monitor deployment: aws ecs describe-services --cluster astramentor-cluster --services astramentor-service"
