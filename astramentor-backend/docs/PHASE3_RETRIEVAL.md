# Phase 3: Retrieval (RAG Pipeline) - Implementation Complete

## Overview

Phase 3 implements the complete 5-stage RAG (Retrieval-Augmented Generation) pipeline for intelligent code understanding and context retrieval. This phase integrates AWS Bedrock for AI capabilities and builds upon the data layer from Phase 2.

## Components Implemented

### 1. AWS Bedrock Client (`src/services/bedrock/client.py`)

**Features:**
- Claude 3.5 Sonnet invocation for complex reasoning
- Claude 3 Haiku invocation for fast responses
- Titan Embeddings G1 for vector generation
- Streaming support for real-time responses
- Cost tracking per request
- Automatic retry with exponential backoff
- Model routing based on query complexity

**Key Methods:**
- `invoke_claude_sonnet()` - Complex reasoning tasks
- `invoke_claude_haiku()` - Fast, simple queries
- `get_embedding()` - Generate embeddings
- `get_embeddings_batch()` - Batch embedding generation
- `route_model()` - Intelligent model selection
- `get_total_cost()` - Cost tracking

**Pricing (per 1K tokens):**
- Claude 3.5 Sonnet: $0.003 input, $0.015 output
- Claude 3 Haiku: $0.00025 input, $0.00125 output
- Titan Embeddings: $0.0001

### 2. Stage 1: HyDE Query Enhancement (`src/services/rag/hyde.py`)

**Purpose:** Enhance queries by generating hypothetical relevant documents

**How it works:**
1. Takes user query
2. Uses Claude Haiku to generate hypothetical answer
3. Combines original query with hypothetical document
4. Improves retrieval by expanding query context

**Example:**
```python
query = "How do I implement authentication?"
enhanced = "How do I implement authentication?\n\nHypothetical answer: Use JWT tokens with middleware..."
```

### 3. Stage 2: Query Decomposition (`src/services/rag/decomposer.py`)

**Purpose:** Break complex queries into simpler sub-queries

**How it works:**
1. Detects conjunctions (and, also, additionally, etc.)
2. Splits query on conjunction boundaries
3. Returns list of sub-queries for parallel retrieval

**Example:**
```python
query = "How do I add authentication and implement rate limiting?"
sub_queries = [
    "How do I add authentication",
    "implement rate limiting"
]
```

### 4. Stage 3: Hybrid Retrieval (`src/services/rag/retriever.py`)

**Purpose:** Combine vector search and knowledge graph traversal

**How it works:**
1. **Vector Search:**
   - Generate query embedding with Titan
   - Search FAISS index for similar code chunks
   - Return top-k results with similarity scores

2. **Graph Search:**
   - Extract entities from query (classes, functions)
   - Traverse knowledge graph to find related nodes
   - Return nodes within max depth (default: 2)

3. **Merge Results:**
   - Combine vector and graph results
   - Deduplicate by content
   - Preserve source information

**Entity Extraction:**
- Capitalized words (class names)
- Function patterns (word followed by parentheses)
- Quoted strings (identifiers)

### 5. Stage 4: 3-Pass Reranking (`src/services/rag/reranker.py`)

**Purpose:** Rerank results for optimal relevance

**Pass 1: Semantic Similarity**
- Sort by vector similarity scores
- Highest scores first

**Pass 2: Code Relevance**
- Boost results with function/class definitions (+0.2)
- Boost results with relevant imports (+0.1)
- Boost results matching entity type (+0.15)
- Boost graph results (structural relevance) (+0.05)

**Pass 3: Context Window Optimization**
- Ensure diversity of file sources
- Limit to 10 unique files initially
- Prevent duplicate information
- Optimize for context window

### 6. Stage 5: Context Assembly (`src/services/rag/assembler.py`)

**Purpose:** Assemble final context within token budget

**How it works:**
1. Iterate through reranked results
2. Estimate tokens for each result (1 token ≈ 4 chars)
3. Add results until token budget reached
4. Format context for LLM consumption

**Token Budget:** Default 8000 tokens (~32KB of code)

**Format:**
```
[1] File: src/auth/middleware.py (Type: function)
def authenticate_user(token: str):
    ...

---

[2] File: src/auth/jwt.py (Type: class)
class JWTValidator:
    ...
```

### 7. Main RAG Pipeline (`src/services/rag/pipeline.py`)

**Purpose:** Orchestrate all 5 stages

**Flow:**
1. Check Redis cache for query
2. If miss, execute pipeline:
   - Stage 1: HyDE enhancement
   - Stage 2: Query decomposition
   - Stage 3: Hybrid retrieval
   - Stage 4: 3-pass reranking
   - Stage 5: Context assembly
3. Cache result in Redis
4. Log metrics (latency, result count, etc.)
5. Return formatted context

**Performance:**
- Target: <1 second for typical queries
- Cache hit: <100ms
- Cache miss: 500-1000ms

### 8. Redis Caching (`src/services/rag/cache.py`)

**Purpose:** Cache retrieval results to reduce latency and costs

**Features:**
- SHA256 hash-based cache keys
- Configurable TTL (default: 1 hour)
- Hit/miss tracking
- Hit rate calculation
- JSON serialization

**Cache Key Format:**
```
rag:cache:<sha256(repo_id:query)>
```

**Statistics:**
- Hit count
- Miss count
- Hit rate percentage

## Usage Example

```python
from src.services.bedrock.client import BedrockClient
from src.services.vector.vector_store import VectorStoreManager
from src.services.graph.knowledge_graph import KnowledgeGraphManager
from src.services.rag.pipeline import RAGPipeline
from src.db.redis import RedisClient

# Initialize components
bedrock = BedrockClient(region_name="us-east-1")
vector_store = VectorStoreManager(storage_path="./storage/indices")
knowledge_graph = KnowledgeGraphManager(storage_path="./storage/graphs")
redis = RedisClient(host="localhost", port=6379)

# Create pipeline
rag = RAGPipeline(
    bedrock_client=bedrock,
    vector_store=vector_store,
    knowledge_graph=knowledge_graph,
    redis_client=redis,
)

# Execute retrieval
result = await rag.retrieve(
    query="How do I implement JWT authentication?",
    repo_id="repo_123",
    top_k=20,
    max_tokens=8000,
)

# Access results
context_items = result["context"]
formatted_context = result["formatted_context"]
metadata = result["metadata"]

print(f"Found {len(context_items)} relevant code chunks")
print(f"Latency: {metadata.get('latency_ms')}ms")
```

## Integration with Existing Components

### Phase 1 Integration:
- Uses `RedisClient` for caching
- Uses retry logic from `src/utils/retry.py`
- Uses structured logging

### Phase 2 Integration:
- Uses `VectorStoreManager` for semantic search
- Uses `KnowledgeGraphManager` for graph traversal
- Leverages existing indices and graphs

## Performance Metrics

**Logged Metrics:**
- Query length
- Total results retrieved
- Context items assembled
- Latency (milliseconds)
- Cache hit/miss
- Number of sub-queries

**Example Log:**
```json
{
  "event": "RAG pipeline metrics",
  "query_length": 45,
  "total_results": 87,
  "context_items": 12,
  "latency_ms": 743,
  "cached": false,
  "sub_queries": 2
}
```

## Cost Optimization

**Strategies:**
1. **Caching:** Reduce Bedrock API calls by 60-80%
2. **Model Routing:** Use Haiku for simple queries (10x cheaper)
3. **Batch Embeddings:** Reduce API overhead
4. **Token Budget:** Limit context size to control costs

**Estimated Costs (per 1000 queries):**
- Without caching: $15-25
- With 70% cache hit rate: $5-8
- Monthly (10K queries): $50-80

## Configuration

**Environment Variables:**
```bash
# AWS Bedrock
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret

# Redis Cache
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=optional

# RAG Pipeline
RAG_CACHE_TTL=3600  # 1 hour
RAG_MAX_TOKENS=8000
RAG_TOP_K=20
```

## Testing

**Unit Tests:**
- Bedrock client invocation
- HyDE enhancement
- Query decomposition
- Hybrid retrieval
- Reranking logic
- Context assembly
- Cache operations

**Property Tests:**
- HyDE query enhancement (Property 6)
- Complex query decomposition (Property 7)
- Hybrid retrieval coverage (Property 8)
- Reranking order change (Property 9)
- Token budget compliance (Property 10)
- Context prioritization (Property 11)
- Cache hit consistency (Property 12)
- Retrieval metrics logging (Property 13)
- SSE streaming incremental delivery (Property 14)
- Bedrock retry exponential backoff (Property 15)
- Cost tracking accumulation (Property 16)

## Next Steps

**Phase 4: AI Layer (Agents)**
- Implement LangGraph orchestrator
- Create specialized agents (Tutor, Debugger, Builder, Verifier)
- Integrate RAG pipeline with agents
- Implement IRT engine for adaptive difficulty

## Files Created

```
src/services/bedrock/
├── __init__.py
└── client.py

src/services/rag/
├── __init__.py
├── pipeline.py
├── hyde.py
├── decomposer.py
├── retriever.py
├── reranker.py
├── assembler.py
└── cache.py

docs/
└── PHASE3_RETRIEVAL.md
```

## Summary

Phase 3 is complete with a production-ready RAG pipeline that:
- ✅ Integrates AWS Bedrock (Claude + Titan)
- ✅ Implements 5-stage retrieval pipeline
- ✅ Provides Redis caching for performance
- ✅ Tracks costs and metrics
- ✅ Supports streaming responses
- ✅ Optimizes for $300 budget constraint

The pipeline is ready for integration with the AI agents in Phase 4.
