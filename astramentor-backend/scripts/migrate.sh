#!/bin/bash
# Database migration script for AstraMentor backend

set -e

echo "=== AstraMentor Database Migration ==="
echo ""

# Get database credentials from Secrets Manager
echo "Retrieving database credentials..."
DB_SECRET=$(aws secretsmanager get-secret-value --secret-id astramentor-db-credentials --query SecretString --output text)
DB_USERNAME=$(echo $DB_SECRET | jq -r .username)
DB_PASSWORD=$(echo $DB_SECRET | jq -r .password)

# Get database endpoint from CloudFormation outputs
echo "Retrieving database endpoint..."
DB_ENDPOINT=$(aws cloudformation describe-stacks --stack-name AstraMentorStack --query "Stacks[0].Outputs[?OutputKey=='DatabaseEndpoint'].OutputValue" --output text)

# Construct database URL
DATABASE_URL="postgresql://$DB_USERNAME:$DB_PASSWORD@$DB_ENDPOINT/astramentor"

echo "Database: $DB_ENDPOINT"
echo ""

# Run Alembic migrations
echo "Running database migrations..."
cd "$(dirname "$0")/.."
export DATABASE_URL
poetry run alembic upgrade head

echo ""
echo "=== Database Migration Complete ==="
