# AstraMentor Backend Developer Guide

## Getting Started

### Local Development Setup

1. **Clone Repository**
   ```bash
   git clone https://github.com/astramentor/backend.git
   cd backend
   ```

2. **Install Poetry**
   ```bash
   curl -sSL https://install.python-poetry.org | python3 -
   ```

3. **Install Dependencies**
   ```bash
   poetry install
   ```

4. **Set Up Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your local configuration
   ```

5. **Start Local Services**
   ```bash
   # PostgreSQL
   docker run -d --name postgres \
     -e POSTGRES_PASSWORD=password \
     -e POSTGRES_DB=astramentor \
     -p 5432:5432 \
     postgres:15

   # Redis
   docker run -d --name redis \
     -p 6379:6379 \
     redis:7

   # DynamoDB Local
   docker run -d --name dynamodb \
     -p 8000:8000 \
     amazon/dynamodb-local
   ```

6. **Run Database Migrations**
   ```bash
   poetry run alembic upgrade head
   ```

7. **Start Development Server**
   ```bash
   poetry run uvicorn src.api.main:app --reload --host 0.0.0.0 --port 8000
   ```

8. **Access API**
   - API: http://localhost:8000
   - Docs: http://localhost:8000/docs
   - ReDoc: http://localhost:8000/redoc

## Project Structure

```
astramentor-backend/
├── src/
│   ├── agents/              # AI agents
│   │   ├── base.py         # Base agent class
│   │   ├── tutor.py        # Socratic tutor
│   │   ├── debugger.py     # Error analyzer
│   │   ├── builder.py      # Code generator
│   │   ├── verifier.py     # Test generator
│   │   └── orchestrator.py # Agent coordinator
│   ├── api/                # FastAPI application
│   │   ├── main.py         # App entry point
│   │   ├── middleware/     # Request/response middleware
│   │   ├── models/         # Pydantic schemas
│   │   └── routes/         # Endpoint handlers
│   ├── core/               # Core configuration
│   │   └── config.py       # Settings management
│   ├── db/                 # Database layer
│   │   ├── base.py         # SQLAlchemy base
│   │   ├── models/         # ORM models
│   │   ├── dynamodb.py     # DynamoDB client
│   │   └── redis.py        # Redis client
│   ├── services/           # Business logic
│   │   ├── bedrock/        # AWS Bedrock client
│   │   ├── graph/          # Knowledge graph
│   │   ├── indexing/       # Repository indexing
│   │   ├── irt/            # Adaptive difficulty
│   │   ├── parser/         # Code parsing
│   │   ├── rag/            # RAG pipeline
│   │   ├── sandbox/        # Code execution
│   │   └── vector/         # Vector store
│   └── utils/              # Utilities
│       ├── circuit_breaker.py
│       ├── encryption.py
│       ├── fallback.py
│       ├── retry.py
│       └── sanitizer.py
├── tests/                  # Test suite
│   ├── unit/              # Unit tests
│   ├── integration/       # Integration tests
│   └── property/          # Property-based tests
├── infrastructure/         # AWS CDK
│   ├── app.py             # CDK app
│   ├── cdk.json           # CDK config
│   └── stacks/            # CDK stacks
├── scripts/               # Deployment scripts
├── docs/                  # Documentation
├── alembic/               # Database migrations
├── storage/               # Local storage
├── pyproject.toml         # Dependencies
├── pytest.ini             # Test configuration
└── README.md              # Project overview
```

## Development Workflow

### Creating a New Feature

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Write Tests First** (TDD)
   ```python
   # tests/unit/test_my_feature.py
   def test_my_feature():
       result = my_feature()
       assert result == expected
   ```

3. **Implement Feature**
   ```python
   # src/services/my_feature.py
   def my_feature():
       # Implementation
       pass
   ```

4. **Run Tests**
   ```bash
   poetry run pytest tests/unit/test_my_feature.py
   ```

5. **Check Code Quality**
   ```bash
   # Format code
   poetry run black src/

   # Lint code
   poetry run ruff check src/

   # Type check
   poetry run mypy src/
   ```

6. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: add my feature"
   ```

7. **Push and Create PR**
   ```bash
   git push origin feature/my-feature
   # Create pull request on GitHub
   ```

### Adding a New Endpoint

1. **Define Pydantic Models**
   ```python
   # src/api/models/my_model.py
   from pydantic import BaseModel

   class MyRequest(BaseModel):
       field: str

   class MyResponse(BaseModel):
       result: str
   ```

2. **Create Route Handler**
   ```python
   # src/api/routes/my_route.py
   from fastapi import APIRouter, Depends
   from src.api.models.my_model import MyRequest, MyResponse

   router = APIRouter(prefix="/api/v1/my", tags=["my"])

   @router.post("/endpoint", response_model=MyResponse)
   async def my_endpoint(request: MyRequest):
       # Implementation
       return MyResponse(result="success")
   ```

3. **Register Router**
   ```python
   # src/api/main.py
   from src.api.routes import my_route

   app.include_router(my_route.router)
   ```

4. **Write Tests**
   ```python
   # tests/unit/api/test_my_route.py
   from fastapi.testclient import TestClient
   from src.api.main import app

   client = TestClient(app)

   def test_my_endpoint():
       response = client.post("/api/v1/my/endpoint", json={"field": "value"})
       assert response.status_code == 200
       assert response.json()["result"] == "success"
   ```

### Adding a Database Model

1. **Define SQLAlchemy Model**
   ```python
   # src/db/models/my_model.py
   from sqlalchemy import Column, Integer, String
   from src.db.base import Base

   class MyModel(Base):
       __tablename__ = "my_table"

       id = Column(Integer, primary_key=True, index=True)
       name = Column(String, nullable=False)
   ```

2. **Create Migration**
   ```bash
   poetry run alembic revision --autogenerate -m "add my_table"
   ```

3. **Review Migration**
   ```python
   # alembic/versions/xxx_add_my_table.py
   def upgrade():
       op.create_table(
           'my_table',
           sa.Column('id', sa.Integer(), nullable=False),
           sa.Column('name', sa.String(), nullable=False),
           sa.PrimaryKeyConstraint('id')
       )

   def downgrade():
       op.drop_table('my_table')
   ```

4. **Apply Migration**
   ```bash
   poetry run alembic upgrade head
   ```

### Adding a New AI Agent

1. **Create Agent Class**
   ```python
   # src/agents/my_agent.py
   from src.agents.base import BaseAgent

   class MyAgent(BaseAgent):
       def __init__(self, bedrock_client):
           super().__init__(bedrock_client)
           self.agent_type = "my_agent"

       async def process(self, query: str, context: dict) -> str:
           # Build prompt
           prompt = self._build_prompt(query, context)
           
           # Call LLM
           response = await self.bedrock_client.invoke_claude_sonnet(prompt)
           
           return response

       def _build_prompt(self, query: str, context: dict) -> str:
           return f"Query: {query}\nContext: {context}"
   ```

2. **Register in Orchestrator**
   ```python
   # src/agents/orchestrator.py
   from src.agents.my_agent import MyAgent

   class AgentOrchestrator:
       def __init__(self, bedrock_client):
           self.my_agent = MyAgent(bedrock_client)
           # ...

       def _classify_intent(self, query: str) -> str:
           if "my keyword" in query.lower():
               return "my_agent"
           # ...

       async def _route_to_agent(self, intent: str, query: str, context: dict) -> str:
           if intent == "my_agent":
               return await self.my_agent.process(query, context)
           # ...
   ```

## Testing

### Running Tests

```bash
# All tests
poetry run pytest

# Unit tests only
poetry run pytest tests/unit

# Integration tests only
poetry run pytest tests/integration

# Property-based tests only
poetry run pytest tests/property

# Specific test file
poetry run pytest tests/unit/test_my_feature.py

# Specific test function
poetry run pytest tests/unit/test_my_feature.py::test_my_function

# With coverage
poetry run pytest --cov=src --cov-report=html

# Verbose output
poetry run pytest -v

# Stop on first failure
poetry run pytest -x
```

### Writing Unit Tests

```python
# tests/unit/test_example.py
import pytest
from src.services.example import my_function

def test_my_function_success():
    result = my_function("input")
    assert result == "expected"

def test_my_function_error():
    with pytest.raises(ValueError):
        my_function("invalid")

@pytest.mark.asyncio
async def test_async_function():
    result = await async_function()
    assert result is not None

@pytest.fixture
def mock_client():
    return MockClient()

def test_with_fixture(mock_client):
    result = function_using_client(mock_client)
    assert result == "expected"
```

### Writing Integration Tests

```python
# tests/integration/test_example.py
import pytest
from fastapi.testclient import TestClient
from src.api.main import app

client = TestClient(app)

def test_full_workflow():
    # Upload repository
    with open("test_repo.zip", "rb") as f:
        response = client.post("/api/v1/repo/upload", files={"file": f})
    assert response.status_code == 200
    repo_id = response.json()["repository_id"]

    # Check status
    response = client.get(f"/api/v1/repo/{repo_id}/status")
    assert response.status_code == 200
    assert response.json()["status"] in ["pending", "indexing", "completed"]
```

### Writing Property-Based Tests

```python
# tests/property/test_example.py
from hypothesis import given, strategies as st

@given(st.text())
def test_sanitize_input(input_text):
    result = sanitize_input(input_text)
    # Properties that should always hold
    assert isinstance(result, str)
    assert "<script>" not in result
    assert "DROP TABLE" not in result
```

## Code Style

### Formatting

```bash
# Format all code
poetry run black src/ tests/

# Check formatting
poetry run black --check src/ tests/
```

### Linting

```bash
# Lint code
poetry run ruff check src/ tests/

# Fix auto-fixable issues
poetry run ruff check --fix src/ tests/
```

### Type Checking

```bash
# Type check
poetry run mypy src/

# Strict mode
poetry run mypy --strict src/
```

### Code Style Guidelines

- Use type hints for all function parameters and return values
- Write docstrings for all public functions and classes
- Keep functions small and focused (< 50 lines)
- Use async/await for I/O operations
- Follow PEP 8 naming conventions
- Use descriptive variable names
- Add comments for complex logic
- Keep line length under 100 characters

## Debugging

### Using Python Debugger

```python
# Add breakpoint
import pdb; pdb.set_trace()

# Or use built-in breakpoint()
breakpoint()
```

### Logging

```python
import structlog

logger = structlog.get_logger(__name__)

logger.info("message", key="value")
logger.error("error", exc_info=True)
logger.debug("debug info", data={"key": "value"})
```

### Viewing Logs

```bash
# Local development
tail -f logs/app.log

# AWS CloudWatch
aws logs tail /ecs/astramentor --follow

# Filter logs
aws logs filter-log-events \
  --log-group-name /ecs/astramentor \
  --filter-pattern "ERROR"
```

## Performance Optimization

### Profiling

```python
# Profile function
import cProfile
import pstats

profiler = cProfile.Profile()
profiler.enable()

# Code to profile
my_function()

profiler.disable()
stats = pstats.Stats(profiler)
stats.sort_stats('cumulative')
stats.print_stats(10)
```

### Async Best Practices

```python
# Good: Use async/await
async def fetch_data():
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        return response.json()

# Bad: Blocking I/O in async function
async def fetch_data():
    response = requests.get(url)  # Blocks event loop!
    return response.json()

# Good: Concurrent requests
async def fetch_multiple():
    tasks = [fetch_data(url) for url in urls]
    results = await asyncio.gather(*tasks)
    return results
```

### Caching

```python
from functools import lru_cache

@lru_cache(maxsize=128)
def expensive_computation(arg):
    # Expensive operation
    return result

# Redis caching
from src.db.redis import get_redis_client

async def get_cached_data(key: str):
    redis = await get_redis_client()
    cached = await redis.get(key)
    if cached:
        return json.loads(cached)
    
    data = await fetch_data()
    await redis.setex(key, 3600, json.dumps(data))
    return data
```

## Contributing

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance

**Example:**
```
feat(agents): add code review agent

Implement new agent for automated code review with
security vulnerability detection and best practice suggestions.

Closes #123
```

### Pull Request Process

1. Create feature branch
2. Write tests
3. Implement feature
4. Update documentation
5. Run all tests and checks
6. Push and create PR
7. Address review comments
8. Merge after approval

### Code Review Checklist

- [ ] Tests pass
- [ ] Code formatted (black)
- [ ] Code linted (ruff)
- [ ] Type checked (mypy)
- [ ] Documentation updated
- [ ] No security vulnerabilities
- [ ] Performance acceptable
- [ ] Error handling complete
- [ ] Logging added

## Troubleshooting

### Common Issues

**Import Errors:**
```bash
# Reinstall dependencies
poetry install

# Clear cache
poetry cache clear pypi --all
```

**Database Connection Errors:**
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Reset database
poetry run alembic downgrade base
poetry run alembic upgrade head
```

**Redis Connection Errors:**
```bash
# Check Redis is running
docker ps | grep redis

# Test connection
redis-cli ping
```

**Test Failures:**
```bash
# Run with verbose output
poetry run pytest -vv

# Run with print statements
poetry run pytest -s

# Debug specific test
poetry run pytest --pdb tests/unit/test_example.py::test_function
```

## Resources

- **FastAPI Docs**: https://fastapi.tiangolo.com
- **SQLAlchemy Docs**: https://docs.sqlalchemy.org
- **Pydantic Docs**: https://docs.pydantic.dev
- **AWS Bedrock Docs**: https://docs.aws.amazon.com/bedrock
- **Poetry Docs**: https://python-poetry.org/docs
- **Pytest Docs**: https://docs.pytest.org
