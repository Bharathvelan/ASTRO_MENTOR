#!/bin/bash
# Destroy script for AstraMentor backend infrastructure

set -e

echo "=== AstraMentor Infrastructure Destruction ==="
echo ""
echo "WARNING: This will delete all resources and data!"
echo "This action cannot be undone."
echo ""
read -p "Are you sure you want to destroy the infrastructure? (yes/no) " -r
echo

if [[ $REPLY == "yes" ]]; then
    cd "$(dirname "$0")/../infrastructure"
    
    # Activate virtual environment
    if [ -d ".venv" ]; then
        source .venv/bin/activate
    fi
    
    echo "Destroying stack..."
    cdk destroy --force
    
    echo ""
    echo "=== Infrastructure Destroyed ==="
else
    echo "Destruction cancelled."
    exit 1
fi
