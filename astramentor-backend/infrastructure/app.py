#!/usr/bin/env python3
"""
AWS CDK App for AstraMentor Backend Infrastructure
"""
import aws_cdk as cdk
from stacks.astramentor_stack import AstraMentorStack


app = cdk.App()

# Get environment configuration
env = cdk.Environment(
    account=app.node.try_get_context("account"),
    region=app.node.try_get_context("region") or "us-east-1"
)

# Create the main stack
AstraMentorStack(
    app,
    "AstraMentorStack",
    env=env,
    description="AstraMentor AI-powered Socratic tutoring backend infrastructure"
)

app.synth()
