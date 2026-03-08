# AstraMentor Deployment Architecture

Visual guide to understanding how AstraMentor is deployed.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                           INTERNET                               │
└────────────────────────┬────────────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
         ▼                               ▼
┌─────────────────┐            ┌──────────────────┐
│  Vercel CDN     │            │  CloudFront CDN  │
│  (Frontend)     │            │  (Static Assets) │
└────────┬────────┘            └────────┬─────────┘
         │                               │
         │                               │
         ▼                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AWS Cloud (us-east-1)                         │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                Application Load Balancer                    │ │
│  │              (astramentor-alb-*.elb.amazonaws.com)         │ │
│  └──────────────────────────┬─────────────────────────────────┘ │
│                             │                                    │
│  ┌──────────────────────────┴─────────────────────────────────┐ │
│  │                    ECS Fargate Cluster                      │ │
│  │  ┌────────────────────────────────────────────────────┐    │ │
│  │  │  FastAPI Application (0.5 vCPU, 1GB RAM)          │    │ │
│  │  │  - Multi-agent AI system                           │    │ │
│  │  │  - RAG pipeline                                     │    │ │
│  │  │  - Code execution sandbox                          │    │ │
│  │  │  - API endpoints                                    │    │ │
│  │  └────────────────────────────────────────────────────┘    │ │
│  └────────────────────────────────────────────────────────────┘ │
│                             │                                    │
│         ┌───────────────────┼───────────────────┐               │
│         │                   │                   │               │
│         ▼                   ▼                   ▼               │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
│  │ RDS         │    │ ElastiCache │    │ DynamoDB    │        │
│  │ PostgreSQL  │    │ Redis       │    │ Tables      │        │
│  │ (t3.micro)  │    │ (t3.micro)  │    │ (on-demand) │        │
│  └─────────────┘    └─────────────┘    └─────────────┘        │
│                                                                   │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
│  │ S3 Bucket   │    │ AWS Bedrock │    │ Cognito     │        │
│  │ (repos)     │    │ (Claude AI) │    │ (auth)      │        │
│  └─────────────┘    └─────────────┘    └─────────────┘        │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              CloudWatch Logs & Alarms                    │   │
│  │              SNS Notifications                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

---

## Component Breakdown

### Frontend Layer (Vercel)

```
┌─────────────────────────────────────────┐
│         Next.js 14 Application          │
├─────────────────────────────────────────┤
│  - Landing page                         │
│  - Authentication (AWS Amplify)         │
│  - Dashboard                            │
│  - Code editor (Monaco)                 │
│  - AI chat interface (SSE streaming)    │
│  - Knowledge graph visualization        │
│  - Repository management                │
└─────────────────────────────────────────┘
         │
         │ HTTPS
         ▼
┌─────────────────────────────────────────┐
│      Backend API (AWS ALB)              │
└─────────────────────────────────────────┘
```

### Backend Layer (AWS ECS)

```
┌─────────────────────────────────────────────────────────┐
│              FastAPI Application                         │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │              API Endpoints                       │   │
│  │  - /health                                       │   │
│  │  - /api/v1/repo/upload                          │   │
│  │  - /api/v1/chat/message                         │   │
│  │  - /api/v1/chat/stream (SSE)                    │   │
│  │  - /api/v1/playground/execute                   │   │
│  └─────────────────────────────────────────────────┘   │
│                        │                                 │
│  ┌─────────────────────┼─────────────────────────────┐ │
│  │                     │                             │ │
│  │  ┌──────────────────▼──────────────┐             │ │
│  │  │    Agent Orchestrator            │             │ │
│  │  │    (LangGraph)                   │             │ │
│  │  └──────────────┬───────────────────┘             │ │
│  │                 │                                  │ │
│  │     ┌───────────┼───────────┬──────────┐         │ │
│  │     │           │           │          │         │ │
│  │     ▼           ▼           ▼          ▼         │ │
│  │  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐        │ │
│  │  │Tutor │  │Debug │  │Build │  │Verify│        │ │
│  │  │Agent │  │Agent │  │Agent │  │Agent │        │ │
│  │  └──────┘  └──────┘  └──────┘  └──────┘        │ │
│  │                                                   │ │
│  └───────────────────────────────────────────────────┘ │
│                        │                                 │
│  ┌─────────────────────▼─────────────────────────────┐ │
│  │              RAG Pipeline                          │ │
│  │  1. HyDE Query Enhancement                        │ │
│  │  2. Query Decomposition                           │ │
│  │  3. Hybrid Retrieval (Vector + Graph)            │ │
│  │  4. 3-Pass Reranking                             │ │
│  │  5. Context Assembly                             │ │
│  └───────────────────────────────────────────────────┘ │
│                        │                                 │
│  ┌─────────────────────┼─────────────────────────────┐ │
│  │                     │                             │ │
│  │  ┌──────────────────▼──────────────┐             │ │
│  │  │    Code Parser (Tree-sitter)     │             │ │
│  │  │    - Python, JS, TS, Java, Go    │             │ │
│  │  └──────────────────────────────────┘             │ │
│  │                                                     │ │
│  │  ┌──────────────────────────────────┐             │ │
│  │  │    Knowledge Graph (NetworkX)    │             │ │
│  │  │    - Entities & Relationships    │             │ │
│  │  └──────────────────────────────────┘             │ │
│  │                                                     │ │
│  │  ┌──────────────────────────────────┐             │ │
│  │  │    Vector Store (FAISS)          │             │ │
│  │  │    - Semantic search             │             │ │
│  │  └──────────────────────────────────┘             │ │
│  │                                                     │ │
│  │  ┌──────────────────────────────────┐             │ │
│  │  │    Code Sandbox                  │             │ │
│  │  │    - Python, JS, TS execution    │             │ │
│  │  └──────────────────────────────────┘             │ │
│  │                                                     │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### Data Layer

```
┌─────────────────────────────────────────────────────────┐
│                    Data Storage                          │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │  PostgreSQL (RDS)                               │   │
│  │  - Users                                        │   │
│  │  - Repositories                                 │   │
│  │  - Sessions                                     │   │
│  │  - User progress                                │   │
│  │  - Interactions                                 │   │
│  │  - Challenges                                   │   │
│  │  - Snippets                                     │   │
│  └─────────────────────────────────────────────────┘   │
│                                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │  DynamoDB                                       │   │
│  │  - Chat messages (session_id, timestamp)       │   │
│  │  - Agent interactions (user_id, timestamp)     │   │
│  └─────────────────────────────────────────────────┘   │
│                                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Redis (ElastiCache)                            │   │
│  │  - RAG pipeline cache                           │   │
│  │  - Rate limiting                                │   │
│  │  - Session data                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │  S3                                             │   │
│  │  - Repository ZIP files                         │   │
│  │  - Knowledge graphs (JSON)                      │   │
│  │  - Vector indexes (FAISS)                       │   │
│  └─────────────────────────────────────────────────┘   │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

---

## Network Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         VPC (10.0.0.0/16)                    │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Availability Zone 1 (us-east-1a)          │ │
│  │                                                          │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │  Public Subnet (10.0.1.0/24)                     │  │ │
│  │  │  - ALB (Internet-facing)                         │  │ │
│  │  │  - NAT Gateway                                   │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  │                                                          │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │  Private Subnet (10.0.3.0/24)                    │  │ │
│  │  │  - ECS Tasks                                     │  │ │
│  │  │  - RDS Primary                                   │  │ │
│  │  │  - ElastiCache                                   │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  │                                                          │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Availability Zone 2 (us-east-1b)          │ │
│  │                                                          │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │  Public Subnet (10.0.2.0/24)                     │  │ │
│  │  │  - ALB (Internet-facing)                         │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  │                                                          │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │  Private Subnet (10.0.4.0/24)                    │  │ │
│  │  │  - ECS Tasks (standby)                           │  │ │
│  │  │  - RDS Standby                                   │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  │                                                          │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Security Layers                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Layer 1: Network Security                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  - VPC with private subnets                         │   │
│  │  - Security groups (least privilege)                │   │
│  │  - Network ACLs                                     │   │
│  │  - NAT Gateway for outbound only                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  Layer 2: Application Security                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  - AWS Cognito authentication                       │   │
│  │  - JWT token validation                             │   │
│  │  - Role-based access control                        │   │
│  │  - Input sanitization (SQL injection, XSS)         │   │
│  │  - Rate limiting (60/min, 1000/hour)               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  Layer 3: Data Security                                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  - RDS encryption at rest (AES-256)                │   │
│  │  - DynamoDB encryption at rest                      │   │
│  │  - S3 encryption at rest                            │   │
│  │  - TLS 1.2+ for all connections                     │   │
│  │  - Secrets Manager for credentials                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  Layer 4: Code Execution Security                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  - Sandboxed execution environment                  │   │
│  │  - Network access blocked                           │   │
│  │  - Filesystem access restricted                     │   │
│  │  - Timeout enforcement (30s)                        │   │
│  │  - Memory limits (256MB)                            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  Layer 5: Monitoring & Compliance                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  - CloudWatch Logs (all requests)                   │   │
│  │  - CloudWatch Alarms (errors, latency, cost)       │   │
│  │  - SNS notifications                                │   │
│  │  - Audit trails                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### User Registration Flow

```
User → Frontend → AWS Cognito
                     │
                     ├─ Create user
                     ├─ Send verification email
                     └─ Return user ID
                     │
Frontend ← ─ ─ ─ ─ ─ ┘
   │
   └─ Redirect to email verification
```

### Chat Message Flow

```
User types message
   │
   ▼
Frontend (React)
   │
   ├─ Validate input
   ├─ Add to local state
   │
   ▼
Backend API (/api/v1/chat/message)
   │
   ├─ Authenticate (JWT)
   ├─ Rate limit check
   │
   ▼
Agent Orchestrator
   │
   ├─ Classify intent
   ├─ Select agent (Tutor/Debugger/Builder/Verifier)
   │
   ▼
RAG Pipeline
   │
   ├─ Enhance query (HyDE)
   ├─ Decompose query
   ├─ Retrieve from vector store
   ├─ Retrieve from knowledge graph
   ├─ Rerank results
   ├─ Assemble context
   │
   ▼
AWS Bedrock (Claude)
   │
   ├─ Generate response
   ├─ Stream tokens
   │
   ▼
Backend → Frontend (SSE stream)
   │
   ▼
User sees response (real-time)
```

### Repository Upload Flow

```
User uploads ZIP file
   │
   ▼
Frontend
   │
   ├─ Validate file size (<100MB)
   ├─ Show progress bar
   │
   ▼
Backend API (/api/v1/repo/upload)
   │
   ├─ Authenticate
   ├─ Upload to S3
   ├─ Create DB record
   │
   ▼
Indexing Pipeline (async)
   │
   ├─ Extract ZIP
   ├─ Parse code files (Tree-sitter)
   │   ├─ Extract functions
   │   ├─ Extract classes
   │   ├─ Extract imports
   │   └─ Calculate metrics
   │
   ├─ Build knowledge graph (NetworkX)
   │   ├─ Create nodes (files, classes, functions)
   │   ├─ Create edges (imports, calls, extends)
   │   └─ Save to S3
   │
   ├─ Build vector index (FAISS)
   │   ├─ Chunk code semantically
   │   ├─ Generate embeddings (Titan)
   │   ├─ Add to FAISS index
   │   └─ Save to S3
   │
   └─ Update status in DB
       │
       ▼
Frontend polls status
   │
   └─ Show "Indexing complete"
```

### Code Execution Flow

```
User writes code in editor
   │
   ▼
Frontend
   │
   ├─ Syntax highlighting
   ├─ Click "Run"
   │
   ▼
Backend API (/api/v1/playground/execute)
   │
   ├─ Authenticate
   ├─ Validate language
   ├─ Add to execution queue
   │
   ▼
Code Sandbox
   │
   ├─ Create temp directory
   ├─ Write code to file
   ├─ Execute in subprocess
   │   ├─ Timeout: 30s
   │   ├─ Memory limit: 256MB
   │   ├─ Network: blocked
   │   └─ Filesystem: restricted
   │
   ├─ Capture stdout/stderr
   ├─ Capture exit code
   ├─ Clean up temp files
   │
   ▼
Backend → Frontend
   │
   ▼
User sees output
```

---

## Scaling Strategy

### Current Configuration (MVP)

```
┌─────────────────────────────────────────┐
│  ECS Tasks: 1 (min) to 5 (max)         │
│  CPU: 0.5 vCPU per task                │
│  Memory: 1GB per task                   │
│  RDS: t3.micro (2 vCPU, 1GB RAM)       │
│  Redis: t3.micro (2 vCPU, 0.5GB RAM)  │
│  Cost: ~$125-200/month                  │
└─────────────────────────────────────────┘
```

### Scaling Triggers

```
CPU > 70% → Add 1 task
Memory > 80% → Add 1 task
Request count > 1000/min → Add 1 task

CPU < 30% for 5 min → Remove 1 task
Memory < 40% for 5 min → Remove 1 task
```

### Growth Path

```
Stage 1: MVP (Current)
├─ 1-5 ECS tasks
├─ t3.micro RDS
├─ t3.micro Redis
└─ Cost: $125-200/month

Stage 2: 1K Users
├─ 2-10 ECS tasks
├─ t3.small RDS
├─ t3.small Redis
└─ Cost: $300-500/month

Stage 3: 10K Users
├─ 5-20 ECS tasks
├─ t3.medium RDS (Multi-AZ)
├─ t3.medium Redis (cluster)
└─ Cost: $800-1200/month

Stage 4: 100K Users
├─ 10-50 ECS tasks
├─ r5.large RDS (Multi-AZ)
├─ r5.large Redis (cluster)
├─ Multiple regions
└─ Cost: $3000-5000/month
```

---

## Monitoring Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│                  CloudWatch Dashboard                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │  Request Rate    │  │  Error Rate      │                │
│  │  ▁▂▃▅▇█▇▅▃▂▁    │  │  ▁▁▁▁▁▂▁▁▁▁▁    │                │
│  │  1.2K req/min    │  │  0.3% errors     │                │
│  └──────────────────┘  └──────────────────┘                │
│                                                               │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │  Latency (p95)   │  │  CPU Usage       │                │
│  │  ▁▂▃▄▅▄▃▂▁▂▃    │  │  ▁▂▃▄▅▆▅▄▃▂▁    │                │
│  │  450ms           │  │  65%             │                │
│  └──────────────────┘  └──────────────────┘                │
│                                                               │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │  Memory Usage    │  │  Active Tasks    │                │
│  │  ▁▂▃▄▅▆▇▆▅▄▃    │  │  ▁▁▂▂▃▃▂▂▁▁▁    │                │
│  │  75%             │  │  3 tasks         │                │
│  └──────────────────┘  └──────────────────┘                │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Cost Breakdown (Current Month)                      │  │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │  │
│  │  Bedrock:    $85  ████████████████████████░░░░░░░░  │  │
│  │  ECS:        $18  ████░░░░░░░░░░░░░░░░░░░░░░░░░░░  │  │
│  │  RDS:        $15  ███░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │  │
│  │  Redis:      $12  ███░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │  │
│  │  Other:      $20  ████░░░░░░░░░░░░░░░░░░░░░░░░░░░  │  │
│  │  Total:     $150                                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Deployment Timeline

```
Day 0: Preparation
├─ Install tools (30 min)
├─ Configure AWS (15 min)
└─ Set up Cognito (10 min)

Day 1: Backend Deployment
├─ Deploy infrastructure (15 min)
├─ Build Docker image (10 min)
├─ Run migrations (5 min)
└─ Verify deployment (5 min)

Day 1: Frontend Deployment
├─ Configure environment (5 min)
├─ Deploy to Vercel (10 min)
├─ Update CORS (5 min)
└─ Verify deployment (5 min)

Day 1: Post-Deployment
├─ Create first user (5 min)
├─ Subscribe to alarms (5 min)
├─ Test full flow (15 min)
└─ Monitor costs (ongoing)

Total Time: ~2 hours
```

---

## Cost Optimization Tips

1. **Use Haiku for Simple Queries**
   - Claude Haiku: $0.25/1M input tokens
   - Claude Sonnet: $3.00/1M input tokens
   - 10x cost savings for simple queries

2. **Enable Aggressive Caching**
   - Cache RAG results in Redis (TTL: 1 hour)
   - Cache embeddings (TTL: 24 hours)
   - 50-70% reduction in Bedrock calls

3. **Optimize Auto-Scaling**
   - Scale down during low usage (nights, weekends)
   - Use scheduled scaling
   - 20-30% reduction in compute costs

4. **Use S3 Lifecycle Policies**
   - Move to Infrequent Access after 30 days
   - Delete after 90 days
   - 50% reduction in storage costs

5. **Reduce Log Retention**
   - Keep logs for 7 days (default)
   - Archive to S3 for long-term storage
   - 60% reduction in CloudWatch costs

---

**Last Updated**: March 6, 2026
**Version**: 1.0.0
