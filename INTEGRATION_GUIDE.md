# AstraMentor Frontend-Backend Integration Guide

## Overview
This guide explains how the AstraMentor frontend (Next.js) and backend (FastAPI) are integrated and how to run them together.

## Configuration

### Backend Configuration
**Location:** `astramentor-backend/.env`

```env
# Database
DATABASE_URL=sqlite:///./astramentor.db

# AWS Credentials
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=AklxmJaU1Xkal9gNUX109XPLDqoLI9lPkRhahTXn

# Cognito (Placeholder)
COGNITO_USER_POOL_ID=us-east-1_PLACEHOLDER
COGNITO_CLIENT_ID=placeholder_client_id

# Server
ENVIRONMENT=development
```

**CORS Configuration:** Backend allows requests from `http://localhost:3000`

### Frontend Configuration
**Location:** `astramentor-frontend/.env.local`

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://127.0.0.1:8001

# AWS Cognito (matches backend placeholders)
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_PLACEHOLDER
NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID=placeholder_client_id

# Development Mode
NEXT_PUBLIC_DEV_MODE=true
```

## Running the Application

### Option 1: Run Both Servers Separately

**Terminal 1 - Backend:**
```cmd
cd astramentor-backend
python -m poetry run uvicorn src.api.main:app --host 127.0.0.1 --port 8001 --reload
```

**Terminal 2 - Frontend:**
```cmd
cd astramentor-frontend
npm run dev
```

### Option 2: Use the Start Script (Recommended)

Create a start script to run both servers:

**Windows (start-dev.bat):**
```batch
@echo off
echo Starting AstraMentor Development Servers...
echo.

start "Backend Server" cmd /k "cd astramentor-backend && python -m poetry run uvicorn src.api.main:app --host 127.0.0.1 --port 8001 --reload"

timeout /t 3 /nobreak > nul

start "Frontend Server" cmd /k "cd astramentor-frontend && npm run dev"

echo.
echo Servers starting...
echo Backend: http://127.0.0.1:8001
echo Frontend: http://localhost:3000
echo API Docs: http://127.0.0.1:8001/docs
```

## API Endpoints

### Backend API (Port 8001)

**Base URL:** `http://127.0.0.1:8001`

**Health Check:**
- `GET /health` - Server health status

**API Documentation:**
- `GET /docs` - Interactive Swagger UI
- `GET /redoc` - ReDoc documentation

**API Routes (v1):**
- `POST /api/v1/repositories/upload` - Upload repository
- `GET /api/v1/repositories/{repo_id}` - Get repository details
- `POST /api/v1/chat/message` - Send chat message
- `GET /api/v1/chat/stream` - Stream chat responses
- `POST /api/v1/playground/execute` - Execute code in playground

### Frontend (Port 3000)

**Base URL:** `http://localhost:3000`

**Routes:**
- `/` - Landing page
- `/login` - User login
- `/register` - User registration
- `/dashboard` - Main dashboard
- `/graph` - Knowledge graph visualization
- `/playground` - Code playground
- `/settings` - User settings

## Integration Points

### 1. API Client Configuration
The frontend uses the `NEXT_PUBLIC_API_URL` environment variable to configure API requests.

**Location:** `astramentor-frontend/src/lib/query/query-client.ts`

### 2. Authentication Flow
- Frontend uses AWS Amplify for Cognito authentication
- Backend validates JWT tokens from Cognito
- Auth middleware: `astramentor-backend/src/api/middleware/auth.py`

### 3. Real-time Communication
- Chat uses Server-Sent Events (SSE) for streaming responses
- Frontend: `astramentor-frontend/src/lib/hooks/useSSE.ts`
- Backend: `astramentor-backend/src/api/routes/chat.py`

### 4. File Upload
- Repository uploads handled via multipart/form-data
- Frontend: `astramentor-frontend/src/components/repo/RepoUpload.tsx`
- Backend: `astramentor-backend/src/api/routes/repository.py`

## Testing the Integration

### 1. Verify Backend is Running
```cmd
curl http://127.0.0.1:8001/health
```

Expected response:
```json
{
  "status": "healthy",
  "version": "0.1.0"
}
```

### 2. Verify Frontend Can Reach Backend
Open browser console at `http://localhost:3000` and check for:
- No CORS errors
- Successful API calls to backend
- Network tab shows requests to `http://127.0.0.1:8001`

### 3. Test API Documentation
Visit `http://127.0.0.1:8001/docs` to:
- View all available endpoints
- Test endpoints directly from Swagger UI
- Verify request/response schemas

## Common Issues and Solutions

### Issue 1: CORS Errors
**Symptom:** Browser console shows CORS policy errors

**Solution:**
1. Verify backend CORS_ORIGINS includes `http://localhost:3000`
2. Check `astramentor-backend/src/core/config.py`
3. Restart backend server after changes

### Issue 2: Connection Refused
**Symptom:** Frontend can't connect to backend

**Solution:**
1. Verify backend is running on port 8001
2. Check firewall settings
3. Ensure `NEXT_PUBLIC_API_URL` is set correctly

### Issue 3: Authentication Errors
**Symptom:** 401 Unauthorized errors

**Solution:**
1. Verify Cognito configuration matches between frontend and backend
2. Check JWT token is being sent in Authorization header
3. For development, you may need to disable auth middleware temporarily

### Issue 4: Port Already in Use
**Symptom:** "Address already in use" error

**Solution:**
- Backend (8001): Change port in uvicorn command
- Frontend (3000): Set `PORT=3001` in environment or use `npm run dev -- -p 3001`

## Development Workflow

### 1. Start Development Servers
```cmd
# Backend with hot reload
cd astramentor-backend
python -m poetry run uvicorn src.api.main:app --host 127.0.0.1 --port 8001 --reload

# Frontend with hot reload
cd astramentor-frontend
npm run dev
```

### 2. Make Changes
- Backend changes auto-reload with `--reload` flag
- Frontend changes auto-reload with Next.js Fast Refresh

### 3. Test Changes
- Use browser DevTools Network tab
- Check backend logs in terminal
- Use Swagger UI for API testing

## Production Deployment

### Backend
- Deploy to AWS Lambda or ECS
- Use environment variables for configuration
- Enable HTTPS
- Update CORS_ORIGINS to production frontend URL

### Frontend
- Deploy to Vercel, AWS Amplify, or S3+CloudFront
- Set `NEXT_PUBLIC_API_URL` to production backend URL
- Configure production Cognito settings
- Enable analytics and error tracking

## Environment Variables Summary

### Backend (.env)
| Variable | Description | Example |
|----------|-------------|---------|
| DATABASE_URL | Database connection string | `sqlite:///./astramentor.db` |
| AWS_REGION | AWS region | `us-east-1` |
| AWS_ACCESS_KEY_ID | AWS access key | Your AWS key |
| AWS_SECRET_ACCESS_KEY | AWS secret key | Your AWS secret |
| COGNITO_USER_POOL_ID | Cognito user pool ID | `us-east-1_PLACEHOLDER` |
| COGNITO_CLIENT_ID | Cognito client ID | `placeholder_client_id` |
| ENVIRONMENT | Environment name | `development` |

### Frontend (.env.local)
| Variable | Description | Example |
|----------|-------------|---------|
| NEXT_PUBLIC_API_URL | Backend API URL | `http://127.0.0.1:8001` |
| NEXT_PUBLIC_COGNITO_USER_POOL_ID | Cognito user pool ID | `us-east-1_PLACEHOLDER` |
| NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID | Cognito client ID | `placeholder_client_id` |
| NEXT_PUBLIC_DEV_MODE | Development mode flag | `true` |
| NEXT_PUBLIC_AWS_REGION | AWS region | `us-east-1` |

## Next Steps

1. ✅ Backend and frontend are configured
2. ✅ Environment variables are set
3. ✅ CORS is configured
4. 🔄 Start both servers
5. 🔄 Test the integration
6. 🔄 Configure real AWS Cognito (optional)
7. 🔄 Deploy to production (when ready)

## Support

For issues or questions:
- Check backend logs in terminal
- Check browser console for frontend errors
- Review API documentation at `/docs`
- Check this integration guide

---

**Last Updated:** March 2026
**Version:** 1.0.0
