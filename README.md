# 🚀 AstraMentor — AI-Powered Learning Platform

An intelligent, national-level adaptive learning platform that helps students master programming through AI-driven mentorship, code execution sandboxes, and personalized challenges.

---

## 🗂️ Project Structure

```
ASTRO_MENTOR/
├── astramentor-frontend/   # Next.js 14 Frontend
└── astramentor-backend/    # FastAPI Python Backend
```

---

## ✨ Features

| Feature | Status |
|---|---|
| AI Code Playground (Python, JS, TS, Java, C++, Go, Rust…) | ✅ |
| AI Workspace Chat | ✅ |
| Smart Code Challenges | ✅ |
| AI Code Reviewer | ✅ |
| Repository Intelligence | ✅ |
| Learning Hub | ✅ |
| Progress Tracking & XP System | ✅ |
| Sessions & Snippets | ✅ |
| Real-time Collab (WebSocket) | ✅ |
| Leaderboard | ✅ |

---

## ⚙️ Tech Stack

**Frontend**
- Next.js 14 (App Router)
- TypeScript, Tailwind CSS, shadcn/ui
- Monaco Editor (VS Code editor in the browser)
- Zustand (state management)
- Axios

**Backend**
- Python 3.11 + FastAPI
- Structlog, Pydantic v2
- asyncio sandbox executor (Python, JS, TS, Java, C++, C, Go, Rust, Ruby, PHP)
- Redis rate limiting
- AWS Bedrock (Claude) for AI features
- AWS Cognito authentication

---

## 🏁 Quick Start

### Frontend
```bash
cd astramentor-frontend
npm install
npm run dev
```
Open http://localhost:3000

### Backend
```bash
cd astramentor-backend
python -m venv venv
venv\Scripts\activate   # Windows
pip install -r requirements.txt
uvicorn src.api.main:app --reload
```
API runs at http://localhost:8000

---

## 🔄 CI/CD

| Workflow | Trigger | What it does |
|---|---|---|
| `frontend-ci` | Push / PR to `main` | npm install → lint → Next.js build |
| `backend-ci` | Push / PR to `main` | pip install → pytest → import check |
| `deploy` | Tag `v*.*.*` | Build & push Docker images to GHCR |

---

## 📜 License

MIT — see `LICENSE`
