# Phase 1: Foundation - Implementation Guide

## Overview
Set up project structure, database models, authentication, and logging infrastructure.

## Step 1: Project Setup

### 1.1 Initialize Python Project with Poetry

```bash
# Create project directory
mkdir astramentor-backend
cd astramentor-backend

# Initialize Poetry
poetry init --name astramentor-backend --python "^3.11"

# Add dependencies
poetry add fastapi uvicorn[standard] sqlalchemy alembic psycopg2-binary
poetry add boto3 pydantic pydantic-settings python-jose[cryptography]
poetry add redis structlog tenacity circuitbreaker
poetry add langgraph langchain langchain-aws faiss-cpu networkx
poetry add tree-sitter tree-sitter-python tree-sitter-javascript
poetry add tree-sitter-typescript tree-sitter-java tree-sitter-go tree-sitter-rust

# Add dev dependencies
poetry add --group dev pytest pytest-asyncio pytest-cov hypothesis black ruff mypy
```

### 1.2 Create Directory Structure

```bash
mkdir -p src/{api,core,db,services,agents,utils}
mkdir -p src/api/{routes,middleware,dependencies}
mkdir -p src/db/{models,repositories}
mkdir -p src/services/{bedrock,rag,parser,graph,vector}
mkdir -p src/agents/{tutor,debugger,builder,verifier}
mkdir -p tests/{unit,integration,property}
mkdir -p infrastructure
mkdir -p storage/{graphs,indices,repos}
```

### 1.3 Create Configuration Files

**pyproject.toml** (Poetry configuration):
```toml
[tool.poetry]
name = "astramentor-backend"
version = "0.1.0"
description = "AI-powered Socratic tutoring backend"
authors = ["Your Name <your.email@example.com>"]

[tool.poetry.dependencies]
python = "^3.11"
fastapi = "^0.109.0"
# ... (dependencies from above)

[tool.black]
line-length = 100
target-version = ['py311']

[tool.ruff]
line-length = 100
target-version = "py311"

[tool.mypy]
python_version = "3.11"
strict = true
```

**src/core/config.py** (Application configuration):
```python
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    # Application
    APP_NAME: str = "AstraMentor Backend"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False
    
    # API
    API_V1_PREFIX: str = "/api/v1"
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]
    
    # Database - PostgreSQL
    DATABASE_URL: str
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20
    
    # DynamoDB
    AWS_REGION: str = "us-east-1"
    DYNAMODB_CHAT_TABLE: str = "astramentor-chat-messages"
    DYNAMODB_INTERACTIONS_TABLE: str = "astramentor-agent-interactions"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_MAX_CONNECTIONS: int = 50
    
    # AWS Bedrock
    BEDROCK_REGION: str = "us-east-1"
    CLAUDE_SONNET_MODEL_ID: str = "anthropic.claude-3-5-sonnet-20240620-v1:0"
    CLAUDE_HAIKU_MODEL_ID: str = "anthropic.claude-3-haiku-20240307-v1:0"
    TITAN_EMBEDDINGS_MODEL_ID: str = "amazon.titan-embed-text-v1"
    
    # AWS Cognito
    COGNITO_REGION: str = "us-east-1"
    COGNITO_USER_POOL_ID: str
    COGNITO_CLIENT_ID: str
    COGNITO_JWKS_URL: Optional[str] = None
    
    # S3
    S3_BUCKET_NAME: str = "astramentor-repositories"
    
    # Storage Paths
    GRAPH_STORAGE_PATH: str = "./storage/graphs"
    VECTOR_STORAGE_PATH: str = "./storage/indices"
    REPO_STORAGE_PATH: str = "./storage/repos"
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    
    # Cost Tracking
    COST_ALERT_THRESHOLD_1: float = 100.0
    COST_ALERT_THRESHOLD_2: float = 200.0
    COST_ALERT_THRESHOLD_3: float = 280.0
    
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)

settings = Settings()
```

**.env.example**:
```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/astramentor

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# Cognito
COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
COGNITO_CLIENT_ID=your_client_id

# S3
S3_BUCKET_NAME=astramentor-repositories

# Redis
REDIS_URL=redis://localhost:6379/0
```

## Step 2: Database Models

### 2.1 SQLAlchemy Base and Session

**src/db/base.py**:
```python
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from src.core.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    pool_size=settings.DB_POOL_SIZE,
    max_overflow=settings.DB_MAX_OVERFLOW,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

### 2.2 Database Models

**src/db/models/user.py**:
```python
from sqlalchemy import Column, String, DateTime, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
import enum
from src.db.base import Base

class UserRole(str, enum.Enum):
    USER = "user"
    ADMIN = "admin"

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cognito_sub = Column(String, unique=True, nullable=False, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=False)
    role = Column(SQLEnum(UserRole), default=UserRole.USER, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

**src/db/models/repository.py**:
```python
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum
from src.db.base import Base

class IndexingStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"

class Repository(Base):
    __tablename__ = "repositories"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    s3_key = Column(String, nullable=False)
    file_count = Column(Integer, default=0)
    total_size_bytes = Column(Integer, default=0)
    indexing_status = Column(SQLEnum(IndexingStatus), default=IndexingStatus.PENDING)
    indexing_progress = Column(Integer, default=0)
    indexed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    user = relationship("User", backref="repositories")
```

**src/db/models/session.py**:
```python
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from src.db.base import Base

class Session(Base):
    __tablename__ = "sessions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    repository_id = Column(UUID(as_uuid=True), ForeignKey("repositories.id"), nullable=True, index=True)
    title = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", backref="sessions")
    repository = relationship("Repository", backref="sessions")
```

**src/db/models/progress.py**, **challenge.py**, **snippet.py**: See created files.

### 2.3 Initialize Alembic

```bash
# Create initial migration
poetry run alembic revision --autogenerate -m "Initial schema"

# Apply migration
poetry run alembic upgrade head
```

## Step 3: Authentication

**src/api/middleware/auth.py** - JWT validation with AWS Cognito (created)

Key features:
- Fetches JWKS from Cognito
- Validates JWT tokens
- Extracts user claims
- Provides FastAPI dependencies

## Step 4: Logging and Error Handling

**src/api/middleware/logging.py** - Structured logging with structlog (created)
**src/api/middleware/error_handlers.py** - Global exception handlers (created)
**src/utils/retry.py** - Retry decorators with exponential backoff (created)

## Step 5: DynamoDB and Redis Clients

**src/db/dynamodb.py** - DynamoDB client for chat messages and interactions (created)
**src/db/redis.py** - Redis client for caching (created)

## Step 6: FastAPI Application

**src/api/main.py** - Main FastAPI application with middleware (created)

Features:
- CORS middleware
- Logging middleware
- Exception handlers
- Health check endpoint
- Lifespan management for Redis

## Testing Phase 1

```bash
# Start PostgreSQL and Redis locally
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=password postgres:15
docker run -d -p 6379:6379 redis:7

# Update .env with local database URL
DATABASE_URL=postgresql://postgres:password@localhost:5432/astramentor

# Run migrations
poetry run alembic upgrade head

# Start server
poetry run uvicorn src.api.main:app --reload

# Test health endpoint
curl http://localhost:8000/health
```

## Phase 1 Complete! ✅

You now have:
- ✅ Project structure with Poetry
- ✅ Database models (PostgreSQL)
- ✅ DynamoDB client
- ✅ Redis client
- ✅ JWT authentication
- ✅ Structured logging
- ✅ Error handling
- ✅ Retry logic
- ✅ FastAPI application

## Next Steps

Proceed to **Phase 2: Data Layer** to implement:
- Tree-sitter code parser
- NetworkX knowledge graph
- FAISS vector store
- Code analysis features

See [BACKEND_IMPLEMENTATION_SUMMARY.md](../BACKEND_IMPLEMENTATION_SUMMARY.md) for the complete roadmap.
