# 🚀 AstraMentor - Start Application Guide

## ✅ Current Status

**Frontend**: ✅ RUNNING on http://localhost:3000
**Backend**: ⚠️ Needs to be started manually

## 🌐 Access Your Application

### Single Link Access
**Open this link in your browser:**
```
http://localhost:3000
```

This is your main application URL. The frontend will automatically connect to the backend once it's running.

## 🔧 Start Backend Server

Open a **new terminal** and run:

```cmd
cd astramentor-backend
python -m poetry run uvicorn src.api.main:app --host 127.0.0.1 --port 8001 --reload
```

## 📍 All Access Points

| Service | URL | Status |
|---------|-----|--------|
| **Main Application** | http://localhost:3000 | ✅ Running |
| **Backend API** | http://127.0.0.1:8001 | ⚠️ Start manually |
| **API Documentation** | http://127.0.0.1:8001/docs | ⚠️ Start backend first |
| **Health Check** | http://127.0.0.1:8001/health | ⚠️ Start backend first |

## 🎯 Quick Start Steps

1. **Backend is NOT running yet** - Open a new terminal and run the command above
2. **Frontend IS running** - Already accessible at http://localhost:3000
3. **Access the app** - Open http://localhost:3000 in your browser

## 📱 Application Features

Once both servers are running, you can access:

- **Landing Page**: http://localhost:3000
- **Login**: http://localhost:3000/login
- **Register**: http://localhost:3000/register
- **Dashboard**: http://localhost:3000/dashboard
- **Knowledge Graph**: http://localhost:3000/graph
- **Code Playground**: http://localhost:3000/playground
- **Settings**: http://localhost:3000/settings

## ⚡ Alternative: Use Start Script

Instead of manual commands, you can use:

```cmd
start-dev.bat
```

This will start both servers automatically in separate windows.

## 🔍 Verify Integration

### Check Backend
```cmd
curl http://127.0.0.1:8001/health
```

Expected: `{"status":"healthy","version":"0.1.0"}`

### Check Frontend
- Open http://localhost:3000
- Press F12 to open DevTools
- Check Console for errors
- Check Network tab for API calls

## 📝 Notes

- **Authentication**: Currently using placeholder Cognito values
- **Registration errors are expected** until real AWS Cognito is configured
- **Dashboard access**: You can access http://localhost:3000/dashboard directly to bypass auth
- **Hot reload**: Both servers support hot reload for development

## 🎉 Your Application is Ready!

**Main Link**: http://localhost:3000

Just start the backend server and you're good to go!

---

**Last Updated**: March 6, 2026
**Version**: 1.0.0
