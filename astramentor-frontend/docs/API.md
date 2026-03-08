# API Integration Guide - AstraMentor Frontend

## Overview

This document describes how the AstraMentor frontend integrates with the backend API, including authentication, request handling, error management, and real-time features.

---

## 🔗 Base Configuration

### Environment Variables

```env
# .env.local
NEXT_PUBLIC_API_URL=https://api.astramentor.com
NEXT_PUBLIC_WS_URL=wss://api.astramentor.com
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_AWS_USER_POOL_ID=us-east-1_xxxxx
NEXT_PUBLIC_AWS_USER_POOL_CLIENT_ID=xxxxx
```

### API Client Setup

```typescript
// src/lib/api/client.ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

---

## 🔐 Authentication

### Token Management

```typescript
// Request interceptor - Add auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - Handle 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Attempt token refresh
      const refreshed = await refreshAuthToken();
      if (refreshed) {
        // Retry original request
        return apiClient.request(error.config);
      }
      // Logout if refresh fails
      logout();
    }
    throw error;
  }
);
```

### Authentication Endpoints

#### Login
```typescript
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "expiresIn": 3600,
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

#### Refresh Token
```typescript
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGc..."
}

Response:
{
  "accessToken": "eyJhbGc...",
  "expiresIn": 3600
}
```

#### Logout
```typescript
POST /api/v1/auth/logout
Authorization: Bearer {token}

Response:
{
  "success": true
}
```

---

## 💬 Chat API

### Ask Question

```typescript
POST /api/v1/chat/ask
Authorization: Bearer {token}
Content-Type: application/json

{
  "question": "How does this function work?",
  "sessionId": "session-123",
  "repoId": "repo-456",
  "socraticMode": true,
  "skillLevel": "intermediate",
  "context": {
    "file": "src/utils/helper.ts",
    "lineStart": 10,
    "lineEnd": 20,
    "code": "function example() { ... }"
  }
}

Response:
{
  "messageId": "msg-789",
  "streamUrl": "/api/v1/chat/stream/msg-789",
  "sessionId": "session-123"
}
```

### SSE Stream

```typescript
GET /api/v1/chat/stream/{messageId}
Authorization: Bearer {token}
Accept: text/event-stream

// Event types:
event: delta
data: {"content": "This function..."}

event: evidence
data: {
  "filePath": "src/utils/helper.ts",
  "startLine": 10,
  "endLine": 15,
  "snippet": "const result = ...",
  "explanation": "This code..."
}

event: complete
data: {
  "suggestedQuestions": [
    "What about error handling?",
    "Can this be optimized?"
  ]
}

event: error
data: {"message": "Failed to process request"}
```

### Get Sessions

```typescript
GET /api/v1/chat/sessions
Authorization: Bearer {token}

Response:
{
  "sessions": [
    {
      "id": "session-123",
      "title": "Understanding React Hooks",
      "lastMessage": "Great question about useEffect...",
      "messageCount": 15,
      "createdAt": "2026-03-01T10:00:00Z",
      "updatedAt": "2026-03-01T11:30:00Z"
    }
  ]
}
```

---

## 📁 Repository API

### Upload Repository

```typescript
POST /api/v1/repo/upload
Authorization: Bearer {token}
Content-Type: multipart/form-data

FormData:
- file: [binary data]
- name: "my-project"
- description: "My awesome project"

Response:
{
  "repoId": "repo-456",
  "status": "indexing",
  "message": "Repository uploaded successfully"
}
```

### Get Repository Status

```typescript
GET /api/v1/repo/{repoId}/status
Authorization: Bearer {token}

Response:
{
  "repoId": "repo-456",
  "status": "indexed" | "indexing" | "failed",
  "progress": 75,
  "currentFile": "src/components/Button.tsx",
  "fileCount": 150,
  "totalSize": "2.5 MB",
  "indexedAt": "2026-03-01T10:00:00Z"
}
```

### List Repositories

```typescript
GET /api/v1/repo/list
Authorization: Bearer {token}

Response:
{
  "repositories": [
    {
      "id": "repo-456",
      "name": "my-project",
      "status": "indexed",
      "fileCount": 150,
      "size": "2.5 MB",
      "createdAt": "2026-03-01T10:00:00Z"
    }
  ]
}
```

---

## 🕸️ Knowledge Graph API

### Get Graph Data

```typescript
GET /api/v1/graph/{repoId}
Authorization: Bearer {token}

Response:
{
  "nodes": [
    {
      "id": "node-1",
      "type": "file" | "class" | "function",
      "label": "Button.tsx",
      "metadata": {
        "path": "src/components/Button.tsx",
        "linesOfCode": 50,
        "complexity": 3
      }
    }
  ],
  "edges": [
    {
      "id": "edge-1",
      "source": "node-1",
      "target": "node-2",
      "type": "imports" | "calls" | "extends" | "implements",
      "label": "imports"
    }
  ]
}
```

---

## ✅ Code Verification API

### Verify Code

```typescript
POST /api/v1/verify
Authorization: Bearer {token}
Content-Type: application/json

{
  "repoId": "repo-456",
  "file": "src/utils/helper.ts",
  "code": "function example() { ... }"
}

Response:
{
  "testResults": [
    {
      "suite": "Helper Tests",
      "tests": [
        {
          "name": "should return correct value",
          "status": "passed" | "failed" | "skipped",
          "duration": 15,
          "error": null
        }
      ]
    }
  ],
  "summary": {
    "total": 10,
    "passed": 8,
    "failed": 2,
    "skipped": 0,
    "coverage": 85.5
  }
}
```

---

## 👤 User API

### Get Profile

```typescript
GET /api/v1/user/profile
Authorization: Bearer {token}

Response:
{
  "id": "user-123",
  "email": "user@example.com",
  "name": "John Doe",
  "avatar": "https://...",
  "preferences": {
    "skillLevel": "intermediate",
    "socraticMode": true,
    "theme": "dark"
  }
}
```

### Update Profile

```typescript
PUT /api/v1/user/profile
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "John Doe",
  "preferences": {
    "skillLevel": "advanced",
    "socraticMode": false
  }
}

Response:
{
  "success": true,
  "user": { ... }
}
```

---

## 🔧 Error Handling

### Error Response Format

```typescript
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

### Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `RATE_LIMIT` | 429 | Too many requests |
| `SERVER_ERROR` | 500 | Internal server error |

### Error Handling in Frontend

```typescript
try {
  const response = await apiClient.post('/endpoint', data);
  return response.data;
} catch (error) {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const message = error.response?.data?.error?.message;
    
    switch (status) {
      case 400:
        toast.error('Invalid input', { description: message });
        break;
      case 401:
        // Handled by interceptor
        break;
      case 403:
        toast.error('Access denied');
        break;
      case 404:
        toast.error('Not found');
        break;
      case 429:
        toast.error('Too many requests', {
          description: 'Please try again later'
        });
        break;
      default:
        toast.error('Something went wrong');
    }
  }
  throw error;
}
```

---

## 🔄 Request/Response Interceptors

### Request Logging (Development)

```typescript
if (process.env.NODE_ENV === 'development') {
  apiClient.interceptors.request.use((config) => {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  });
}
```

### Response Transformation

```typescript
apiClient.interceptors.response.use((response) => {
  // Transform dates from strings to Date objects
  if (response.data.createdAt) {
    response.data.createdAt = new Date(response.data.createdAt);
  }
  return response;
});
```

---

## 📊 Rate Limiting

### Client-Side Rate Limiting

```typescript
import { rateLimit } from '@/lib/utils/rate-limit';

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

export async function apiCall() {
  try {
    await limiter.check(10, 'API_CALL'); // 10 requests per minute
    return await apiClient.get('/endpoint');
  } catch {
    throw new Error('Rate limit exceeded');
  }
}
```

---

## 🧪 Testing API Integration

### Mock API Responses

```typescript
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.post('/api/v1/auth/login', (req, res, ctx) => {
    return res(
      ctx.json({
        accessToken: 'mock-token',
        user: { id: '1', email: 'test@example.com' }
      })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

---

## 📚 Type Safety

### Generated Types

```typescript
// Generated from OpenAPI spec
import type { paths } from '@/types/api.generated';

type LoginRequest = paths['/api/v1/auth/login']['post']['requestBody']['content']['application/json'];
type LoginResponse = paths['/api/v1/auth/login']['post']['responses']['200']['content']['application/json'];
```

### Type-Safe API Calls

```typescript
export async function login(data: LoginRequest): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>('/api/v1/auth/login', data);
  return response.data;
}
```

---

## 🔍 Debugging

### Enable Request Logging

```typescript
// .env.local
NEXT_PUBLIC_API_DEBUG=true
```

### Network Tab
- Use browser DevTools Network tab
- Filter by XHR/Fetch
- Inspect request/response headers and body

### API Client Debugging

```typescript
apiClient.interceptors.request.use((config) => {
  if (process.env.NEXT_PUBLIC_API_DEBUG) {
    console.group(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    console.log('Headers:', config.headers);
    console.log('Data:', config.data);
    console.groupEnd();
  }
  return config;
});
```

---

**Last Updated:** March 1, 2026

