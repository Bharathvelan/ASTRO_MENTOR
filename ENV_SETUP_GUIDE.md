# Environment Setup Guide

## ✅ Backend Environment Configured

I've created a `.env` file in `astramentor-backend/` with placeholder values so you can start the backend immediately.

## 🚀 Quick Start (Local Development)

The backend will now start with these settings:

### Current Configuration
- **Database**: SQLite (local file, no PostgreSQL needed)
- **AWS/Cognito**: Placeholder values (features requiring AWS will be disabled)
- **Redis**: Optional (will work without it)
- **DynamoDB**: Local tables (will work without AWS)

### Start the Backend Now
```powershell
cd C:\Users\sanke\Desktop\astramentor-frontend\astramentor-backend
python -m poetry run uvicorn src.api.main:app --reload
```

The backend should start successfully and be available at:
- **API**: http://localhost:8000
- **Docs**: http://localhost:8000/docs
- **Health**: http://localhost:8000/health

---

## 🔧 For Full Functionality (Optional)

To enable all features, you'll need to configure AWS services:

### 1. AWS Cognito (Authentication)

1. Go to AWS Console → Cognito
2. Create a User Pool
3. Create an App Client
4. Update `.env`:
   ```env
   COGNITO_USER_POOL_ID=us-east-1_YourPoolId
   COGNITO_CLIENT_ID=YourClientId
   ```

### 2. AWS Credentials (AI Features)

1. Go to AWS Console → IAM
2. Create an access key
3. Update `.env`:
   ```env
   AWS_ACCESS_KEY_ID=your_actual_access_key
   AWS_SECRET_ACCESS_KEY=your_actual_secret_key
   ```

### 3. PostgreSQL (Production Database)

**Option A: Local PostgreSQL**
```powershell
# Install PostgreSQL, then update .env:
DATABASE_URL=postgresql://postgres:password@localhost:5432/astramentor
```

**Option B: Keep SQLite (Easier)**
```env
# Already configured - no changes needed
DATABASE_URL=sqlite:///./astramentor.db
```

### 4. Redis (Caching - Optional)

**Option A: Install Redis**
```powershell
# Install Redis for Windows, then:
REDIS_URL=redis://localhost:6379/0
```

**Option B: Skip Redis**
```env
# Comment out or remove:
# REDIS_URL=redis://localhost:6379/0
```

---

## 📝 Frontend Environment

Create `astramentor-frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_PLACEHOLDER
NEXT_PUBLIC_COGNITO_CLIENT_ID=placeholder_client_id
NEXT_PUBLIC_COGNITO_REGION=us-east-1
```

---

## 🎯 Recommended Setup for Development

### Minimal Setup (Works Now)
✅ SQLite database (already configured)
✅ No Redis needed
✅ No AWS services needed
✅ Backend starts immediately

### Features Available:
- ✅ API endpoints
- ✅ Health checks
- ✅ Basic functionality
- ❌ AWS Bedrock AI (needs AWS credentials)
- ❌ User authentication (needs Cognito)
- ❌ Caching (needs Redis)

### Full Setup (All Features)
1. Set up AWS Cognito
2. Get AWS credentials
3. Install PostgreSQL (optional)
4. Install Redis (optional)

---

## 🚀 Start Both Applications

### Terminal 1 - Backend
```powershell
cd C:\Users\sanke\Desktop\astramentor-frontend\astramentor-backend
python -m poetry run uvicorn src.api.main:app --reload
```

### Terminal 2 - Frontend
```powershell
cd C:\Users\sanke\Desktop\astramentor-frontend\astramentor-frontend
npm run dev
```

---

## ✅ Verification

### Backend Running?
Visit: http://localhost:8000/docs

You should see the FastAPI Swagger documentation.

### Frontend Running?
Visit: http://localhost:3000

You should see the AstraMentor landing page.

---

## 🐛 Troubleshooting

### Backend won't start?
1. Check `.env` file exists in `astramentor-backend/`
2. Verify all required fields have values (even placeholders)
3. Check the error message for missing variables

### Frontend can't connect to backend?
1. Ensure backend is running on port 8000
2. Check `NEXT_PUBLIC_API_URL` in frontend `.env.local`
3. Verify CORS is enabled in backend

### Database errors?
1. SQLite should work out of the box
2. If using PostgreSQL, ensure it's running
3. Run migrations: `python -m poetry run alembic upgrade head`

---

## 📚 Next Steps

1. ✅ Start backend (should work now!)
2. ✅ Start frontend
3. 🔧 Configure AWS services (when ready)
4. 🚀 Deploy to production (when ready)

---

**Current Status**: Backend configured for local development and ready to start!
