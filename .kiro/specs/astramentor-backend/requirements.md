# Requirements Document: AstraMentor Backend System

## Introduction

AstraMentor is an AI-powered Socratic tutoring platform backend that provides intelligent code learning assistance through a multi-agent AI system. The backend integrates AWS Bedrock for AI capabilities, implements a sophisticated 5-stage RAG pipeline for code understanding, and manages user learning progress through adaptive difficulty using Item Response Theory (IRT). The system is designed to operate within a $300 AWS budget constraint while providing real-time streaming responses and comprehensive code analysis capabilities.

## Glossary

- **System**: The AstraMentor backend application
- **RAG**: Retrieval-Augmented Generation pipeline
- **HyDE**: Hypothetical Document Embeddings
- **IRT**: Item Response Theory for adaptive difficulty
- **LangGraph**: Agent orchestration framework
- **FAISS**: Facebook AI Similarity Search (vector database)
- **NetworkX**: Python library for knowledge graph operations
- **Tree-sitter**: Incremental parsing library for code analysis
- **SSE**: Server-Sent Events for streaming responses
- **Bedrock**: AWS managed AI service
- **Cognito**: AWS authentication service
- **RDS**: AWS Relational Database Service
- **DynamoDB**: AWS NoSQL database service
- **ECS**: AWS Elastic Container Service
- **Fargate**: AWS serverless compute for containers
- **CDK**: AWS Cloud Development Kit
- **AST**: Abstract Syntax Tree
- **JWT**: JSON Web Token
- **CORS**: Cross-Origin Resource Sharing
- **Repository**: User-uploaded codebase for analysis
- **Agent**: Specialized AI component with specific responsibilities
- **Context_Window**: Token limit for AI model input
- **Embedding**: Vector representation of text/code
- **Knowledge_Graph**: Graph structure representing code relationships
- **Sandbox**: Isolated execution environment for code
- **Session**: User interaction period with conversation history
- **Chunk**: Segmented portion of code for processing
- **Reranking**: Process of re-ordering retrieval results by relevance


## Requirements

### Requirement 1: Multi-Agent AI System

**User Story:** As a learner, I want intelligent AI assistance that adapts to my skill level and provides appropriate guidance, so that I can learn effectively at my own pace.

#### Acceptance Criteria

1. WHEN the System receives a user query, THE System SHALL route it to the appropriate Agent based on query intent
2. THE Tutor_Agent SHALL provide Socratic questioning responses that guide users without giving direct answers
3. THE Debugger_Agent SHALL analyze code errors and provide root cause explanations with progressive hints
4. THE Builder_Agent SHALL generate code suggestions and refactoring recommendations when requested
5. THE Verifier_Agent SHALL generate test cases and validate code quality when verification is requested
6. WHEN an Agent processes a request, THE System SHALL maintain conversation context across multiple turns
7. WHEN a user demonstrates skill improvement, THE System SHALL adapt question difficulty using IRT scoring
8. THE System SHALL use LangGraph to orchestrate Agent workflows and manage state transitions
9. WHEN multiple Agents are needed, THE System SHALL coordinate Agent handoffs without losing context
10. THE System SHALL store Agent interaction history in DynamoDB for session persistence

### Requirement 2: Advanced RAG Pipeline

**User Story:** As a learner, I want the AI to understand my codebase deeply and provide relevant context-aware answers, so that I receive accurate guidance specific to my project.

#### Acceptance Criteria

1. WHEN the System receives a query, THE System SHALL enhance it using HyDE to generate hypothetical relevant documents
2. WHEN a query is complex, THE System SHALL decompose it into multiple sub-queries for parallel retrieval
3. THE System SHALL perform hybrid retrieval combining vector search and knowledge graph traversal
4. WHEN retrieval results are obtained, THE System SHALL apply 3-pass reranking: semantic similarity, code relevance, and context optimization
5. THE System SHALL assemble final context within the model's Context_Window token budget
6. WHEN assembling context, THE System SHALL prioritize the most relevant code chunks based on reranking scores
7. THE System SHALL complete the entire RAG pipeline within 1 second for typical queries
8. WHEN retrieval finds no relevant results, THE System SHALL inform the user and suggest query refinements
9. THE System SHALL cache frequently accessed retrieval results in Redis to reduce latency
10. THE System SHALL log retrieval metrics for monitoring pipeline performance

### Requirement 3: AWS Bedrock Integration

**User Story:** As a system operator, I want cost-effective AI model usage that balances quality and budget, so that the system stays within financial constraints while providing good responses.

#### Acceptance Criteria

1. THE System SHALL use Claude 3.5 Sonnet for complex reasoning and tutoring tasks
2. THE System SHALL use Claude 3 Haiku for simple queries and fast responses
3. THE System SHALL use Titan Embeddings G1 for generating vector embeddings
4. WHEN a query is received, THE System SHALL route it to the appropriate model based on complexity analysis
5. THE System SHALL stream AI responses using Server-Sent Events to provide real-time feedback
6. WHEN streaming responses, THE System SHALL deliver the first token within 2 seconds
7. THE System SHALL implement retry logic with exponential backoff for Bedrock API failures
8. THE System SHALL track Bedrock API costs per request and maintain running totals
9. WHEN cost thresholds are approached, THE System SHALL send alerts to administrators
10. THE System SHALL gracefully handle rate limiting from Bedrock with appropriate user messaging

### Requirement 4: Knowledge Graph Construction

**User Story:** As a learner, I want the system to understand relationships between code components, so that I can explore dependencies and understand code architecture.

#### Acceptance Criteria

1. WHEN a Repository is uploaded, THE System SHALL parse all supported language files to extract entities
2. THE System SHALL create Knowledge_Graph nodes for files, classes, functions, variables, and concepts
3. THE System SHALL create edges representing relationships: imports, calls, extends, implements, depends_on, related_to
4. THE System SHALL use NetworkX for graph operations including path finding and dependency analysis
5. WHEN a user queries about code relationships, THE System SHALL traverse the Knowledge_Graph to find relevant connections
6. THE System SHALL persist the Knowledge_Graph to disk using JSON serialization
7. WHEN code files are modified, THE System SHALL incrementally update affected graph nodes and edges
8. THE System SHALL support graph queries for finding all dependencies of a given component
9. THE System SHALL identify concept clusters in the Knowledge_Graph for learning path recommendations
10. THE System SHALL complete graph construction for a typical repository within 5 minutes

### Requirement 5: Vector Search Implementation

**User Story:** As a learner, I want fast semantic search over my codebase, so that I can quickly find relevant code examples and documentation.

#### Acceptance Criteria

1. THE System SHALL use FAISS with HNSW indexing for approximate nearest neighbor search
2. WHEN code is indexed, THE System SHALL generate embeddings using AWS Bedrock Titan Embeddings G1
3. THE System SHALL chunk code files using semantic chunking with configurable overlap
4. THE System SHALL store metadata with each vector including file path, language, entity type, and timestamp
5. WHEN a search query is received, THE System SHALL return the top-k most similar code chunks within 1 second
6. THE System SHALL persist FAISS indices to local disk storage
7. WHEN new code is added, THE System SHALL incrementally update the vector index without full rebuild
8. THE System SHALL support filtering search results by metadata fields
9. THE System SHALL normalize embeddings for cosine similarity comparison
10. THE System SHALL handle index corruption by rebuilding from source code

### Requirement 6: Code Analysis and Parsing

**User Story:** As a learner, I want the system to understand code structure and identify issues, so that I receive accurate analysis and suggestions.

#### Acceptance Criteria

1. THE System SHALL support parsing JavaScript, TypeScript, Python, Java, Go, and Rust using Tree-sitter
2. WHEN a code file is uploaded, THE System SHALL parse it into an Abstract Syntax Tree
3. THE System SHALL extract code entities including functions, classes, variables, and imports from the AST
4. THE System SHALL calculate complexity metrics including cyclomatic complexity and nesting depth
5. THE System SHALL identify common code smells such as long functions and duplicated code
6. THE System SHALL detect basic security vulnerabilities including SQL injection patterns and XSS risks
7. WHEN code is modified, THE System SHALL incrementally reparse only affected portions
8. THE System SHALL handle parsing errors gracefully and report specific error locations
9. THE System SHALL extract docstrings and comments for documentation indexing
10. THE System SHALL complete parsing and analysis for a typical file within 500 milliseconds

### Requirement 7: Data Persistence Layer

**User Story:** As a system operator, I want reliable data storage that balances performance and cost, so that user data is preserved and quickly accessible.

#### Acceptance Criteria

1. THE System SHALL store user profiles, authentication data, and repository metadata in PostgreSQL RDS
2. THE System SHALL store chat history and Agent interactions in DynamoDB for fast access
3. THE System SHALL store repository files and code snapshots in S3
4. THE System SHALL cache session data and frequently accessed queries in Redis ElastiCache
5. WHEN a user session is created, THE System SHALL store session tokens in Redis with TTL expiration
6. THE System SHALL implement rate limiting counters in Redis per user
7. WHEN database writes fail, THE System SHALL retry with exponential backoff up to 3 attempts
8. THE System SHALL use database connection pooling to optimize resource usage
9. THE System SHALL implement database migrations using Alembic for schema changes
10. THE System SHALL backup PostgreSQL data daily to S3

### Requirement 8: API Layer Implementation

**User Story:** As a frontend developer, I want well-documented REST and streaming APIs, so that I can integrate the backend with the frontend application.

#### Acceptance Criteria

1. THE System SHALL implement REST endpoints using FastAPI for all CRUD operations
2. THE System SHALL provide Server-Sent Events endpoints for streaming AI responses
3. THE System SHALL validate all incoming requests using Pydantic models
4. THE System SHALL authenticate requests by validating JWT tokens from AWS Cognito
5. THE System SHALL generate OpenAPI documentation automatically from FastAPI route definitions
6. WHEN API rate limits are exceeded, THE System SHALL return HTTP 429 with retry-after headers
7. THE System SHALL implement CORS middleware to allow requests from the frontend domain
8. THE System SHALL return consistent error response formats with error codes and messages
9. THE System SHALL log all API requests with request ID, user ID, endpoint, and response time
10. THE System SHALL implement health check endpoints for monitoring service availability

### Requirement 9: Authentication and Authorization

**User Story:** As a user, I want secure authentication that protects my data and learning progress, so that my account remains private and secure.

#### Acceptance Criteria

1. THE System SHALL validate JWT tokens issued by AWS Cognito on all protected endpoints
2. WHEN a token is invalid or expired, THE System SHALL return HTTP 401 Unauthorized
3. THE System SHALL extract user identity from validated JWT tokens for request context
4. THE System SHALL implement role-based access control with user and admin roles
5. WHEN a user attempts unauthorized actions, THE System SHALL return HTTP 403 Forbidden
6. THE System SHALL refresh expired tokens using Cognito refresh token flow
7. THE System SHALL implement API key authentication for service-to-service communication
8. THE System SHALL rate limit authentication attempts to prevent brute force attacks
9. THE System SHALL log all authentication failures for security monitoring
10. THE System SHALL store sensitive credentials in AWS Secrets Manager

### Requirement 10: Code Execution Sandbox

**User Story:** As a learner, I want to safely execute code in a playground environment, so that I can test my solutions without security risks.

#### Acceptance Criteria

1. THE System SHALL execute user code in an isolated sandbox environment
2. THE System SHALL enforce execution time limits of 30 seconds per code run
3. THE System SHALL enforce memory limits of 512MB per code execution
4. THE System SHALL prevent network access from sandboxed code execution
5. THE System SHALL prevent file system access outside designated temporary directories
6. WHEN code execution exceeds limits, THE System SHALL terminate the process and return a timeout error
7. THE System SHALL capture stdout, stderr, and return values from code execution
8. THE System SHALL sanitize code execution output to prevent injection attacks
9. THE System SHALL support executing code in Python, JavaScript, and TypeScript runtimes
10. THE System SHALL queue execution requests to prevent resource exhaustion

### Requirement 11: Repository Management

**User Story:** As a learner, I want to upload and manage my code repositories, so that the AI can provide context-aware assistance for my projects.

#### Acceptance Criteria

1. WHEN a user uploads a Repository, THE System SHALL accept ZIP files up to 100MB
2. THE System SHALL extract uploaded repositories to S3 storage
3. THE System SHALL validate repository structure and reject invalid uploads
4. WHEN a Repository is uploaded, THE System SHALL initiate asynchronous indexing
5. THE System SHALL parse all supported code files in the Repository
6. THE System SHALL build the Knowledge_Graph and vector indices for the Repository
7. THE System SHALL track indexing progress and report status to the user
8. WHEN indexing completes, THE System SHALL mark the Repository as ready for queries
9. THE System SHALL allow users to delete repositories and clean up associated data
10. THE System SHALL support incremental updates when repository files are modified

### Requirement 12: Learning Progress Tracking

**User Story:** As a learner, I want the system to track my progress and adapt to my skill level, so that I receive appropriately challenging content.

#### Acceptance Criteria

1. THE System SHALL track user interactions including questions asked, hints requested, and problems solved
2. THE System SHALL calculate skill level estimates using Item Response Theory
3. WHEN a user successfully solves a problem, THE System SHALL increase their skill estimate for related concepts
4. WHEN a user struggles with a problem, THE System SHALL decrease difficulty for subsequent questions
5. THE System SHALL store learning progress data in PostgreSQL with timestamps
6. THE System SHALL provide API endpoints to retrieve user progress statistics
7. THE System SHALL identify knowledge gaps based on interaction patterns
8. THE System SHALL recommend learning paths based on current skill levels and gaps
9. THE System SHALL track time spent on different topics and concepts
10. THE System SHALL generate progress reports showing skill growth over time

### Requirement 13: Error Handling and Resilience

**User Story:** As a user, I want the system to handle errors gracefully and recover from failures, so that I have a reliable learning experience.

#### Acceptance Criteria

1. WHEN external service calls fail, THE System SHALL retry with exponential backoff
2. WHEN retries are exhausted, THE System SHALL return user-friendly error messages
3. THE System SHALL implement circuit breakers for external service dependencies
4. WHEN a circuit breaker opens, THE System SHALL return cached responses or degraded functionality
5. THE System SHALL validate all user inputs and return specific validation error messages
6. THE System SHALL catch and log all unhandled exceptions with full stack traces
7. WHEN database connections fail, THE System SHALL attempt reconnection before failing requests
8. THE System SHALL implement request timeouts to prevent hanging operations
9. THE System SHALL provide fallback responses when AI services are unavailable
10. THE System SHALL monitor error rates and alert when thresholds are exceeded

### Requirement 14: Monitoring and Observability

**User Story:** As a system operator, I want comprehensive monitoring and logging, so that I can troubleshoot issues and optimize performance.

#### Acceptance Criteria

1. THE System SHALL log all requests with structured JSON logging including request ID, user ID, and duration
2. THE System SHALL send logs to AWS CloudWatch Logs for centralized storage
3. THE System SHALL emit custom CloudWatch metrics for API latency, error rates, and throughput
4. THE System SHALL create CloudWatch alarms for critical metrics exceeding thresholds
5. WHEN alarms trigger, THE System SHALL send notifications via SNS
6. THE System SHALL implement distributed tracing for request flows across components
7. THE System SHALL track Bedrock API usage and costs in real-time
8. THE System SHALL provide dashboards showing system health and performance metrics
9. THE System SHALL log slow queries and operations exceeding performance targets
10. THE System SHALL retain logs for 30 days for debugging and analysis

### Requirement 15: AWS Infrastructure Deployment

**User Story:** As a system operator, I want infrastructure-as-code deployment that is reproducible and maintainable, so that I can reliably deploy and update the system.

#### Acceptance Criteria

1. THE System SHALL define all infrastructure using AWS CDK in TypeScript or Python
2. THE System SHALL deploy the API service on ECS Fargate with auto-scaling
3. THE System SHALL configure a VPC with public and private subnets across multiple availability zones
4. THE System SHALL deploy an Application Load Balancer to distribute traffic to ECS tasks
5. THE System SHALL provision RDS PostgreSQL in private subnets with automated backups
6. THE System SHALL provision ElastiCache Redis in private subnets for caching
7. THE System SHALL configure S3 buckets with appropriate lifecycle policies
8. THE System SHALL set up CloudFront distribution for static asset delivery
9. THE System SHALL implement auto-scaling policies based on CPU and memory utilization
10. THE System SHALL tag all resources with cost allocation tags for budget tracking

### Requirement 16: Cost Optimization

**User Story:** As a system operator, I want to minimize AWS costs while maintaining performance, so that the system operates within the $300 budget constraint.

#### Acceptance Criteria

1. THE System SHALL use AWS free tier resources where available
2. THE System SHALL use t3.micro instances for RDS and ElastiCache to minimize costs
3. THE System SHALL implement auto-scaling to scale down during low usage periods
4. THE System SHALL use Fargate Spot instances where appropriate for cost savings
5. THE System SHALL implement intelligent caching to reduce Bedrock API calls
6. THE System SHALL compress data stored in S3 to reduce storage costs
7. THE System SHALL use CloudFront caching to reduce data transfer costs
8. THE System SHALL set up billing alarms at $100, $200, and $280 thresholds
9. WHEN billing alarms trigger, THE System SHALL send email notifications to administrators
10. THE System SHALL provide cost breakdown reports by service and feature

### Requirement 17: Security Implementation

**User Story:** As a system operator, I want comprehensive security controls, so that user data and system resources are protected from threats.

#### Acceptance Criteria

1. THE System SHALL encrypt all data in transit using TLS 1.2 or higher
2. THE System SHALL encrypt all data at rest in RDS, DynamoDB, and S3
3. THE System SHALL implement security headers including HSTS, CSP, and X-Frame-Options
4. THE System SHALL sanitize all user inputs to prevent injection attacks
5. THE System SHALL implement rate limiting per user to prevent abuse
6. THE System SHALL use AWS WAF to protect against common web exploits
7. THE System SHALL restrict database access to application security groups only
8. THE System SHALL rotate database credentials stored in Secrets Manager
9. THE System SHALL implement least-privilege IAM roles for all services
10. THE System SHALL conduct security scanning of dependencies for known vulnerabilities

### Requirement 18: API Endpoint Implementation

**User Story:** As a frontend developer, I want all required API endpoints implemented according to the API contract, so that the frontend can integrate seamlessly.

#### Acceptance Criteria

1. THE System SHALL implement POST /api/v1/auth/login for user authentication
2. THE System SHALL implement POST /api/v1/auth/register for user registration
3. THE System SHALL implement POST /api/v1/repo/upload for repository uploads
4. THE System SHALL implement GET /api/v1/repo/{id}/status for indexing status
5. THE System SHALL implement POST /api/v1/chat/message for sending chat messages
6. THE System SHALL implement GET /api/v1/chat/stream for SSE streaming responses
7. THE System SHALL implement GET /api/v1/graph/nodes for knowledge graph data
8. THE System SHALL implement POST /api/v1/verify/code for code verification
9. THE System SHALL implement GET /api/v1/sessions/{id} for session retrieval
10. THE System SHALL implement GET /api/v1/progress/stats for progress statistics
11. THE System SHALL implement POST /api/v1/playground/execute for code execution
12. THE System SHALL implement GET /api/v1/challenges for challenge listing
13. THE System SHALL implement POST /api/v1/review/analyze for code review
14. THE System SHALL implement POST /api/v1/snippets for snippet creation
15. THE System SHALL implement GET /api/v1/snippets/{id} for snippet retrieval

### Requirement 19: Performance Requirements

**User Story:** As a user, I want fast response times and smooth interactions, so that my learning experience is not interrupted by delays.

#### Acceptance Criteria

1. THE System SHALL return the first token of streaming responses within 2 seconds
2. THE System SHALL complete RAG retrieval within 1 second for typical queries
3. THE System SHALL complete repository indexing within 5 minutes for repositories under 10MB
4. THE System SHALL handle API requests with p95 latency under 500 milliseconds
5. THE System SHALL support at least 100 concurrent users without degradation
6. THE System SHALL parse and analyze individual code files within 500 milliseconds
7. THE System SHALL execute sandboxed code within 5 seconds including queue time
8. THE System SHALL cache frequently accessed data with Redis hit rate above 80%
9. THE System SHALL maintain database connection pool utilization below 80%
10. THE System SHALL complete health checks within 100 milliseconds

### Requirement 20: Testing and Quality Assurance

**User Story:** As a developer, I want comprehensive test coverage, so that the system is reliable and bugs are caught early.

#### Acceptance Criteria

1. THE System SHALL include unit tests for all core business logic with minimum 80% coverage
2. THE System SHALL include integration tests for all API endpoints
3. THE System SHALL include property-based tests for critical algorithms
4. THE System SHALL run all tests in CI/CD pipeline before deployment
5. WHEN tests fail, THE System SHALL prevent deployment to production
6. THE System SHALL include load tests simulating expected user traffic
7. THE System SHALL validate API responses against OpenAPI schema definitions
8. THE System SHALL test error handling paths and edge cases
9. THE System SHALL include tests for security vulnerabilities
10. THE System SHALL generate test coverage reports for code review

