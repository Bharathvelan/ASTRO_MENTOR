# AstraMentor Backend API Documentation

## Base URL

- **Local Development**: `http://localhost:8000`
- **Production**: `https://<cloudfront-domain>` or `http://<alb-dns-name>`

## Interactive Documentation

- **Swagger UI**: `/docs`
- **ReDoc**: `/redoc`
- **OpenAPI Spec**: `/openapi.json`

## Authentication

Most endpoints require authentication via AWS Cognito JWT tokens.

```http
Authorization: Bearer <jwt-token>
```

## Endpoints

### Health & Status

#### GET /
Root endpoint with API information.

**Response:**
```json
{
  "message": "AstraMentor API",
  "version": "0.1.0",
  "status": "running"
}
```

#### GET /health
Health check endpoint for monitoring.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "components": {
    "database": "healthy",
    "redis": "healthy"
  }
}
```

### Repository Management

#### POST /api/v1/repo/upload
Upload a code repository as a ZIP file for indexing.

**Request:**
- Content-Type: `multipart/form-data`
- Body: `file` (ZIP file, max 100MB)

**Response:**
```json
{
  "repository_id": "repo_123",
  "status": "indexing",
  "message": "Repository uploaded successfully"
}
```

**Status Codes:**
- `200`: Success
- `400`: Invalid file or size exceeded
- `401`: Unauthorized
- `500`: Server error

#### GET /api/v1/repo/{id}/status
Get repository indexing status and progress.

**Parameters:**
- `id` (path): Repository ID

**Response:**
```json
{
  "repository_id": "repo_123",
  "status": "completed",
  "progress": 100,
  "file_count": 42,
  "indexed_at": "2024-01-15T10:35:00Z"
}
```

**Status Values:**
- `pending`: Queued for indexing
- `indexing`: Currently being processed
- `completed`: Indexing finished
- `failed`: Indexing error

#### DELETE /api/v1/repo/{id}
Delete a repository and all associated data.

**Parameters:**
- `id` (path): Repository ID

**Response:**
```json
{
  "message": "Repository deleted successfully",
  "repository_id": "repo_123"
}
```

### Chat & AI Agents

#### POST /api/v1/chat/message
Send a message to the AI tutor and get a response.

**Request:**
```json
{
  "session_id": "session_123",
  "message": "How do I implement JWT authentication?",
  "repo_id": "repo_456"
}
```

**Response:**
```json
{
  "response": "Let's explore JWT authentication together...",
  "agent_type": "tutor",
  "session_id": "session_123",
  "timestamp": "2024-01-15T10:40:00Z",
  "metadata": {
    "tokens_used": 1250,
    "latency_ms": 850,
    "model": "claude-3-5-sonnet"
  }
}
```

**Agent Types:**
- `tutor`: Socratic questioning and guidance
- `debugger`: Error analysis and debugging help
- `builder`: Code generation and refactoring
- `verifier`: Test generation and verification

#### GET /api/v1/chat/stream
Stream AI responses using Server-Sent Events (SSE).

**Parameters:**
- `session_id` (query): Session ID
- `message` (query): User message
- `repo_id` (query, optional): Repository ID

**Response:**
Server-Sent Events stream:
```
data: {"type": "start", "agent": "tutor"}

data: {"type": "token", "content": "Let's"}

data: {"type": "token", "content": " explore"}

data: {"type": "end", "metadata": {"tokens": 1250}}
```

**Event Types:**
- `start`: Stream beginning
- `token`: Incremental content
- `end`: Stream complete
- `error`: Error occurred

### Code Playground

#### POST /api/v1/playground/execute
Execute code in a sandboxed environment.

**Request:**
```json
{
  "code": "print('Hello, World!')",
  "language": "python"
}
```

**Response:**
```json
{
  "stdout": "Hello, World!\n",
  "stderr": "",
  "exit_code": 0,
  "execution_time_ms": 45
}
```

**Supported Languages:**
- `python`: Python 3.11
- `javascript`: Node.js
- `typescript`: TypeScript (compiled to JS)

**Limits:**
- Timeout: 30 seconds
- Memory: 512MB
- No network access
- Filesystem restricted to temp directory

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message",
  "detail": "Detailed error information",
  "status_code": 400
}
```

### Common Status Codes

- `200`: Success
- `400`: Bad Request (invalid input)
- `401`: Unauthorized (missing/invalid token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `429`: Too Many Requests (rate limit exceeded)
- `500`: Internal Server Error
- `503`: Service Unavailable

## Rate Limiting

Rate limits are enforced per user:

- **Per Minute**: 60 requests
- **Per Hour**: 1000 requests

When rate limit is exceeded:
```json
{
  "error": "Rate limit exceeded",
  "retry_after": 30
}
```

Response headers:
- `X-RateLimit-Limit`: Total requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Time when limit resets (Unix timestamp)
- `Retry-After`: Seconds to wait before retry

## Request/Response Headers

### Common Request Headers
```http
Authorization: Bearer <jwt-token>
Content-Type: application/json
Accept: application/json
```

### Common Response Headers
```http
Content-Type: application/json
X-Request-ID: <unique-request-id>
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
```

## Pagination

Endpoints that return lists support pagination:

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

**Response:**
```json
{
  "items": [...],
  "total": 150,
  "page": 1,
  "limit": 20,
  "pages": 8
}
```

## Filtering & Sorting

List endpoints support filtering and sorting:

**Query Parameters:**
- `filter[field]`: Filter by field value
- `sort`: Sort field (prefix with `-` for descending)

**Example:**
```
GET /api/v1/repos?filter[status]=completed&sort=-created_at
```

## Webhooks

(Future feature - not yet implemented)

## SDK Examples

### Python
```python
import requests

# Upload repository
with open('repo.zip', 'rb') as f:
    response = requests.post(
        'http://localhost:8000/api/v1/repo/upload',
        files={'file': f},
        headers={'Authorization': f'Bearer {token}'}
    )
    repo_id = response.json()['repository_id']

# Send chat message
response = requests.post(
    'http://localhost:8000/api/v1/chat/message',
    json={
        'session_id': 'session_123',
        'message': 'How do I use async/await?',
        'repo_id': repo_id
    },
    headers={'Authorization': f'Bearer {token}'}
)
print(response.json()['response'])
```

### JavaScript
```javascript
// Upload repository
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const uploadResponse = await fetch('http://localhost:8000/api/v1/repo/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
const { repository_id } = await uploadResponse.json();

// Send chat message
const chatResponse = await fetch('http://localhost:8000/api/v1/chat/message', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    session_id: 'session_123',
    message: 'How do I use async/await?',
    repo_id: repository_id
  })
});
const { response } = await chatResponse.json();
console.log(response);
```

### cURL
```bash
# Upload repository
curl -X POST http://localhost:8000/api/v1/repo/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@repository.zip"

# Send chat message
curl -X POST http://localhost:8000/api/v1/chat/message \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "session_123",
    "message": "How do I use async/await?",
    "repo_id": "repo_456"
  }'

# Stream chat (SSE)
curl -N http://localhost:8000/api/v1/chat/stream?session_id=session_123&message=Hello

# Execute code
curl -X POST http://localhost:8000/api/v1/playground/execute \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "print(\"Hello, World!\")",
    "language": "python"
  }'
```

## Best Practices

1. **Always include error handling** for network failures and API errors
2. **Implement exponential backoff** for retries on 5xx errors
3. **Respect rate limits** and handle 429 responses gracefully
4. **Use streaming** for long-running AI responses
5. **Cache responses** when appropriate (repository status, etc.)
6. **Validate input** before sending to API
7. **Use HTTPS** in production
8. **Store tokens securely** (never in localStorage for web apps)

## Troubleshooting

### 401 Unauthorized
- Check token is valid and not expired
- Ensure Authorization header is properly formatted
- Verify token has required scopes

### 429 Rate Limit Exceeded
- Implement exponential backoff
- Check Retry-After header
- Consider caching responses

### 500 Internal Server Error
- Check CloudWatch logs for details
- Verify all services (RDS, Redis, DynamoDB) are healthy
- Contact support if issue persists

### Slow Response Times
- Use streaming endpoints for AI responses
- Check repository size (large repos take longer to index)
- Monitor CloudWatch metrics for bottlenecks

## Support

- **Documentation**: https://docs.astramentor.com
- **GitHub Issues**: https://github.com/astramentor/backend/issues
- **Email**: support@astramentor.com
