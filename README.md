# AI concierge for company websites

![Room Booking](screenshots/room_book.png)
![Manager Dashboard](screenshots/dashboard.png)

Production-style full-stack AI concierge platform built around a luxury resort use case. The system combines conversational booking, personalized recommendations, voice interaction, 3D exploration, and manager analytics in a single web app.

## Project Intro

This project demonstrates how to build an AI concierge that can be adapted for company websites where users need guided discovery and transaction flows.

What I built:
- A FastAPI backend with multi-agent orchestration using Groq LLM (Llama 3.3 70B).
- A Next.js 14 frontend with an interactive UX, voice-enabled chat widget, and 3D resort exploration.
- A PostgreSQL data layer with realistic seeded operational data for bookings, guests, reviews, and analytics.
- A secure manager portal with JWT authentication and AI-generated business insights.

## Hybrid AI Approach (RAG + KG)

This project follows a hybrid, tool-grounded approach that combines retrieval and structured domain relationships:

- RAG layer: agents retrieve live, grounded facts from the operational database through tool calls (room availability, booking records, room details, analytics summaries) before generating responses.
- Knowledge layer: domain knowledge is represented through explicit entity relationships (wing -> room type -> room -> booking -> guest -> review, plus chat and analytics events), enabling context-rich reasoning.
- Hybrid orchestration: the ConciergeAgent routes each request to specialized agents (Booking, Recommendation, Analytics), which retrieve facts and return responses aligned to user intent.

## Core Capabilities

- AI concierge chat with quick-reply suggestions and action hints.
- Booking lifecycle: search availability, inspect room details, create booking, lookup booking, cancel booking.
- Personalized recommendation engine with preference scoring.
- Voice support: browser STT (Web Speech API) and backend TTS (ElevenLabs).
- 3D resort explorer with room-level availability visualization.
- Manager dashboard for occupancy, revenue, guest activity, and AI insights.

## Architecture

Backend:
- FastAPI app with routers: /api/auth, /api/rooms, /api/bookings, /api/chat, /api/voice, /api/manager.
- Async SQLAlchemy + PostgreSQL.
- Multi-agent layer:
	- ConciergeAgent (intent routing)
	- BookingAgent (search/create/lookup/cancel)
	- RecommendationAgent (ranked suggestions)
	- AnalyticsAgent (manager insights)

Frontend:
- Next.js 14 (App Router), React, TypeScript, Tailwind.
- ChatWidget with markdown rendering, quick replies, STT/TTS integration.
- ResortViewer built with React Three Fiber + Three.js.

## Tech Stack

- Backend: Python, FastAPI, SQLAlchemy, asyncpg, Pydantic, Groq (OpenAI-compatible SDK), python-jose, passlib, ElevenLabs.
- Frontend: Next.js 14, React 18, TypeScript, Tailwind CSS, Framer Motion, React Three Fiber, Three.js, react-markdown.
- Database: PostgreSQL (10-table relational schema + seed scripts).

## Setup

### 1. Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL 13+

### 2. Backend Setup

```bash
cd backend
pip install -r requirements.txt
```

Create backend/.env:

```env
DATABASE_URL=postgresql+asyncpg://postgres:12345@localhost:5432/mini
DATABASE_URL_SYNC=postgresql://postgres:12345@localhost:5432/mini
GROQ_API_KEY=your_groq_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
JWT_SECRET=your_secret
```

Initialize DB schema:

```bash
psql -U postgres -d mini -f backend/db/schema.sql
```

Optional seed scripts:

```bash
python backend/db/seed_guests.py
python backend/db/seed_bookings.py
python backend/db/seed_extras.py
```

Run backend:

```bash
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create frontend/.env.local:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Run frontend:

```bash
cd frontend
npm run dev
```

## Access URLs

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Swagger Docs: http://localhost:8000/docs

## Project Structure

```text
MINI_PRj/
|- backend/
|  |- agents/         # Multi-agent AI layer
|  |- db/             # SQLAlchemy models, schema, seed scripts
|  |- routers/        # API endpoints
|  |- config.py
|  |- main.py
|  \- requirements.txt
|- frontend/
|  |- src/app/        # Next.js routes (guest + manager)
|  |- src/components/ # Navbar, ChatWidget, ResortViewer
|  |- src/lib/api.ts  # Typed API client
|  \- package.json
|- screenshots/
|- PROJECT_REPORT.md
\- README.md
```

## Reference

For full technical details, see PROJECT_REPORT.md.
