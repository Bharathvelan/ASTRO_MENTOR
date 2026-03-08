# Quick Start - Frontend & Backend Integration

## ✅ What's Already Done

1. **Backend Built** - All 74 Python packages installed
2. **Frontend Built** - All npm packages installed and production build complete
3. **Environment Configured** - Both `.env` files created with correct settings
4. **CORS Configured** - Backend allows requests from frontend
5. **Integration Ready** - API URL configured in frontend

## 🚀 Start the Application (3 Options)

### Option 1: Double-Click Start Script (Easiest)
```
Double-click: start-dev.bat
```
This will:
- Start backend on port 8001
- Start frontend on port 3000
- Open browser automatically

### Option 2: Manual Start (Two Terminals)

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

### Option 3: Background Processes
```cmd
cd astramentor-backend
start /B python -m poetry run uvicorn src.api.main:app --host 127.0.0.1 --port 8001

cd ..\astramentor-frontend
npm run dev
```

## 🌐 Access Points

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | Main application |
| **Backend API** | http://127.0.0.1:8001 | REST API |
| **API Docs** | http://127.0.0.1:8001/docs | Interactive Swagger UI |
| **Health Check** | http://127.0.0.1:8001/health | Server status |

## ✅ Verify Integration

### 1. Check Backend
```cmd
curl http://127.0.0.1:8001/health
```
Should return: `{"status":"healthy","version":"0.1.0"}`

### 2. Check Frontend
- Open http://localhost:3000
- Open browser DevTools (F12)
- Check Console for errors
- Check Network tab for API calls to `127.0.0.1:8001`

### 3. Test API
- Visit http://127.0.0.1:8001/docs
- Try the `/health` endpoint
- Explore available API routes

## 📁 Key Configuration Files

### Backend
- **Environment:** `astramentor-backend/.env`
- **Config:** `astramentor-backend/src/core/config.py`
- **Main App:** `astramentor-backend/src/api/main.py`

### Frontend
- **Environment:** `astramentor-frontend/.env.local`
- **API Config:** Uses `NEXT_PUBLIC_API_URL=http://127.0.0.1:8001`

## 🔧 Current Configuration

### Backend Settings
```
Port: 8001
Database: SQLite (local file)
CORS: Allows http://localhost:3000
AWS Region: us-east-1
Environment: development
```

### Frontend Settings
```
Port: 3000
API URL: http://127.0.0.1:8001
Dev Mode: Enabled
Cognito: Placeholder values (for development)
```

## 🎯 What Works Now

✅ Backend server starts successfully
✅ Frontend can make API calls to backend
✅ CORS is properly configured
✅ Health check endpoint works
✅ API documentation accessible
✅ Hot reload enabled for both servers

## 📝 Next Steps

1. **Start the servers** using one of the methods above
2. **Test the integration** by accessing the frontend
3. **Explore the API** at http://127.0.0.1:8001/docs
4. **Configure real AWS Cognito** (optional, for authentication)
5. **Start developing** your features!

## 🐛 Troubleshooting

### Backend won't start
- Check if port 8001 is available
- Verify Poetry environment: `python -m poetry env info`
- Check `.env` file exists in `astramentor-backend/`

### Frontend won't start
- Check if port 3000 is available
- Verify node_modules: `npm install` in `astramentor-frontend/`
- Check `.env.local` file exists

### CORS errors
- Verify backend CORS_ORIGINS includes `http://localhost:3000`
- Restart backend server after config changes

### Can't connect to backend
- Verify backend is running: `curl http://127.0.0.1:8001/health`
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Check firewall settings

## 📚 Documentation

- **Full Integration Guide:** `INTEGRATION_GUIDE.md`
- **Backend API Docs:** http://127.0.0.1:8001/docs (when running)
- **Deployment Guide:** `DEPLOYMENT_QUICKSTART.md`

---

**Ready to start?** Run `start-dev.bat` or follow Option 2 above!
