# AstraMentor Backend - Implementation Guide

## Current Status

✅ **Phase 1: Foundation - COMPLETE** (See [PHASE1_COMPLETE.md](./PHASE1_COMPLETE.md))

All foundation components are implemented and ready to use:
- ✅ Project structure with Poetry
- ✅ Database models (PostgreSQL, DynamoDB, Redis)
- ✅ Authentication (AWS Cognito JWT)
- ✅ Logging and error handling
- ✅ Retry logic
- ✅ FastAPI application
- ✅ Alembic migrations
- ✅ Development tooling (Makefile, pytest, linting)

🚧 **Phase 2: Data Layer - NEXT**
- Tree-sitter code parser
- NetworkX knowledge graph
- FAISS vector store

## Getting Started

### 1. Install Dependencies

```bash
# Install Poetry if not already installed
curl -sSL https://install.python-poetry.org | python3 -

# Install project dependencies
make install
# or: poetry install
```

### 2. Set Up Local Development Environment

```bash
# Start PostgreSQL and Redis with Docker
make docker-db

# Or manually:
docker run -d --name astramentor-postgres -p 5432:5432 \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=astramentor \
  postgres:15

docker run -d --name astramentor-redis -p 6379:6379 redis:7
```

### 3. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your settings
# Minimum required for local development:
DATABASE_URL=postgresql://postgres:password@localhost:5432/astramentor
REDIS_URL=redis://localhost:6379/0
COGNITO_USER_POOL_ID=your_pool_id
COGNITO_CLIENT_ID=your_client_id
```

### 4. Run Database Migrations

```bash
# Create initial migration
make migrate-create msg="Initial schema"

# Apply migrations
make migrate
# or: poetry run alembic upgrade head
```

### 5. Start Development Server

```bash
make run
# or: poetry run uvicorn src.api.main:app --reload
```

Visit:
- API: http://localhost:8000
- Docs: http://localhost:8000/docs
- Health: http://localhost:8000/health

## Development Workflow

### Running Tests

```bash
# Run all tests
make test

# Run with coverage
make test-cov

# Run specific test types
poetry run pytest -m unit
poetry run pytest -m integration
poetry run pytest -m property
```

### Code Quality

```bash
# Format code
make format

# Lint code
make lint

# Type check
poetry run mypy src
```

### Database Migrations

```bash
# Create new migration
make migrate-create msg="Add new table"

# Apply migrations
make migrate

# Rollback one migration
poetry run alembic downgrade -1

# View migration history
poetry run alembic history
```

## Next Steps: Phase 2 - Data Layer

Now that Phase 1 is complete, proceed to Phase 2 to implement:

### 2.1 Code Parser (Tree-sitter)
Create `src/services/parser/code_parser.py`:
- Set up Tree-sitter parsers for 6 languages
- Extract functions, classes, imports, variables
- Calculate complexity metrics
- Detect code smells

### 2.2 Knowledge Graph (NetworkX)
Create `src/services/graph/knowledge_graph.py`:
- Build graph from parsed code
- Store nodes (files, classes, functions)
- Create edges (imports, calls, extends)
- Implement graph queries

### 2.3 Vector Store (FAISS)
Create `src/services/vector/vector_store.py`:
- Initialize FAISS HNSW index
- Implement semantic chunking
- Add vector search
- Persist indices to disk

See [BACKEND_IMPLEMENTATION_SUMMARY.md](./BACKEND_IMPLEMENTATION_SUMMARY.md) for the complete roadmap.

## Project Structure

```
astramentor-backend/
├── src/
│   ├── api/
│   │   ├── main.py              ✅ FastAPI app
│   │   ├── middleware/
│   │   │   ├── auth.py          ✅ JWT validation
│   │   │   ├── logging.py       ✅ Request logging
│   │   │   └── error_handlers.py ✅ Exception handlers
│   │   └── routes/              🚧 TODO: API endpoints
│   ├── core/
│   │   └── config.py            ✅ Configuration
│   ├── db/
│   │   ├── base.py              ✅ SQLAlchemy setup
│   │   ├── models/              ✅ All database models
│   │   ├── dynamodb.py          ✅ DynamoDB client
│   │   └── redis.py             ✅ Redis client
│   ├── services/                🚧 TODO: Business logic
│   ├── agents/                  🚧 TODO: AI agents
│   └── utils/
│       └── retry.py             ✅ Retry decorators
├── tests/                       🚧 TODO: Tests
├── alembic/                     ✅ Migrations setup
├── storage/                     ✅ Local storage dirs
├── pyproject.toml               ✅ Dependencies
├── .env.example                 ✅ Environment template
├── Makefile                     ✅ Dev commands
└── README.md                    ✅ Documentation
```

## Common Tasks

### Add a New Database Model

1. Create model file in `src/db/models/`
2. Import in `src/db/models/__init__.py`
3. Create migration: `make migrate-create msg="Add model"`
4. Apply migration: `make migrate`

### Add a New API Endpoint

1. Create route file in `src/api/routes/`
2. Import and register in `src/api/main.py`
3. Add authentication if needed: `Depends(get_current_user)`
4. Add tests in `tests/integration/`

### Add a New Service

1. Create service file in `src/services/`
2. Implement business logic
3. Add unit tests in `tests/unit/`
4. Add property tests in `tests/property/`

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Test connection
psql postgresql://postgres:password@localhost:5432/astramentor

# Reset database
docker stop astramentor-postgres
docker rm astramentor-postgres
make docker-db
make migrate
```

### Redis Connection Issues

```bash
# Check Redis is running
docker ps | grep redis

# Test connection
redis-cli ping

# Reset Redis
docker stop astramentor-redis
docker rm astramentor-redis
make docker-db
```

### Import Errors

```bash
# Ensure you're in the project root
pwd  # Should show .../astramentor-backend

# Reinstall dependencies
poetry install

# Check Python path
poetry run python -c "import sys; print(sys.path)"
```

## AWS Setup (for Production)

### 1. Enable Bedrock Access

1. Go to AWS Console → Bedrock
2. Request model access for:
   - Claude 3.5 Sonnet
   - Claude 3 Haiku
   - Titan Embeddings G1

### 2. Create Cognito User Pool

```bash
# Use AWS Console or CLI
aws cognito-idp create-user-pool \
  --pool-name astramentor-users \
  --auto-verified-attributes email

# Create app client
aws cognito-idp create-user-pool-client \
  --user-pool-id <pool-id> \
  --client-name astramentor-api
```

### 3. Create DynamoDB Tables

```bash
# Chat messages table
aws dynamodb create-table \
  --table-name astramentor-chat-messages \
  --attribute-definitions \
    AttributeName=session_id,AttributeType=S \
    AttributeName=timestamp,AttributeType=S \
  --key-schema \
    AttributeName=session_id,KeyType=HASH \
    AttributeName=timestamp,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST

# Agent interactions table
aws dynamodb create-table \
  --table-name astramentor-agent-interactions \
  --attribute-definitions \
    AttributeName=user_id,AttributeType=S \
    AttributeName=timestamp,AttributeType=S \
  --key-schema \
    AttributeName=user_id,KeyType=HASH \
    AttributeName=timestamp,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST
```

### 4. Create S3 Bucket

```bash
aws s3 mb s3://astramentor-repositories
```

## Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [Alembic Documentation](https://alembic.sqlalchemy.org/)
- [AWS Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [Poetry Documentation](https://python-poetry.org/docs/)

## Support

For issues or questions:
1. Check the [spec documents](./.kiro/specs/astramentor-backend/)
2. Review [BACKEND_IMPLEMENTATION_SUMMARY.md](./BACKEND_IMPLEMENTATION_SUMMARY.md)
3. Check [docs/PHASE1_FOUNDATION.md](./docs/PHASE1_FOUNDATION.md)
