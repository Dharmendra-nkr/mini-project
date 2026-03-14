# Mini Project

AI-powered luxury resort booking platform with a FastAPI backend and Next.js frontend.

## Tech Stack
- Backend: FastAPI, SQLAlchemy, PostgreSQL, Groq LLM, JWT auth
- Frontend: Next.js 14, React, TypeScript, Tailwind CSS, React Three Fiber

## Project Structure
- `backend/` FastAPI APIs, database models, and AI agents
- `frontend/` Next.js application and UI components
- `PROJECT_REPORT.md` Detailed architecture and implementation report

## Quick Start
### Backend
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Access
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs
