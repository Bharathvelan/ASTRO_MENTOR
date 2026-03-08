# AstraMentor Backend

AI-powered Socratic tutoring platform backend built for the AI for Bharat Hackathon.

## Overview

AstraMentor is a sophisticated backend system that provides intelligent code learning assistance through:
- Multi-agent AI system with LangGraph orchestration
- 5-stage RAG pipeline for code understanding
- AWS Bedrock integration (Claude 3.5 Sonnet, Haiku, Titan Embeddings)
- Knowledge graph with NetworkX
- Vector search with FAISS
- Adaptive difficulty using Item Response Theory (IRT)

## Tech Stack

- **Framework**: FastAPI (Python 3.11+)
- **AI**: LangGraph, AWS Bedrock
- **Databases**: PostgreSQL, DynamoDB, Redis
- **Storage**: S3
- **Infrastructure**: AWS ECS Fargate, CDK
- **Code Analysis**: Tree-sitter (6 languages)
- **Vector Search**: FAISS
- **Knowledge Graph**: NetworkX

## Quick Start

### Prerequisites

- Python 3.11+
- Poetry
- PostgreSQL
- Redis
- AWS Account with Bedrock access

### Installation

```bash
# Install dependencies
poetry install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
# DATABASE_URL, AWS credentials, Cognito settings, etc.

# Run database migrations
poetry run alembic upgrade head

# Start development server
poetry run uvicorn src.api.main:app --reload --host 0.0.0.0 --port 8000
```

### Development

```bash
# Run tests
poetry run pytest

# Run with coverage
poetry run pytest --cov=src

# Format code
poetry run black src tests

# Lint
poetry run ruff src tests

# Type check
poetry run mypy src
```

## Project Structure

```
astramentor-backend/
├── src/
│   ├── api/              # FastAPI routes and middleware
│   ├── agents/           # AI agents (Tutor, Debugger, Builder, Verifier)
│   ├── core/             # Configuration
│   ├── db/               # Database models and clients
│   ├── services/         # Business logic (RAG, Bedrock, Parser, etc.)
│   └── utils/            # Utilities
├── tests/                # Tests
├── infrastructure/       # AWS CDK stacks
├── alembic/             # Database migrations
└── storage/             # Local storage for graphs and indices
```

## Implementation Status

✅ **Phase 1: Foundation** - Complete
- Project structure
- Database models (PostgreSQL, DynamoDB, Redis)
- Authentication (AWS Cognito JWT)
- Logging and error handling
- Retry logic

🚧 **Phase 2-8**: See [BACKEND_IMPLEMENTATION_SUMMARY.md](./BACKEND_IMPLEMENTATION_SUMMARY.md)

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Budget

Target: $300 AWS credits
- Free tier: RDS, ElastiCache
- Main costs: Bedrock API calls, ECS Fargate
- Estimated: $103-230/month

## Documentation

- [Implementation Summary](./BACKEND_IMPLEMENTATION_SUMMARY.md)
- [Phase 1 Guide](./docs/PHASE1_FOUNDATION.md)
- [Requirements](./.kiro/specs/astramentor-backend/requirements.md)
- [Design](./.kiro/specs/astramentor-backend/design.md)
- [Tasks](./.kiro/specs/astramentor-backend/tasks.md)

## License

MIT
