# Implementation Plan: AstraMentor Backend System

## Overview

This implementation plan breaks down the AstraMentor backend into 8 phases, following the project's phased approach. Each phase builds incrementally on previous work, with checkpoints to ensure stability. The implementation focuses on creating a production-ready AI-powered tutoring backend within the $300 AWS budget constraint.

## Tasks


### Phase 1: Foundation (Config, DB, Auth)

- [ ] 1. Set up project structure and dependencies
  - Create Python project with Poetry for dependency management
  - Set up directory structure: src/, tests/, infrastructure/
  - Configure FastAPI application with CORS, logging, and middleware
  - Set up environment configuration with pydantic-settings
  - Create .env.example with all required environment variables
  - _Requirements: 8.1, 8.7_

- [ ] 2. Implement database models and connections
  - [ ] 2.1 Create SQLAlchemy models for PostgreSQL
    - Implement User, Repository, Session, UserProgress, Interaction, Challenge, ChallengeAttempt, Snippet models
    - Add indexes for foreign keys and frequently queried fields
    - Set up Alembic for database migrations
    - _Requirements: 7.1, 7.9_
  
  - [ ]* 2.2 Write property test for database round-trip persistence
    - **Property 40: Database Round-Trip Persistence**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4**
  
  - [ ] 2.3 Create DynamoDB table definitions
    - Define chat_messages table with session_id partition key and timestamp sort key
    - Define agent_interactions table with user_id partition key and timestamp sort key
    - Create boto3 client wrapper for DynamoDB operations
    - _Requirements: 7.2_
  
  - [ ]* 2.4 Write property test for DynamoDB chat message persistence
    - **Property 41: DynamoDB Chat Message Persistence**
    - **Validates: Requirements 7.2**
  
  - [ ] 2.5 Set up Redis connection and cache utilities
    - Create Redis client with connection pooling
    - Implement cache decorator for frequently accessed data
    - Add TTL management for cached items
    - _Requirements: 7.4, 7.5_
  
  - [ ]* 2.6 Write property test for Redis cache expiration
    - **Property 42: Redis Cache Expiration**
    - **Validates: Requirements 7.5**

- [ ] 3. Implement authentication and authorization
  - [ ] 3.1 Create AWS Cognito JWT validation middleware
    - Implement JWT token validation using python-jose
    - Extract user identity (Cognito sub) from validated tokens
    - Add authentication dependency for protected routes
    - _Requirements: 8.4, 9.1, 9.3_
  
  - [ ]* 3.2 Write property test for JWT token validation
    - **Property 45: JWT Token Validation**
    - **Validates: Requirements 8.4, 9.1**
  
  - [ ] 3.3 Implement role-based access control
    - Create role enum (user, admin)
    - Add role checking decorator for endpoints
    - Store user roles in database
    - _Requirements: 9.4_
  
  - [ ]* 3.4 Write property test for RBAC enforcement
    - **Property 50: Role-Based Access Control**
    - **Validates: Requirements 9.4**
  
  - [ ]* 3.5 Write unit tests for authentication edge cases
    - Test invalid token returns 401
    - Test expired token returns 401
    - Test unauthorized access returns 403
    - _Requirements: 9.2, 9.5_

- [ ] 4. Set up logging and error handling infrastructure
  - [ ] 4.1 Configure structured logging with structlog
    - Set up JSON logging format with timestamp, level, request_id, user_id
    - Configure CloudWatch Logs handler
    - Add request ID middleware for distributed tracing
    - _Requirements: 14.1, 14.2_
  
  - [ ]* 4.2 Write property test for structured logging format
    - **Property 68: Structured Logging Format**
    - **Validates: Requirements 14.1**
  
  - [ ] 4.3 Implement global exception handlers
    - Create exception handlers for common errors (ValidationError, HTTPException)
    - Implement consistent error response format
    - Add exception logging with stack traces
    - _Requirements: 13.6, 8.8_
  
  - [ ]* 4.4 Write property test for error response format consistency
    - **Property 47: Error Response Format Consistency**
    - **Validates: Requirements 8.8**
  
  - [ ] 4.5 Implement retry logic with exponential backoff
    - Create retry decorator using tenacity library
    - Configure retry for database and external service calls
    - Add circuit breaker using circuitbreaker library
    - _Requirements: 13.1, 13.3, 7.7_
  
  - [ ]* 4.6 Write property test for database retry on failure
    - **Property 43: Database Retry on Failure**
    - **Validates: Requirements 7.7**

- [ ] 5. Checkpoint - Foundation complete
  - Ensure all tests pass, ask the user if questions arise.



### Phase 2: Data Layer (Parser, Graph, Vectors)

- [ ] 6. Implement code parser with Tree-sitter
  - [ ] 6.1 Set up Tree-sitter parsers for all supported languages
    - Install tree-sitter-python, tree-sitter-javascript, tree-sitter-typescript, tree-sitter-java, tree-sitter-go, tree-sitter-rust
    - Create CodeParser class with parser instances for each language
    - Implement language detection from file extensions
    - _Requirements: 6.1_
  
  - [ ]* 6.2 Write property test for multi-language parsing support
    - **Property 31: Multi-Language Parsing Support**
    - **Validates: Requirements 6.1**
  
  - [ ] 6.3 Implement AST parsing and entity extraction
    - Create methods to extract functions, classes, imports, variables from AST
    - Implement docstring and comment extraction
    - Add error handling for parse failures with location reporting
    - _Requirements: 6.2, 6.3, 6.9, 6.8_
  
  - [ ]* 6.4 Write property test for AST generation
    - **Property 32: AST Generation**
    - **Validates: Requirements 6.2**
  
  - [ ]* 6.5 Write property test for entity extraction completeness
    - **Property 33: Entity Extraction Completeness**
    - **Validates: Requirements 6.3**
  
  - [ ] 6.6 Implement code analysis features
    - Calculate cyclomatic complexity and nesting depth
    - Detect code smells (long functions, duplicated code)
    - Identify basic security vulnerabilities (SQL injection, XSS patterns)
    - _Requirements: 6.4, 6.5, 6.6_
  
  - [ ]* 6.7 Write property test for complexity metrics calculation
    - **Property 34: Complexity Metrics Calculation**
    - **Validates: Requirements 6.4**
  
  - [ ]* 6.8 Write property test for code smell detection
    - **Property 35: Code Smell Detection**
    - **Validates: Requirements 6.5**
  
  - [ ] 6.9 Implement incremental parsing
    - Add change detection to identify modified code sections
    - Implement partial AST updates for changed sections only
    - _Requirements: 6.7_
  
  - [ ]* 6.10 Write property test for incremental parsing
    - **Property 37: Incremental Parsing**
    - **Validates: Requirements 6.7**

- [ ] 7. Implement knowledge graph with NetworkX
  - [ ] 7.1 Create KnowledgeGraphManager class
    - Implement graph loading and saving with JSON serialization
    - Add methods for node and edge creation
    - Implement graph caching by repository ID
    - _Requirements: 4.2, 4.3, 4.6_
  
  - [ ]* 7.2 Write property test for knowledge graph serialization round-trip
    - **Property 21: Knowledge Graph Serialization Round-Trip**
    - **Validates: Requirements 4.6**
  
  - [ ] 7.3 Implement graph construction from parsed code
    - Create nodes for files, classes, functions, variables
    - Create edges for imports, calls, extends, implements relationships
    - Extract relationships from AST
    - _Requirements: 4.1, 4.2, 4.3_
  
  - [ ]* 7.4 Write property test for entity coverage
    - **Property 18: Knowledge Graph Entity Coverage**
    - **Validates: Requirements 4.2**
  
  - [ ]* 7.5 Write property test for relationship creation
    - **Property 19: Knowledge Graph Relationship Creation**
    - **Validates: Requirements 4.3**
  
  - [ ] 7.6 Implement graph query operations
    - Add method to find related nodes within max depth (BFS)
    - Implement dependency query (find all dependencies of entity)
    - Add concept clustering using community detection
    - _Requirements: 4.5, 4.8, 4.9_
  
  - [ ]* 7.7 Write property test for relationship traversal
    - **Property 20: Graph Relationship Traversal**
    - **Validates: Requirements 4.5**
  
  - [ ]* 7.8 Write property test for dependency query completeness
    - **Property 23: Dependency Query Completeness**
    - **Validates: Requirements 4.8**
  
  - [ ] 7.9 Implement incremental graph updates
    - Add change detection for modified files
    - Update only affected nodes and edges
    - Preserve unrelated graph portions
    - _Requirements: 4.7_
  
  - [ ]* 7.10 Write property test for incremental graph updates
    - **Property 22: Incremental Graph Updates**
    - **Validates: Requirements 4.7**

- [ ] 8. Implement vector store with FAISS
  - [ ] 8.1 Create VectorStoreManager class
    - Initialize FAISS HNSW index with configurable dimension
    - Implement index loading and saving to disk
    - Add metadata storage with pickle
    - _Requirements: 5.1, 5.6_
  
  - [ ]* 8.2 Write property test for FAISS index serialization round-trip
    - **Property 27: FAISS Index Serialization Round-Trip**
    - **Validates: Requirements 5.6**
  
  - [ ] 8.3 Implement semantic chunking
    - Create chunking strategy with configurable overlap
    - Implement chunk boundary detection (function/class boundaries)
    - Add metadata attachment (file path, language, entity type)
    - _Requirements: 5.3, 5.4_
  
  - [ ]* 8.4 Write property test for semantic chunking overlap
    - **Property 25: Semantic Chunking Overlap**
    - **Validates: Requirements 5.3**
  
  - [ ]* 8.5 Write property test for vector metadata preservation
    - **Property 26: Vector Metadata Preservation**
    - **Validates: Requirements 5.4**
  
  - [ ] 8.6 Implement vector search operations
    - Add vector addition with normalization
    - Implement similarity search with top-k results
    - Add metadata filtering support
    - _Requirements: 5.5, 5.8, 5.9_
  
  - [ ]* 8.7 Write property test for embedding normalization
    - **Property 30: Embedding Normalization**
    - **Validates: Requirements 5.9**
  
  - [ ]* 8.8 Write property test for metadata filtering
    - **Property 29: Vector Search Metadata Filtering**
    - **Validates: Requirements 5.8**
  
  - [ ] 8.9 Implement incremental index updates
    - Add vectors without full rebuild
    - Track vector count before and after additions
    - _Requirements: 5.7_
  
  - [ ]* 8.10 Write property test for incremental vector index updates
    - **Property 28: Incremental Vector Index Updates**
    - **Validates: Requirements 5.7**

- [ ] 9. Checkpoint - Data layer complete
  - Ensure all tests pass, ask the user if questions arise.



### Phase 3: Retrieval (RAG Pipeline)

- [x] 10. Implement AWS Bedrock client
  - [x] 10.1 Create BedrockClient class
    - Initialize boto3 bedrock-runtime client
    - Configure model IDs for Claude Sonnet, Haiku, and Titan Embeddings
    - Implement error handling and retries
    - _Requirements: 3.1, 3.2, 3.3_
  
  - [x] 10.2 Implement Claude model invocation
    - Add invoke_claude_sonnet method with streaming support
    - Add invoke_claude_haiku method for fast responses
    - Implement streaming response parsing
    - _Requirements: 3.1, 3.2, 3.5_
  
  - [ ]* 10.3 Write property test for SSE streaming incremental delivery
    - **Property 14: SSE Streaming Incremental Delivery**
    - **Validates: Requirements 3.5**
  
  - [x] 10.4 Implement Titan embeddings
    - Add get_embedding method for text to vector conversion
    - Implement batch embedding for efficiency
    - Add embedding caching
    - _Requirements: 3.3, 5.2_
  
  - [x] 10.5 Implement model routing and cost tracking
    - Add route_model method based on query complexity
    - Implement cost tracking per request
    - Add running total calculation
    - _Requirements: 3.4, 3.8_
  
  - [ ]* 10.6 Write property test for cost tracking accumulation
    - **Property 16: Cost Tracking Accumulation**
    - **Validates: Requirements 3.8**
  
  - [x] 10.7 Implement retry logic with exponential backoff
    - Add retry decorator for Bedrock API calls
    - Implement exponential backoff calculation
    - Add max retry limit
    - _Requirements: 3.7_
  
  - [ ]* 10.8 Write property test for Bedrock retry exponential backoff
    - **Property 15: Bedrock Retry Exponential Backoff**
    - **Validates: Requirements 3.7**
  
  - [ ]* 10.9 Write unit tests for Bedrock error handling
    - Test cost threshold alert
    - Test rate limiting handling
    - _Requirements: 3.9, 3.10_

- [x] 11. Implement RAG pipeline stages
  - [x] 11.1 Implement Stage 1: Query Enhancement (HyDE)
    - Create enhance_query_hyde method
    - Generate hypothetical document using Claude Haiku
    - Combine original query with hypothetical answer
    - _Requirements: 2.1_
  
  - [ ]* 11.2 Write property test for HyDE query enhancement
    - **Property 6: HyDE Query Enhancement**
    - **Validates: Requirements 2.1**
  
  - [x] 11.3 Implement Stage 2: Query Decomposition
    - Create decompose_query method
    - Detect complex queries with conjunctions
    - Split into multiple sub-queries
    - _Requirements: 2.2_
  
  - [ ]* 11.4 Write property test for complex query decomposition
    - **Property 7: Complex Query Decomposition**
    - **Validates: Requirements 2.2**
  
  - [x] 11.5 Implement Stage 3: Hybrid Retrieval
    - Create vector_retrieve method using FAISS
    - Create graph_retrieve method using NetworkX
    - Merge results from both sources
    - _Requirements: 2.3_
  
  - [ ]* 11.6 Write property test for hybrid retrieval coverage
    - **Property 8: Hybrid Retrieval Coverage**
    - **Validates: Requirements 2.3**
  
  - [x] 11.7 Implement Stage 4: 3-Pass Reranking
    - Implement Pass 1: Semantic similarity reranking
    - Implement Pass 2: Code relevance scoring
    - Implement Pass 3: Context window optimization
    - _Requirements: 2.4_
  
  - [ ]* 11.8 Write property test for reranking order change
    - **Property 9: Reranking Order Change**
    - **Validates: Requirements 2.4**
  
  - [x] 11.9 Implement Stage 5: Context Assembly
    - Create assemble_context method with token budget
    - Implement token estimation
    - Prioritize by relevance scores
    - _Requirements: 2.5, 2.6_
  
  - [ ]* 11.10 Write property test for token budget compliance
    - **Property 10: Token Budget Compliance**
    - **Validates: Requirements 2.5**
  
  - [ ]* 11.11 Write property test for context prioritization
    - **Property 11: Context Prioritization**
    - **Validates: Requirements 2.6**

- [x] 12. Implement RAG pipeline caching and monitoring
  - [x] 12.1 Add Redis caching for retrieval results
    - Cache query results with TTL
    - Implement cache key generation from query
    - Add cache hit/miss tracking
    - _Requirements: 2.9_
  
  - [ ]* 12.2 Write property test for cache hit consistency
    - **Property 12: Cache Hit Consistency**
    - **Validates: Requirements 2.9**
  
  - [x] 12.3 Implement retrieval metrics logging
    - Log query, result count, latency, scores
    - Send metrics to CloudWatch
    - _Requirements: 2.10_
  
  - [ ]* 12.4 Write property test for retrieval metrics logging
    - **Property 13: Retrieval Metrics Logging**
    - **Validates: Requirements 2.10**
  
  - [ ]* 12.5 Write unit test for empty retrieval results
    - Test handling when no results found
    - Verify user-friendly error message
    - _Requirements: 2.8_

- [x] 13. Checkpoint - RAG pipeline complete
  - Ensure all tests pass, ask the user if questions arise.



### Phase 4: AI Layer (Agents, Memory, IRT)

- [x] 14. Implement IRT engine for adaptive difficulty
  - [x] 14.1 Create IRTEngine class
    - Implement get_user_skill method with database queries
    - Add estimate_theta method using maximum likelihood estimation
    - Implement probability_correct calculation (2PL model)
    - _Requirements: 12.2, 1.7_
  
  - [ ]* 14.2 Write property test for IRT skill level bounds
    - **Property 61: IRT Skill Level Bounds**
    - **Validates: Requirements 12.2**
  
  - [x] 14.3 Implement skill tracking and updates
    - Add update_skill method to record interactions
    - Implement recommend_difficulty for next questions
    - Store interactions in database
    - _Requirements: 12.1, 12.3_
  
  - [ ]* 14.4 Write property test for progress interaction recording
    - **Property 62: Progress Interaction Recording**
    - **Validates: Requirements 12.1**
  
  - [ ]* 14.5 Write property test for skill level increase on success
    - **Property 63: Skill Level Increase on Success**
    - **Validates: Requirements 12.3**
  
  - [ ]* 14.6 Write property test for IRT skill adaptation
    - **Property 3: IRT Skill Adaptation**
    - **Validates: Requirements 1.7**

- [x] 15. Implement specialized AI agents
  - [x] 15.1 Create TutorAgent class
    - Implement Socratic prompt building based on skill level
    - Add process method for generating guiding questions
    - Integrate with Bedrock Claude Sonnet
    - _Requirements: 1.2_
  
  - [x] 15.2 Create DebuggerAgent class
    - Implement error extraction and analysis
    - Add similar error retrieval from knowledge base
    - Create debug prompt with progressive hints
    - _Requirements: 1.3_
  
  - [x] 15.3 Create BuilderAgent class
    - Implement code generation prompt building
    - Add style guide integration
    - Create refactoring suggestion logic
    - _Requirements: 1.4_
  
  - [x] 15.4 Create VerifierAgent class
    - Implement static code analysis integration
    - Add test case generation
    - Create verification prompt building
    - _Requirements: 1.5_
  
  - [ ]* 15.5 Write property test for verifier output format
    - **Property 5: Verifier Output Format**
    - **Validates: Requirements 1.5**

- [x] 16. Implement LangGraph agent orchestration
  - [x] 16.1 Create AgentOrchestrator class
    - Set up LangGraph StateGraph
    - Define AgentState TypedDict
    - Add nodes for each agent and intent classifier
    - _Requirements: 1.8, 1.1_
  
  - [x] 16.2 Implement intent classification
    - Create classify_intent method
    - Add routing logic based on query patterns
    - Implement conditional edge routing
    - _Requirements: 1.1_
  
  - [ ]* 16.3 Write property test for agent intent routing
    - **Property 1: Agent Intent Routing**
    - **Validates: Requirements 1.1, 3.4**
  
  - [x] 16.4 Implement conversation memory management
    - Add memory store integration with DynamoDB
    - Implement conversation history retrieval
    - Add context preservation across turns
    - _Requirements: 1.6, 1.9_
  
  - [ ]* 16.5 Write property test for conversation context preservation
    - **Property 2: Conversation Context Preservation**
    - **Validates: Requirements 1.6, 1.9**
  
  - [x] 16.6 Implement agent workflow execution
    - Add process_query method for graph invocation
    - Implement state management and checkpointing
    - Add agent handoff coordination
    - _Requirements: 1.8, 1.9_
  
  - [x] 16.7 Implement agent interaction persistence
    - Store interactions to DynamoDB
    - Add metadata tracking (model used, tokens, latency)
    - _Requirements: 1.10_
  
  - [ ]* 16.8 Write property test for agent interaction persistence
    - **Property 4: Agent Interaction Persistence**
    - **Validates: Requirements 1.10**

- [x] 17. Checkpoint - AI layer complete
  - Ensure all tests pass, ask the user if questions arise.



### Phase 5: Security & Resilience

- [x] 18. Implement code execution sandbox
  - [x] 18.1 Create CodeExecutor class
    - Set up temporary directory management
    - Implement timeout enforcement (30 seconds)
    - Add memory limit configuration
    - _Requirements: 10.1, 10.2, 10.3_
  
  - [ ]* 18.2 Write property test for execution timeout enforcement
    - **Property 53: Execution Timeout Enforcement**
    - **Validates: Requirements 10.2**
  
  - [x] 18.3 Implement Python code execution
    - Create execute_python method with subprocess
    - Capture stdout, stderr, exit code
    - Implement timeout handling
    - _Requirements: 10.9, 10.7_
  
  - [ ]* 18.4 Write property test for execution output capture
    - **Property 54: Execution Output Capture**
    - **Validates: Requirements 10.7**
  
  - [x] 18.4 Implement JavaScript/TypeScript execution
    - Create execute_javascript method with Node.js
    - Add TypeScript compilation support
    - Implement same timeout and capture logic
    - _Requirements: 10.9_
  
  - [ ]* 18.5 Write property test for multi-runtime support
    - **Property 56: Multi-Runtime Support**
    - **Validates: Requirements 10.9**
  
  - [x] 18.6 Implement sandbox isolation
    - Prevent network access from sandboxed code
    - Restrict filesystem access to temp directory only
    - Add output sanitization for dangerous content
    - _Requirements: 10.4, 10.5, 10.8_
  
  - [ ]* 18.7 Write property test for sandbox isolation - network
    - **Property 51: Sandbox Isolation - Network**
    - **Validates: Requirements 10.4**
  
  - [ ]* 18.8 Write property test for sandbox isolation - filesystem
    - **Property 52: Sandbox Isolation - Filesystem**
    - **Validates: Requirements 10.5**
  
  - [ ]* 18.9 Write property test for output sanitization
    - **Property 55: Output Sanitization**
    - **Validates: Requirements 10.8**
  
  - [x] 18.10 Implement execution queue management
    - Add queue for execution requests
    - Implement sequential processing
    - Add queue status tracking
    - _Requirements: 10.10_
  
  - [ ]* 18.11 Write property test for execution queue management
    - **Property 57: Execution Queue Management**
    - **Validates: Requirements 10.10**

- [x] 19. Implement security controls
  - [x] 19.1 Add security headers middleware
    - Implement Strict-Transport-Security header
    - Add Content-Security-Policy header
    - Add X-Frame-Options and X-Content-Type-Options
    - _Requirements: 17.3_
  
  - [ ]* 19.2 Write property test for security header presence
    - **Property 70: Security Header Presence**
    - **Validates: Requirements 17.3**
  
  - [x] 19.3 Implement input sanitization
    - Create sanitization functions for SQL injection patterns
    - Add XSS prevention (script tag removal)
    - Implement special character escaping
    - _Requirements: 17.4_
  
  - [ ]* 19.4 Write property test for input sanitization
    - **Property 71: Input Sanitization**
    - **Validates: Requirements 17.4**
  
  - [x] 19.5 Implement rate limiting
    - Add rate limiting middleware using Redis
    - Configure per-user request limits
    - Return 429 with Retry-After header
    - _Requirements: 17.5, 8.6_
  
  - [ ]* 19.6 Write property test for rate limiting enforcement
    - **Property 72: Rate Limiting Enforcement**
    - **Validates: Requirements 17.5**
  
  - [ ]* 19.7 Write unit test for rate limit exceeded
    - Test 429 response when limit exceeded
    - _Requirements: 8.6_
  
  - [x] 19.8 Implement data encryption
    - Configure RDS encryption at rest
    - Configure S3 encryption at rest
    - Ensure TLS 1.2+ for all connections
    - _Requirements: 17.1, 17.2_

- [x] 20. Implement resilience patterns
  - [x] 20.1 Add circuit breaker for external services
    - Implement circuit breaker for Bedrock API
    - Add failure threshold and recovery timeout
    - Implement half-open state testing
    - _Requirements: 13.3, 13.4_
  
  - [ ]* 20.2 Write property test for circuit breaker state transitions
    - **Property 64: Circuit Breaker State Transitions**
    - **Validates: Requirements 13.3, 13.4**
  
  - [x] 20.3 Implement request timeout enforcement
    - Add timeout configuration for all operations
    - Implement timeout cancellation
    - Return timeout errors to users
    - _Requirements: 13.8_
  
  - [ ]* 20.4 Write property test for request timeout enforcement
    - **Property 67: Request Timeout Enforcement**
    - **Validates: Requirements 13.8**
  
  - [x] 20.5 Implement graceful degradation
    - Add fallback for vector search failures (graph-only)
    - Add fallback for Claude Sonnet failures (use Haiku)
    - Add fallback for Redis failures (no caching)
    - _Requirements: 13.4_

- [x] 21. Checkpoint - Security and resilience complete
  - Ensure all tests pass, ask the user if questions arise.



### Phase 6: API & Streaming

- [x] 22. Implement repository management endpoints
  - [x] 22.1 Create POST /api/v1/repo/upload endpoint
    - Accept multipart file upload (ZIP files)
    - Validate file size (max 100MB)
    - Upload to S3 with unique key
    - Create repository record in database
    - _Requirements: 18.3, 11.1_
  
  - [ ]* 22.2 Write property test for repository upload size validation
    - **Property 58: Repository Upload Size Validation**
    - **Validates: Requirements 11.1**
  
  - [x] 22.3 Create GET /api/v1/repo/{id}/status endpoint
    - Return repository metadata
    - Include indexing status and progress
    - _Requirements: 18.4_
  
  - [x] 22.4 Implement repository indexing pipeline
    - Extract ZIP file to temporary directory
    - Parse all code files with CodeParser
    - Build knowledge graph with KnowledgeGraphManager
    - Build vector index with VectorStoreManager
    - Update indexing status and progress
    - _Requirements: 11.4, 11.5, 11.6, 11.7, 11.8_
  
  - [ ]* 22.5 Write property test for repository file parsing completeness
    - **Property 17: Repository File Parsing Completeness**
    - **Validates: Requirements 4.1**
  
  - [ ]* 22.6 Write property test for repository indexing status tracking
    - **Property 59: Repository Indexing Status Tracking**
    - **Validates: Requirements 11.4, 11.7, 11.8**
  
  - [x] 22.7 Create DELETE /api/v1/repo/{id} endpoint
    - Delete repository record from database
    - Delete S3 files
    - Delete knowledge graph and vector index
    - _Requirements: 11.9_
  
  - [ ]* 22.8 Write property test for repository deletion cleanup
    - **Property 60: Repository Deletion Cleanup**
    - **Validates: Requirements 11.9**

- [x] 23. Implement chat and streaming endpoints
  - [x] 23.1 Create POST /api/v1/chat/message endpoint
    - Accept session_id, message, optional repo_id
    - Validate request with Pydantic
    - Route to AgentOrchestrator
    - Execute RAG pipeline for context
    - Return agent response
    - _Requirements: 18.5_
  
  - [ ]* 23.2 Write property test for request validation rejection
    - **Property 44: Request Validation Rejection**
    - **Validates: Requirements 8.3**
  
  - [x] 23.3 Create GET /api/v1/chat/stream endpoint
    - Accept session_id as query parameter
    - Validate authentication
    - Stream agent responses using SSE
    - Format as SSE events (data: prefix, double newline)
    - _Requirements: 18.6, 8.2_
  
  - [ ]* 23.4 Write unit test for SSE endpoint exists
    - Test SSE content type header
    - _Requirements: 8.2_
  
  - [x] 23.5 Implement chat message persistence
    - Store messages to DynamoDB
    - Include metadata (agent type, tokens, latency)
    - _Requirements: 7.2_

- [ ] 24. Implement session and progress endpoints
  - [ ] 24.1 Create POST /api/v1/sessions endpoint
    - Create new session with optional repo_id
    - Store in PostgreSQL
    - Return session ID
    - _Requirements: 18.9_
  
  - [ ] 24.2 Create GET /api/v1/sessions/{id} endpoint
    - Return session metadata
    - Include associated repository info
    - _Requirements: 18.9_
  
  - [ ] 24.3 Create GET /api/v1/progress/stats endpoint
    - Query user progress from database
    - Calculate average skill level
    - Return concept-level progress
    - Include recent activity
    - _Requirements: 18.10, 12.1_

- [ ] 25. Implement verification and playground endpoints
  - [ ] 25.1 Create POST /api/v1/verify/code endpoint
    - Accept code and language
    - Route to VerifierAgent
    - Run static analysis
    - Generate test cases
    - Return verification results
    - _Requirements: 18.8_
  
  - [x] 25.2 Create POST /api/v1/playground/execute endpoint
    - Accept code and language
    - Validate language is supported
    - Queue execution request
    - Execute in sandbox
    - Return stdout, stderr, exit code
    - _Requirements: 18.11_

- [ ] 26. Implement knowledge graph and additional endpoints
  - [ ] 26.1 Create GET /api/v1/graph/nodes endpoint
    - Accept repo_id and optional entity filter
    - Query knowledge graph
    - Return nodes with relationships
    - _Requirements: 18.7_
  
  - [ ] 26.2 Create GET /api/v1/challenges endpoint
    - Query challenges from database
    - Filter by difficulty and concepts
    - Return challenge list
    - _Requirements: 18.12_
  
  - [ ] 26.3 Create POST /api/v1/review/analyze endpoint
    - Accept code for review
    - Run code analysis (complexity, smells, vulnerabilities)
    - Return analysis results
    - _Requirements: 18.13_
  
  - [ ] 26.4 Create POST /api/v1/snippets endpoint
    - Create new snippet
    - Store in database
    - Return snippet ID
    - _Requirements: 18.14_
  
  - [ ] 26.5 Create GET /api/v1/snippets/{id} endpoint
    - Retrieve snippet by ID
    - Return snippet data
    - _Requirements: 18.15_

- [ ] 27. Implement API middleware and utilities
  - [ ] 27.1 Add CORS middleware
    - Configure allowed origins (frontend domain)
    - Add CORS headers to all responses
    - _Requirements: 8.7_
  
  - [ ]* 27.2 Write property test for CORS header presence
    - **Property 46: CORS Header Presence**
    - **Validates: Requirements 8.7**
  
  - [ ] 27.3 Add request logging middleware
    - Log all requests with request_id, user_id, endpoint, method
    - Log response status and duration
    - _Requirements: 8.9_
  
  - [ ]* 27.4 Write property test for API request logging
    - **Property 48: API Request Logging**
    - **Validates: Requirements 8.9**
  
  - [ ] 27.5 Add user identity extraction
    - Extract user_id from JWT in request context
    - Make available to all endpoints
    - _Requirements: 9.3_
  
  - [ ]* 27.6 Write property test for user identity extraction
    - **Property 49: User Identity Extraction**
    - **Validates: Requirements 9.3**
  
  - [x] 27.7 Create health check endpoint
    - Implement GET /health
    - Check database connectivity
    - Check Redis connectivity
    - Return status and component health
    - _Requirements: 8.10_
  
  - [ ]* 27.8 Write unit test for health check endpoint
    - Test expected response format
    - _Requirements: 8.10_

- [ ] 28. Implement OpenAPI documentation
  - [ ] 28.1 Configure FastAPI OpenAPI generation
    - Add endpoint descriptions and examples
    - Configure response models
    - Add authentication scheme documentation
    - _Requirements: 8.5_
  
  - [ ]* 28.2 Write unit test for OpenAPI documentation generation
    - Test OpenAPI spec is generated
    - Verify all endpoints are documented
    - _Requirements: 8.5_

- [ ] 29. Checkpoint - API and streaming complete
  - Ensure all tests pass, ask the user if questions arise.



### Phase 7: AWS Infrastructure (CDK)

- [x] 30. Set up AWS CDK project
  - [x] 30.1 Initialize CDK project
    - Create infrastructure/ directory
    - Initialize CDK app with Python
    - Configure CDK context and environment
    - _Requirements: 15.1_
  
  - [x] 30.2 Create base stack class
    - Define AstraMentorStack
    - Set up stack parameters (environment, budget tags)
    - Configure resource naming conventions
    - _Requirements: 15.1_

- [x] 31. Implement networking infrastructure
  - [x] 31.1 Create VPC and subnets
    - Define VPC with 2 availability zones
    - Create public and private subnets
    - Configure NAT gateway (1 for cost optimization)
    - _Requirements: 15.3_
  
  - [x] 31.2 Configure security groups
    - Create security group for ECS tasks
    - Create security group for RDS
    - Create security group for ElastiCache
    - Configure ingress/egress rules
    - _Requirements: 17.7_
  
  - [x] 31.3 Set up Application Load Balancer
    - Create ALB in public subnets
    - Configure target group for ECS
    - Add HTTPS listener with certificate
    - _Requirements: 15.4_

- [x] 32. Implement database infrastructure
  - [x] 32.1 Create RDS PostgreSQL instance
    - Configure t3.micro instance (free tier)
    - Set up in private subnets
    - Enable encryption at rest
    - Configure automated backups
    - Store credentials in Secrets Manager
    - _Requirements: 15.5, 17.2, 17.8_
  
  - [x] 32.2 Create ElastiCache Redis cluster
    - Configure cache.t3.micro instance (free tier)
    - Set up in private subnets
    - Configure parameter group
    - _Requirements: 15.6_
  
  - [x] 32.3 Create DynamoDB tables
    - Define chat_messages table
    - Define agent_interactions table
    - Configure on-demand billing
    - Enable encryption at rest
    - _Requirements: 7.2, 17.2_

- [x] 33. Implement storage infrastructure
  - [x] 33.1 Create S3 buckets
    - Create bucket for repository storage
    - Enable encryption at rest
    - Configure lifecycle policies (IA after 30 days, delete after 90 days)
    - Block public access
    - _Requirements: 15.7, 17.2, 16.6_
  
  - [x] 33.2 Set up CloudFront distribution
    - Create distribution for static assets
    - Configure origin as ALB
    - Enable HTTPS only
    - Configure caching policies
    - _Requirements: 15.8, 16.7_

- [x] 34. Implement compute infrastructure
  - [x] 34.1 Create ECS cluster
    - Define ECS cluster
    - Enable container insights
    - _Requirements: 15.2_
  
  - [x] 34.2 Create Fargate task definition
    - Define task with 0.5 vCPU, 1GB memory
    - Configure container image from ECR
    - Set environment variables
    - Add secrets from Secrets Manager
    - Configure CloudWatch Logs
    - _Requirements: 15.2_
  
  - [x] 34.3 Create Fargate service
    - Define service with desired count 1
    - Configure ALB target group
    - Set up service discovery
    - _Requirements: 15.2_
  
  - [x] 34.4 Configure auto-scaling
    - Add CPU-based scaling (target 70%)
    - Add memory-based scaling (target 80%)
    - Set min capacity 1, max capacity 5
    - _Requirements: 15.9, 16.3_

- [x] 35. Implement monitoring and cost controls
  - [x] 35.1 Set up CloudWatch Logs
    - Configure log groups for ECS tasks
    - Set retention to 7 days (cost optimization)
    - _Requirements: 14.2_
  
  - [ ]* 35.2 Write property test for CloudWatch metrics emission
    - **Property 69: CloudWatch Metrics Emission**
    - **Validates: Requirements 14.3**
  
  - [x] 35.3 Create CloudWatch alarms
    - Create cost alarm at $250 threshold
    - Create error rate alarm (5% threshold)
    - Create latency alarm (p95 > 1s)
    - Configure SNS topic for notifications
    - _Requirements: 14.4, 14.5, 16.8, 16.9_
  
  - [x] 35.4 Configure resource tagging
    - Add cost allocation tags to all resources
    - Tag with project, environment, component
    - _Requirements: 15.10, 16.10_

- [x] 36. Implement IAM roles and policies
  - [x] 36.1 Create ECS task execution role
    - Add permissions for ECR, CloudWatch Logs, Secrets Manager
    - Implement least-privilege principle
    - _Requirements: 17.9_
  
  - [x] 36.2 Create ECS task role
    - Add permissions for S3, DynamoDB, RDS, Bedrock
    - Add permissions for CloudWatch metrics
    - Implement least-privilege principle
    - _Requirements: 17.9_

- [x] 37. Create deployment scripts
  - [x] 37.1 Create CDK deployment script
    - Add cdk synth command
    - Add cdk deploy command with confirmation
    - Add cdk destroy command for cleanup
    - _Requirements: 15.1_
  
  - [x] 37.2 Create database migration script
    - Run Alembic migrations on deployment
    - Add rollback capability
    - _Requirements: 7.9_
  
  - [x] 37.3 Create Docker build and push script
    - Build Docker image
    - Push to ECR
    - Tag with version
    - _Requirements: 15.2_

- [x] 38. Checkpoint - Infrastructure complete
  - Ensure CDK synth succeeds, ask the user if questions arise.



### Phase 8: Documentation & Testing

- [x] 39. Write comprehensive documentation
  - [x] 39.1 Create API documentation
    - Document all endpoints with examples
    - Include request/response schemas
    - Add authentication requirements
    - Document error codes and messages
    - _Requirements: 8.5_
  
  - [x] 39.2 Create architecture documentation
    - Document system architecture with diagrams
    - Explain component interactions
    - Document data flow through RAG pipeline
    - Explain agent orchestration
    - _Requirements: Design document reference_
  
  - [x] 39.3 Create deployment guide
    - Document prerequisites (AWS account, credentials)
    - Provide step-by-step deployment instructions
    - Document environment variables
    - Add troubleshooting section
    - _Requirements: 15.1_
  
  - [x] 39.4 Create developer guide
    - Document local development setup
    - Explain project structure
    - Add contribution guidelines
    - Document testing procedures
    - _Requirements: 20.1, 20.2, 20.3_

- [ ] 40. Complete integration testing
  - [ ]* 40.1 Write end-to-end chat flow integration test
    - Test repository upload → indexing → chat → response
    - Verify RAG pipeline integration
    - Verify agent orchestration
    - _Requirements: 18.5, 18.6_
  
  - [ ]* 40.2 Write code execution integration test
    - Test code submission → sandbox execution → results
    - Verify timeout enforcement
    - Verify output capture
    - _Requirements: 18.11_
  
  - [ ]* 40.3 Write authentication integration test
    - Test JWT validation across endpoints
    - Test role-based access control
    - Test unauthorized access handling
    - _Requirements: 9.1, 9.4, 9.5_

- [ ] 41. Perform load testing
  - [ ]* 41.1 Create load test scenarios with Locust
    - Simulate 100 concurrent users
    - Test chat message endpoints
    - Test code execution endpoints
    - Measure p95 latency and throughput
    - _Requirements: 19.5_
  
  - [ ]* 41.2 Analyze load test results
    - Verify p95 latency under 500ms
    - Verify error rate under 1%
    - Identify bottlenecks
    - _Requirements: 19.4_
  
  - [ ]* 41.3 Estimate costs under load
    - Calculate Bedrock API costs
    - Calculate data transfer costs
    - Calculate compute costs
    - Verify total under $300 budget
    - _Requirements: 16.1, 16.10_

- [ ] 42. Complete property-based testing
  - [ ]* 42.1 Verify all 72 properties are implemented
    - Review property test coverage
    - Ensure each property has corresponding test
    - Run all property tests with 100+ iterations
    - _Requirements: 20.3_
  
  - [ ]* 42.2 Review property test results
    - Analyze any failures
    - Fix bugs discovered by property tests
    - Re-run until all pass
    - _Requirements: 20.3_

- [ ] 43. Complete unit testing
  - [ ]* 43.1 Verify unit test coverage meets 80% threshold
    - Run coverage report
    - Identify uncovered code paths
    - Add tests for uncovered areas
    - _Requirements: 20.1_
  
  - [ ]* 43.2 Test all error handling paths
    - Test invalid inputs
    - Test service failures
    - Test timeout scenarios
    - Test edge cases
    - _Requirements: 20.8_

- [ ] 44. Security testing
  - [ ]* 44.1 Run security vulnerability scan
    - Scan dependencies for known vulnerabilities
    - Use safety or snyk for Python packages
    - Fix or document any findings
    - _Requirements: 17.10_
  
  - [ ]* 44.2 Test security controls
    - Verify input sanitization prevents injection
    - Verify sandbox prevents unauthorized access
    - Verify rate limiting prevents abuse
    - Verify authentication prevents unauthorized access
    - _Requirements: 17.4, 10.4, 10.5, 17.5, 9.1_

- [ ] 45. Create CI/CD pipeline
  - [ ] 45.1 Set up GitHub Actions workflow
    - Configure test job (unit, property, integration)
    - Configure coverage reporting
    - Configure deployment job (on main branch)
    - Add manual approval for production
    - _Requirements: 20.4, 20.5_
  
  - [ ] 45.2 Configure automated testing
    - Run tests on every pull request
    - Block merge if tests fail
    - Require 80% coverage
    - _Requirements: 20.4, 20.5_

- [ ] 46. Final validation and deployment
  - [ ] 46.1 Deploy to AWS
    - Run CDK deploy
    - Verify all resources created
    - Run database migrations
    - Verify health check passes
    - _Requirements: 15.1_
  
  - [ ] 46.2 Smoke test deployed system
    - Test authentication flow
    - Test repository upload and indexing
    - Test chat with AI agents
    - Test code execution
    - Verify all endpoints respond
    - _Requirements: 18.1-18.15_
  
  - [ ] 46.3 Monitor initial usage
    - Check CloudWatch logs for errors
    - Monitor cost metrics
    - Verify auto-scaling works
    - Check alarm status
    - _Requirements: 14.1, 14.3, 14.4, 16.8_

- [ ] 47. Final checkpoint - Project complete
  - All tests pass, documentation complete, system deployed and validated.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at the end of each phase
- Property tests validate universal correctness properties (72 total)
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end flows
- Load tests validate performance under expected usage
- The 8-phase structure aligns with the project's phased development approach
- Budget monitoring is critical throughout - set up billing alarms early
- Use free tier resources (t3.micro) wherever possible to minimize costs
- Aggressive caching and model routing help stay within Bedrock API budget

