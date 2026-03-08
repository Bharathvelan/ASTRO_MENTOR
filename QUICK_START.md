# 🚀 Quick Start Guide

## Current Directory Structure

Your workspace is organized as:
```
C:\Users\sanke\Desktop\astramentor-frontend\
├── astramentor-frontend/    (Frontend code)
├── astramentor-backend/     (Backend code)
├── BUILD_COMPLETE.md
├── BUILD_STATUS.md
└── Other deployment docs
```

## Navigation Commands

### From Backend to Frontend
```powershell
# You are here: C:\Users\sanke\Desktop\astramentor-frontend\astramentor-backend
cd ..\astramentor-frontend
```

### From Frontend to Backend
```powershell
# If you're in frontend
cd ..\astramentor-backend
```

### From Root
```powershell
# Go to root first
cd C:\Users\sanke\Desktop\astramentor-frontend

# Then navigate to either:
cd astramentor-frontend    # For frontend
cd astramentor-backend     # For backend
```

---

## 🎯 Running the Applications

### Option 1: Run Frontend (Development)

```powershell
# Navigate to frontend
cd C:\Users\sanke\Desktop\astramentor-frontend\astramentor-frontend

# Start dev server
npm run dev
```

Visit: http://localhost:3000

### Option 2: Run Backend (Development)

```powershell
# Navigate to backend
cd C:\Users\sanke\Desktop\astramentor-frontend\astramentor-backend

# Start server
python -m poetry run uvicorn src.api.main:app --reload --host 0.0.0.0 --port 8000
```

Visit: http://localhost:8000/docs

---

## 📝 Quick Commands Reference

### Frontend Commands
```powershell
cd C:\Users\sanke\Desktop\astramentor-frontend\astramentor-frontend

npm run dev          # Development server
npm run build        # Production build
npm start            # Production server
npm run lint         # Run linter
npm run type-check   # TypeScript check
```

### Backend Commands
```powershell
cd C:\Users\sanke\Desktop\astramentor-frontend\astramentor-backend

# Run server
python -m poetry run uvicorn src.api.main:app --reload

# Run tests
python -m poetry run pytest

# Format code
python -m poetry run black src

# Type check
python -m poetry run mypy src
```

---

## 🔧 First Time Setup

### 1. Configure Frontend Environment

```powershell
cd C:\Users\sanke\Desktop\astramentor-frontend\astramentor-frontend

# Copy example env file
copy .env.example .env.local

# Edit .env.local with your settings
notepad .env.local
```

Required variables:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_COGNITO_USER_POOL_ID=your-pool-id
NEXT_PUBLIC_COGNITO_CLIENT_ID=your-client-id
NEXT_PUBLIC_COGNITO_REGION=us-east-1
```

### 2. Configure Backend Environment

```powershell
cd C:\Users\sanke\Desktop\astramentor-frontend\astramentor-backend

# Copy example env file
copy .env.example .env

# Edit .env with your settings
notepad .env
```

Required variables:
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/astramentor
REDIS_URL=redis://localhost:6379
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
```

### 3. Run Database Migrations (Backend)

```powershell
cd C:\Users\sanke\Desktop\astramentor-frontend\astramentor-backend

python -m poetry run alembic upgrade head
```

---

## 🎉 You're Ready!

Both applications are built and ready to run. Just:

1. Configure your environment variables
2. Start the backend server
3. Start the frontend server
4. Visit http://localhost:3000

---

## 💡 Tips

- Run backend and frontend in separate terminal windows
- Backend must be running for frontend to work properly
- Check BUILD_COMPLETE.md for detailed documentation
- Check BUILD_STATUS.md for build verification

---

**Need Help?**
- Frontend docs: `astramentor-frontend/README.md`
- Backend docs: `astramentor-backend/README.md`
- API docs: http://localhost:8000/docs (when backend is running)
