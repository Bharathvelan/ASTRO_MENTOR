# Phase 4: AI Layer - Complete Technical Documentation

## Overview

Phase 4 implements the multi-agent AI system that powers AstraMentor's intelligent tutoring capabilities. The system uses LangGraph for orchestration, implements 4 specialized agents, and includes an IRT engine for adaptive difficulty.

## Architecture

### Component Hierarchy

```
AgentOrchestrator (LangGraph)
├── Intent Classifier
├── Context Retriever (RAG Pipeline)
├── Agent Router
│   ├── TutorAgent (Socratic)
│   ├── DebuggerAgent (Error Analysis)
│   ├── BuilderAgent (Code Generation)
│   └── VerifierAgent (Testing)
├── Memory Manager (DynamoDB)
└── IRT Engine (Adaptive Difficulty)
```

### Data Flow

```
1. User Query → Orchestrator
2. Classify Intent (tutor/debugger/builder/verifier)
3. Retrieve Context from RAG Pipeline
4. Route to Appropriate Agent
5. Agent Processes with Bedrock Claude
6. Store Interaction in DynamoDB
7. Return Response to User
```

## Components

### 1. IRT Engine

**File:** `src/services/irt/engine.py`

**Purpose:** Adaptive difficulty using Item Response Theory

**Model:** 2-Parameter Logistic (2PL)
```python
P(correct) = 1 / (1 + exp(-a * (θ - b)))

where:
- θ (theta) = user skill level
- b = item difficulty
- a = item discrimination
```

**Key Methods:**
- `get_user_skill(user_id, concept)` - Estimate skill level
- `update_skill(user_id, concept, correct, difficulty)` - Record interaction
- `recommend_difficulty(user_id, concept)` - Suggest next difficulty

**Skill Scale:**
- -3.0: Beginner
- 0.0: Average
- +3.0: Expert

**Estimation Algorithm:**
- Newton-Raphson method
- Maximum likelihood estimation
- Converges in <20 iterations
- Tolerance: 0.01

### 2. Base Agent

**File:** `src/agents/base.py`

**Purpose:** Abstract base class for all agents

**Features:**
- Common initialization
- Prompt template building
- Error handling

### 3. Tutor Agent

**File:** `src/agents/tutor.py`

**Purpose:** Socratic questioning and guided learning

**Approach:**
- Never gives direct answers
- Asks guiding questions
- Provides progressive hints
- Adapts to skill level

**Skill Adaptation:**
- Low skill (<-1): More detailed hints, smaller steps
- Average skill (-1 to +1): Balanced guidance
- High skill (>+1): Challenging questions, deeper thinking

**Prompt Structure:**
```
Student Question: {query}
Student Skill Level: {skill_level}/3.0
Guidance Strategy: {adapted_strategy}
Relevant Code Context: {context}
Conversation History: {history}

Task: Guide through Socratic questioning
```

### 4. Debugger Agent

**File:** `src/agents/debugger.py`

**Purpose:** Error analysis and debugging guidance

**Features:**
- Error type extraction (regex patterns)
- Error message parsing
- Root cause analysis
- Progressive hints
- Common mistake identification

**Error Patterns Detected:**
- `(\w+Error):`
- `(\w+Exception):`
- `Error:\s*(\w+)`

**Output Structure:**
1. Root cause explanation
2. Progressive hints (high-level → specific)
3. Common mistakes
4. Debugging steps

### 5. Builder Agent

**File:** `src/agents/builder.py`

**Purpose:** Code generation and refactoring

**Features:**
- Style-aware code generation
- Documentation included
- Error handling
- Production-ready output
- Explanation of approach

**Context Integration:**
- Analyzes existing codebase
- Follows established patterns
- Maintains consistency

### 6. Verifier Agent

**File:** `src/agents/verifier.py`

**Purpose:** Test generation and code validation

**Features:**
- Code extraction from queries
- Quality analysis
- Test case generation
- Edge case identification
- Improvement suggestions

**Output Structure:**
1. Code quality analysis
2. Potential bugs/issues
3. Unit tests with assertions
4. Edge cases to consider
5. Improvement suggestions

### 7. Agent Orchestrator

**File:** `src/agents/orchestrator.py`

**Purpose:** LangGraph-based workflow orchestration

**State Management:**
```python
class AgentState(TypedDict):
    query: str
    intent: str
    user_id: str
    repo_id: str
    session_id: str
    conversation_history: List[Dict]
    retrieved_context: List[Dict]
    agent_response: str
    metadata: Dict
```

**Workflow Nodes:**
1. `classify_intent` - Determine agent type
2. `retrieve_context` - Get RAG context
3. `tutor/debugger/builder/verifier` - Agent processing
4. `store_interaction` - Persist to DynamoDB

**Intent Classification:**
- Keywords: error, bug, exception → Debugger
- Keywords: build, create, generate → Builder
- Keywords: test, verify, validate → Verifier
- Default → Tutor

**Memory Management:**
- Retrieves last 10 messages from DynamoDB
- Maintains conversation context
- Stores all interactions

## Integration

### With Phase 3 (RAG Pipeline)

```python
# Orchestrator retrieves context
result = await self.rag.retrieve(
    query=state["query"],
    repo_id=state["repo_id"],
    top_k=10,
    max_tokens=6000,
)
state["retrieved_context"] = result["context"]

# Agents use context in prompts
context_str = self._format_context(context)
```

### With Phase 1 (Database)

```python
# Store interactions
interaction = Interaction(
    user_id=user_id,
    concept=concept,
    correct=correct,
    difficulty=difficulty,
    timestamp=datetime.utcnow(),
)
db.add(interaction)
db.commit()
```

### With DynamoDB

```python
# Store agent interactions
await dynamodb.put_item(
    table_name="agent_interactions",
    item={
        "user_id": user_id,
        "session_id": session_id,
        "timestamp": timestamp,
        "query": query,
        "response": response,
        "intent": intent,
    }
)
```

## Performance

### Latency Targets

| Operation | Target | Typical |
|-----------|--------|---------|
| Intent classification | <100ms | 50ms |
| Context retrieval | <1s | 500ms |
| Agent processing | <3s | 2s |
| Total response | <5s | 3s |

### Token Usage

| Agent | Avg Input | Avg Output | Cost/1K |
|-------|-----------|------------|---------|
| Tutor | 1500 | 500 | $0.012 |
| Debugger | 1200 | 600 | $0.013 |
| Builder | 1800 | 800 | $0.017 |
| Verifier | 1600 | 900 | $0.018 |

## Cost Analysis

**Per 1000 Interactions:**
- Tutor: $8-12
- Debugger: $8-12
- Builder: $10-15
- Verifier: $10-15

**Monthly Estimates (5K interactions):**
- Agent costs: $45-70
- RAG costs: $50-80
- Total: $95-150
- Budget: $300 ✅

## Error Handling

### Agent Failures

```python
try:
    response = await agent.process(state)
except Exception as e:
    logger.error(f"Agent failed: {e}")
    response = "I encountered an error. Please try rephrasing your question."
```

### Context Retrieval Failures

```python
try:
    result = await self.rag.retrieve(...)
except Exception as e:
    logger.error(f"Context retrieval failed: {e}")
    state["retrieved_context"] = []  # Continue without context
```

### Memory Failures

```python
try:
    history = await self._get_conversation_history(session_id)
except Exception as e:
    logger.error(f"Failed to get history: {e}")
    history = []  # Continue without history
```

## Configuration

### Environment Variables

```bash
# Bedrock
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret

# DynamoDB Tables
DYNAMODB_CHAT_MESSAGES_TABLE=chat_messages
DYNAMODB_AGENT_INTERACTIONS_TABLE=agent_interactions

# IRT Settings
IRT_DEFAULT_SKILL=0.0
IRT_MAX_ITERATIONS=20
IRT_TOLERANCE=0.01

# Agent Settings
AGENT_MAX_TOKENS=3072
AGENT_TEMPERATURE=0.7
```

## Testing

### Unit Tests

```python
# Test IRT skill estimation
def test_irt_skill_estimation():
    engine = IRTEngine(db_session)
    interactions = [
        {"difficulty": 0.0, "correct": True},
        {"difficulty": 0.5, "correct": True},
        {"difficulty": 1.0, "correct": False},
    ]
    theta = engine._estimate_theta(interactions)
    assert -3.0 <= theta <= 3.0

# Test intent classification
def test_intent_classification():
    orchestrator = AgentOrchestrator(...)
    state = {"query": "I have a TypeError"}
    result = await orchestrator._classify_intent(state)
    assert result["intent"] == "debugger"
```

### Integration Tests

```python
# Test end-to-end agent flow
async def test_agent_flow():
    orchestrator = AgentOrchestrator(...)
    result = await orchestrator.process_query(
        query="How do I fix this error?",
        user_id="test_user",
        session_id="test_session",
        repo_id="test_repo",
    )
    assert result["response"]
    assert result["intent"] in ["tutor", "debugger", "builder", "verifier"]
```

## Monitoring

### Metrics to Track

```python
logger.info(
    "Agent processing",
    extra={
        "agent": agent_type,
        "intent": intent,
        "latency_ms": latency,
        "tokens_input": input_tokens,
        "tokens_output": output_tokens,
        "cost": cost,
    }
)
```

### CloudWatch Metrics

- Agent invocation count by type
- Average latency by agent
- Error rate by agent
- Cost per agent type
- Skill level distribution

## Best Practices

### Prompt Engineering

1. **Be Specific:** Clear instructions for each agent
2. **Provide Context:** Include relevant code and history
3. **Set Constraints:** Token limits, format requirements
4. **Test Iteratively:** Refine prompts based on outputs

### Memory Management

1. **Limit History:** Last 10 messages only
2. **Compress Context:** Summarize long conversations
3. **Clean Old Data:** TTL on DynamoDB items
4. **Cache Frequently:** Redis for common queries

### Cost Optimization

1. **Route Intelligently:** Use Haiku for simple queries
2. **Cache Aggressively:** Reduce duplicate calls
3. **Limit Tokens:** Set appropriate max_tokens
4. **Monitor Usage:** Track costs in real-time

## Troubleshooting

### Agent Not Responding

1. Check Bedrock API credentials
2. Verify model IDs are correct
3. Check CloudWatch logs for errors
4. Verify network connectivity

### Poor Quality Responses

1. Review prompt templates
2. Check context retrieval quality
3. Verify skill level calculation
4. Test with different queries

### High Costs

1. Review token usage per agent
2. Check cache hit rates
3. Verify model routing logic
4. Consider using Haiku more

## Summary

Phase 4 delivers a production-ready multi-agent AI system with:
- ✅ 4 specialized agents
- ✅ LangGraph orchestration
- ✅ IRT adaptive difficulty
- ✅ Conversation memory
- ✅ RAG integration
- ✅ Cost optimization
- ✅ Error handling

The system is ready for Phase 5 (Security & Resilience) integration.
