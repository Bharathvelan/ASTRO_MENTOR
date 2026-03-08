# AstraMentor Backend Architecture

## System Overview

AstraMentor is an AI-powered Socratic tutoring platform that helps developers learn through guided questioning and code analysis. The backend provides intelligent code understanding, multi-agent AI orchestration, and adaptive difficulty adjustment.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│              (Next.js, React, TypeScript)                    │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS
┌────────────────────────▼────────────────────────────────────┐
│                    CloudFront CDN                            │
│                  (Global Edge Cache)                         │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│              Application Load Balancer                       │
│                  (SSL Termination)                           │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
┌───────▼───────┐ ┌─────▼─────┐ ┌───────▼───────┐
│  ECS Task 1   │ │ ECS Task 2│ │  ECS Task N   │
│   (FastAPI)   │ │ (FastAPI) │ │   (FastAPI)   │
└───────┬───────┘ └─────┬─────┘ └───────┬───────┘
        │               │               │
        └───────────────┼───────────────┘
                        │
        ┌───────────────┼───────────────┬───────────────┐
        │               │               │               │
┌───────▼───────┐ ┌────▼─────┐ ┌──────▼──────┐ ┌──────▼──────┐
│  PostgreSQL   │ │  Redis   │ │  DynamoDB   │ │ AWS Bedrock │
│   (RDS)       │ │(ElastiCache)│ (NoSQL)    │ │  (Claude)   │
└───────────────┘ └──────────┘ └─────────────┘ └─────────────┘
        │
┌───────▼───────┐
│  S3 Storage   │
│ (Repositories)│
└───────────────┘
```

## Core Components

### 1. API Layer (`src/api/`)

**FastAPI Application** - High-performance async web framework

- **Routes** (`routes/`): Endpoint handlers
  - `repository.py`: Repository upload, status, deletion
  - `chat.py`: AI chat and streaming
  - `playground.py`: Code execution

- **Middleware** (`middleware/`):
  - `auth.py`: JWT validation (AWS Cognito)
  - `logging.py`: Structured request/response logging
  - `security.py`: Security headers (HSTS, CSP, etc.)
  - `rate_limit.py`: Redis-based rate limiting
  - `timeout.py`: Request timeout enforcement
  - `error_handlers.py`: Global exception handling

- **Models** (`models/`): Pydantic request/response schemas

### 2. AI Layer (`src/agents/`)

**Multi-Agent System** - Specialized AI agents for different tasks

- **AgentOrchestrator** (`orchestrator.py`):
  - Intent classification
  - Agent routing
  - Conversation memory management
  - State management with LangGraph

- **Specialized Agents**:
  - **TutorAgent** (`tutor.py`): Socratic questioning
  - **DebuggerAgent** (`debugger.py`): Error analysis
  - **BuilderAgent** (`builder.py`): Code generation
  - **VerifierAgent** (`verifier.py`): Test generation

**Agent Workflow:**
```
User Query → Intent Classifier → Route to Agent → RAG Pipeline → LLM → Response
                                                        ↓
                                              Context Retrieval
                                              (Vector + Graph)
```

### 3. RAG Pipeline (`src/services/rag/`)

**5-Stage Retrieval-Augmented Generation**

1. **HyDE** (`hyde.py`): Query enhancement with hypothetical documents
2. **Decomposition** (`decomposer.py`): Complex query splitting
3. **Hybrid Retrieval** (`retriever.py`): Vector + graph search
4. **Reranking** (`reranker.py`): 3-pass relevance scoring
5. **Assembly** (`assembler.py`): Context window optimization

**Data Flow:**
```
Query → HyDE → Decompose → [Vector Search + Graph Search] → Rerank → Assemble → Context
```

### 4. Data Layer

#### Code Parser (`src/services/parser/`)
- **Tree-sitter** multi-language parsing
- AST extraction (functions, classes, imports)
- Complexity metrics (cyclomatic, nesting)
- Code smell detection
- Security vulnerability scanning

#### Knowledge Graph (`src/services/graph/`)
- **NetworkX** graph construction
- Entity nodes (files, classes, functions)
- Relationship edges (imports, calls, extends)
- BFS traversal for related code
- Dependency analysis

#### Vector Store (`src/services/vector/`)
- **FAISS** HNSW indexing
- Semantic chunking with overlap
- Metadata filtering
- Similarity search
- Incremental updates

### 5. AWS Bedrock Integration (`src/services/bedrock/`)

**LLM & Embeddings**

- **Claude 3.5 Sonnet**: Complex reasoning, detailed responses
- **Claude 3 Haiku**: Fast responses, simple queries
- **Titan Embeddings**: Text-to-vector conversion

**Features:**
- Model routing based on query complexity
- Cost tracking per request
- Streaming support (SSE)
- Exponential backoff retry
- Circuit breaker pattern

### 6. IRT Engine (`src/services/irt/`)

**Adaptive Difficulty** - Item Response Theory

- 2-parameter logistic model
- Maximum likelihood estimation
- Skill level tracking per concept
- Difficulty recommendation
- Progress persistence

**Formula:**
```
P(correct) = 1 / (1 + e^(-a(θ - b)))
where:
  θ = user skill level
  a = discrimination parameter
  b = difficulty parameter
```

### 7. Code Execution Sandbox (`src/services/sandbox/`)

**Secure Code Execution**

- **Executor** (`executor.py`):
  - Python, JavaScript, TypeScript support
  - 30-second timeout
  - 512MB memory limit
  - Network isolation
  - Filesystem restrictions
  - Output sanitization

- **Queue** (`queue.py`):
  - Max 3 concurrent executions
  - FIFO processing
  - Status tracking

### 8. Database Layer (`src/db/`)

**PostgreSQL (RDS)** - Relational data
- Users, repositories, sessions
- User progress, challenges
- Snippets, interactions

**DynamoDB** - NoSQL data
- Chat messages (session_id, timestamp)
- Agent interactions (user_id, timestamp)

**Redis (ElastiCache)** - Caching
- RAG pipeline results
- Rate limiting counters
- Session data

### 9. Infrastructure (`infrastructure/`)

**AWS CDK** - Infrastructure as Code

- VPC with public/private subnets
- ECS Fargate cluster
- RDS PostgreSQL (t3.micro)
- ElastiCache Redis (t3.micro)
- DynamoDB tables
- S3 repository storage
- CloudFront distribution
- CloudWatch monitoring

## Data Flow

### Repository Upload & Indexing

```
1. User uploads ZIP → S3
2. Extract files → Parse code (Tree-sitter)
3. Build knowledge graph (NetworkX)
4. Generate embeddings (Titan)
5. Build vector index (FAISS)
6. Update status → Complete
```

### Chat Message Processing

```
1. User sends message
2. Classify intent → Route to agent
3. Retrieve context (RAG pipeline):
   - HyDE enhancement
   - Query decomposition
   - Hybrid retrieval (vector + graph)
   - 3-pass reranking
   - Context assembly
4. Generate response (Claude)
5. Stream to user (SSE)
6. Persist to DynamoDB
```

### Code Execution

```
1. User submits code
2. Queue execution request
3. Create temp directory
4. Execute in subprocess (timeout, memory limits)
5. Capture stdout/stderr
6. Sanitize output
7. Return results
8. Cleanup temp directory
```

## Security Architecture

### Network Security
- Private subnets for compute/databases
- Security groups with least-privilege rules
- No public database access
- VPC endpoints for AWS services

### Data Security
- Encryption at rest (RDS, S3, DynamoDB)
- TLS in transit (ALB, CloudFront)
- Secrets Manager for credentials
- No hardcoded secrets

### Application Security
- JWT authentication (AWS Cognito)
- Input sanitization (SQL injection, XSS)
- Rate limiting (60/min, 1000/hour)
- Request timeout enforcement
- CORS configuration
- Security headers (HSTS, CSP, etc.)

### Sandbox Security
- Network isolation
- Filesystem restrictions
- Memory limits
- Timeout enforcement
- Output sanitization
- Non-root container user

## Scalability

### Horizontal Scaling
- ECS auto-scaling (1-5 tasks)
- CPU-based (target 70%)
- Memory-based (target 80%)

### Caching Strategy
- Redis for RAG results (TTL: 1 hour)
- CloudFront for static assets
- Database query caching

### Performance Optimization
- Async/await throughout
- Connection pooling (DB, Redis)
- Batch operations where possible
- Incremental indexing
- Lazy loading

## Monitoring & Observability

### CloudWatch Logs
- Structured JSON logging
- Request/response logging
- Error logging with stack traces
- 7-day retention

### CloudWatch Metrics
- ECS CPU/memory utilization
- ALB request count/latency
- DynamoDB read/write capacity
- Custom application metrics

### CloudWatch Alarms
- Cost alarm ($250 threshold)
- Error rate alarm (5% threshold)
- Latency alarm (p95 > 1s)
- SNS notifications

### Distributed Tracing
- Request ID propagation
- Correlation across services
- Latency breakdown

## Cost Optimization

### Free Tier Usage
- RDS t3.micro (750 hours/month)
- ElastiCache t3.micro (750 hours/month)
- DynamoDB on-demand (25GB free)
- S3 storage (5GB free)

### Cost Controls
- Single NAT gateway
- 7-day log retention
- S3 lifecycle policies
- Conservative auto-scaling
- Model routing (Haiku for simple queries)
- Cost tracking per request

### Estimated Monthly Cost
- Infrastructure: $60-90
- Bedrock API: $65-110
- **Total: $125-200** (within $300 budget)

## Resilience Patterns

### Circuit Breaker
- Bedrock API calls
- 3-state FSM (closed, open, half-open)
- Failure threshold: 5 consecutive failures
- Recovery timeout: 60 seconds

### Retry Logic
- Exponential backoff
- Max 3 retries
- Jitter to prevent thundering herd

### Graceful Degradation
- Vector search failure → graph-only retrieval
- Claude Sonnet failure → fallback to Haiku
- Redis failure → no caching

### Health Checks
- Database connectivity
- Redis connectivity
- ALB target health checks
- ECS task health checks

## Development Workflow

### Local Development
```bash
# Install dependencies
poetry install

# Run database migrations
poetry run alembic upgrade head

# Start server
poetry run uvicorn src.api.main:app --reload
```

### Testing
```bash
# Unit tests
poetry run pytest tests/unit

# Integration tests
poetry run pytest tests/integration

# Property-based tests
poetry run pytest tests/property

# Coverage
poetry run pytest --cov=src --cov-report=html
```

### Deployment
```bash
# Deploy infrastructure
./scripts/deploy.sh

# Build and push Docker image
./scripts/docker-build.sh

# Run migrations
./scripts/migrate.sh
```

## Technology Stack

**Core:**
- Python 3.11+
- FastAPI (async web framework)
- Poetry (dependency management)
- Uvicorn (ASGI server)

**AI/ML:**
- AWS Bedrock (Claude, Titan)
- LangGraph (agent orchestration)
- LangChain Core

**Data:**
- PostgreSQL (relational)
- DynamoDB (NoSQL)
- Redis (caching)
- FAISS (vector search)
- NetworkX (graph)

**Code Analysis:**
- Tree-sitter (parsing)

**Infrastructure:**
- AWS CDK (IaC)
- Docker (containerization)
- ECS Fargate (compute)
- CloudWatch (monitoring)

## Design Principles

1. **Async First**: All I/O operations are async
2. **Fail Fast**: Validate early, fail with clear errors
3. **Least Privilege**: Minimal IAM permissions
4. **Defense in Depth**: Multiple security layers
5. **Cost Conscious**: Optimize for $300 budget
6. **Observable**: Comprehensive logging and metrics
7. **Resilient**: Circuit breakers, retries, fallbacks
8. **Scalable**: Horizontal scaling, caching
9. **Maintainable**: Clean code, type hints, documentation
10. **Testable**: Unit, integration, property-based tests

## Future Enhancements

- Multi-region deployment
- GraphQL API
- WebSocket support
- Advanced caching (CDN, Redis Cluster)
- ML model fine-tuning
- A/B testing framework
- Advanced analytics
- Mobile SDK
- Third-party integrations
