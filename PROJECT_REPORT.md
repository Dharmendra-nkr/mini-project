# Grand Meridian Resort — Project Report

**Project:** AI-Powered Luxury Resort Booking Platform  
**Date:** March 10, 2026  
**Repository:** https://github.com/Dharmendra-nkr/grand-meridian-resort  

---

## 1. Executive Summary

Grand Meridian Resort is a **full-stack AI-powered hotel booking platform** featuring an interactive 3D resort explorer, multi-agent AI concierge chatbot, voice interaction capabilities, and a manager analytics dashboard. The system combines a **FastAPI** backend with **Groq LLM (Llama 3.3 70B)** and a **Next.js 14** frontend with **React Three Fiber** 3D visualization, backed by a **PostgreSQL** database.

The platform enables guests to explore a luxury oceanfront resort in 3D, chat with an AI concierge to search rooms, get personalized recommendations, and complete bookings — all through natural language conversation. Managers have access to a secured analytics dashboard with AI-generated business insights.

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          FRONTEND (Next.js 14)                          │
│  ┌────────┐  ┌────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────┐  │
│  │Landing │  │ Rooms  │  │3D Explorer│  │ Manager  │  │ Chat Widget │  │
│  │  Page  │  │Listing │  │(Three.js) │  │Dashboard │  │  (STT/TTS)  │  │
│  └────────┘  └────────┘  └──────────┘  └──────────┘  └──────┬──────┘  │
│                                                              │         │
└──────────────────────────────────────────────────────────────┼─────────┘
                                                               │ HTTP/REST
┌──────────────────────────────────────────────────────────────┼─────────┐
│                       BACKEND (FastAPI)                       │         │
│  ┌──────────────────────────────────────────────────────────┐│         │
│  │                    API Layer (6 Routers)                  ││         │
│  │  /auth  /rooms  /bookings  /chat  /voice  /manager       ││         │
│  └──────────────────────────┬───────────────────────────────┘│         │
│                             │                                │         │
│  ┌──────────────────────────▼───────────────────────────────┐│         │
│  │              AI Agent Layer (Groq LLM)                    ││         │
│  │                                                           ││         │
│  │            ┌─────────────────────┐                        ││         │
│  │            │  ConciergeAgent     │ ◄── Orchestrator       ││         │
│  │            │  (routes requests)  │                        ││         │
│  │            └──┬──────┬──────┬───┘                        ││         │
│  │               │      │      │                             ││         │
│  │    ┌──────────▼┐ ┌───▼─────┐ ┌─▼────────────┐           ││         │
│  │    │ Booking   │ │Recommend│ │ Analytics    │            ││         │
│  │    │ Agent     │ │ Agent   │ │ Agent        │            ││         │
│  │    │(5 tools)  │ │(1 tool) │ │(1 tool)      │            ││         │
│  │    └───────────┘ └─────────┘ └──────────────┘            ││         │
│  └──────────────────────────────────────────────────────────┘│         │
│                             │                                │         │
│  ┌──────────────────────────▼───────────────────────────────┐│         │
│  │              Data Layer (SQLAlchemy Async)                 ││         │
│  └──────────────────────────┬───────────────────────────────┘│         │
└──────────────────────────────┼────────────────────────────────┘         │
                               │                                          │
┌──────────────────────────────▼──────────────────────────────────────────┐
│                     PostgreSQL Database                                  │
│        10 Tables · 120 Rooms · 500 Guests · 2000 Bookings               │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Technology Stack

### 3.1 Backend

| Technology | Version | Purpose |
|---|---|---|
| Python | 3.10+ | Runtime |
| FastAPI | 0.115.6 | Async web framework |
| Uvicorn | 0.34.0 | ASGI server |
| SQLAlchemy | 2.0.36 | Async ORM |
| PostgreSQL | 13+ | Relational database |
| asyncpg | 0.30.0 | Async PostgreSQL driver |
| Pydantic | 2.10.4 | Data validation & settings |
| Groq API (Llama 3.3 70B) | Latest | LLM for AI agents |
| ElevenLabs | 2.30.0+ | Text-to-speech |
| python-jose | 3.3.0 | JWT authentication |
| passlib | 1.7.4 | Password hashing (bcrypt) |
| httpx | 0.28.1 | Async HTTP client |

### 3.2 Frontend

| Technology | Version | Purpose |
|---|---|---|
| Next.js | 14.2.35 | React framework (App Router) |
| React | 18.x | UI library |
| TypeScript | 5.x | Type safety |
| React Three Fiber | 8.18.0 | Declarative Three.js for React |
| Three.js | 0.169.0 | 3D graphics engine |
| @react-three/drei | 9.122.0 | Three.js helpers & abstractions |
| Tailwind CSS | 3.4.1 | Utility-first CSS |
| Framer Motion | 12.35.1 | Animations |
| Lucide React | 0.577.0 | Icon library |
| date-fns | 4.1.0 | Date utilities |
| react-markdown | 10.1.0 | Markdown rendering in chat |

### 3.3 External Services

| Service | Purpose |
|---|---|
| Groq Cloud | LLM inference (Llama 3.3 70B Versatile) |
| ElevenLabs | Voice synthesis (TTS) |
| Web Speech API | Browser-native speech-to-text (STT) |

---

## 4. Database Schema

**Database:** `mini` on `localhost:5432`  
**Tables:** 10  
**Seed Data:** 4 wings, 10 room types, 120 rooms, 500 guests, 2000 bookings, 1050 add-ons, 495 reviews, 6 managers, 3000 analytics events

### 4.1 Entity-Relationship Summary

| Table | Records | Key Fields | Relationships |
|---|---|---|---|
| **Wing** | 4 | name, description, floor_count, position (x,y,z) | → Rooms |
| **RoomType** | 10 | name, tier, base_price range, max_occupancy, size_sqft | → Rooms |
| **Room** | 120 | room_number, room_name, floor, view_type, capacity, base_price, amenities (JSONB), mesh_id, position (x,y,z) | → Wing, RoomType, Bookings, Reviews |
| **Guest** | 500 | first_name, last_name, email, phone, nationality, loyalty_tier, total_stays, preferences (JSONB) | → Bookings, Reviews |
| **Booking** | 2000 | booking_ref (GM...), check_in, check_out, num_guests, status, total_price, payment_status, booked_via | → Guest, Room, Addons, Reviews |
| **BookingAddon** | 1050 | addon_type, addon_name, price, quantity, scheduled_date, status | → Booking |
| **Review** | 495 | overall_rating, cleanliness/service/location/value ratings, title, comment | → Booking, Guest, Room |
| **Manager** | 6 | name, email, password_hash, role, permissions (JSONB) | — |
| **ChatSession** | — | session_id (UUID), messages (JSONB), agent_type, outcome | → Guest, Booking |
| **AnalyticsEvent** | 3000 | event_type, source, metadata (JSONB) | — |

### 4.2 Resort Layout

| Wing | Theme | Rooms | Views |
|---|---|---|---|
| Coral Wing | Oceanfront luxury | 30 (5 floors × 6) | ocean, beach |
| Horizon Wing | Panoramic premium | 30 (5 floors × 6) | ocean_panoramic, pool |
| Palm Wing | Family & gardens | 30 (5 floors × 6) | garden, pool, courtyard |
| Reef Wing | Marina & sunset | 30 (5 floors × 6) | sunset, marina |

### 4.3 Room Types

| Room Type | Tier | Price Range | Max Occupancy |
|---|---|---|---|
| Classic Room | standard | $150–200 | 2 |
| Superior Room | standard | $220–270 | 2 |
| Deluxe Room | premium | $300–400 | 3 |
| Ocean Deluxe | premium | $400–550 | 3 |
| Garden Suite | premium | $500–700 | 4 |
| Sunset Suite | luxury | $700–950 | 4 |
| Presidential Suite | luxury | $1200–1500 | 6 |
| Beach Villa | luxury | $1500–2000 | 6 |
| Coral Penthouse | penthouse | $2000–2500 | 4 |
| Reef Penthouse | penthouse | $2500–3000 | 4 |

---

## 5. AI Agent System

### 5.1 Architecture

The system implements a **hierarchical multi-agent architecture** using the **Groq API with Llama 3.3 70B Versatile**. The ConciergeAgent acts as the central orchestrator, routing guest requests to specialized sub-agents through OpenAI-compatible function calling.

### 5.2 BaseAgent (Foundation)

- **LLM Client:** AsyncOpenAI SDK connected to Groq endpoint
- **Model:** `llama-3.3-70b-versatile` (temperature: 0.7, max_tokens: 1024)
- **Core Methods:**
  - `chat(messages)` — Single LLM call with system prompt and tool definitions
  - `chat_with_tool_execution(messages, tool_handlers)` — Agentic loop that executes up to **5 rounds** of tool calls, feeding results back to the LLM until it produces a final text response

### 5.3 ConciergeAgent (Orchestrator)

**Role:** Guest's first point of contact — understands intent and routes to specialists.

| Tool | Description |
|---|---|
| `route_to_booking` | Forwards request to BookingAgent with cleaned conversation history |
| `route_to_recommendation` | Forwards to RecommendationAgent for personalized suggestions |
| `provide_resort_info` | Returns hardcoded resort knowledge (5 restaurants, spa, activities, policies, location) |

**Output Format:** Structured JSON with `message`, `quick_replies[]` (2–5 clickable options), and optional `action` (navigate_3d, show_room, start_booking, show_availability).

**Key Behavior:** Cleans conversation history before sub-agent calls — strips tool messages, retains only user/assistant content messages to prevent context pollution.

### 5.4 BookingAgent (5 Tools)

| Tool | Parameters | Function |
|---|---|---|
| `search_available_rooms` | check_in, check_out, wing, view_type, min/max_price, capacity | Queries available rooms (excludes booked), returns up to 15 results |
| `get_room_details` | room_id | Full room info with reviews, avg rating; handles both IDs and room numbers |
| `create_booking` | room_id, dates, guest info, num_guests, special_requests | Creates guest record (or finds by email), verifies availability, calculates total, generates GM reference |
| `cancel_booking` | booking_ref | Sets status to cancelled, payment to refunded |
| `lookup_booking` | booking_ref | Returns full booking with guest, room, add-ons |

### 5.5 RecommendationAgent (1 Tool with Scoring Engine)

| Tool | Parameters |
|---|---|
| `get_recommendations` | check_in, check_out, budget_max, preferred_view, preferred_floor (high/middle/low), num_guests, occasion, priorities[] |

**Scoring Algorithm:** Each available room starts at score 50, then receives bonuses:
- Floor preference match: +20
- Occasion bonuses: honeymoon (jacuzzi +25, sunset view +20, butler +15), family (kids_corner +30, pool +20, capacity≥4 +15), business (study_desk +25, high floor +10)
- Priority bonuses: view +20, space +15, price (dynamic), beach_access +25, quietness +15
- Returns **top 5** rooms ranked by score

### 5.6 AnalyticsAgent (1 Tool — Manager Only)

| Tool | Returns |
|---|---|
| `get_resort_analytics` | Total revenue, rooms occupied today, occupancy rate %, avg guest rating, monthly revenue trend, revenue by wing, top 10 rooms by booking count |

---

## 6. API Endpoints

### 6.1 Authentication

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/auth/login` | Manager login (returns JWT) | — |
| GET | `/api/auth/me` | Current manager info | JWT |

### 6.2 Rooms

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/rooms/` | List rooms (filters: wing, floor, view, type, price, capacity) | — |
| GET | `/api/rooms/{room_id}` | Room details | — |
| GET | `/api/rooms/available` | Availability search by dates | — |
| GET | `/api/rooms/availability-map` | 3D map data (all 120 rooms with status) | — |

### 6.3 Bookings

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/bookings/` | Create booking | — |
| GET | `/api/bookings/{booking_ref}` | Lookup booking by reference | — |
| DELETE | `/api/bookings/{booking_ref}` | Cancel booking | — |

### 6.4 AI Chat

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/chat/` | Send message to AI Concierge | — |
| POST | `/api/chat/reset` | Clear chat session | — |
| GET | `/api/chat/greeting` | Initial welcome message | — |

### 6.5 Voice

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/voice/tts` | Text-to-speech (ElevenLabs) | — |

### 6.6 Manager

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/manager/dashboard` | KPI dashboard | JWT |
| GET | `/api/manager/bookings` | Booking management (filters, pagination) | JWT |
| GET | `/api/manager/guests` | Guest list | JWT |
| GET | `/api/manager/reviews` | Review list with ratings | JWT |
| POST | `/api/manager/ai-insights` | AI-generated business insights | JWT |

---

## 7. Frontend Pages

### 7.1 Guest-Facing

| Route | Page | Key Features |
|---|---|---|
| `/` | Landing Page | Hero section, wing showcase, amenity highlights, CTA buttons |
| `/rooms` | Room Gallery | Filterable room cards (wing, view, price, type), search, pagination |
| `/rooms/[id]` | Room Detail | Full room info, amenities list, reviews, booking form |
| `/explore` | 3D Resort Explorer | Interactive Three.js resort model with clickable rooms, real-time availability overlay, room info panels |
| `/booking` | Booking Lookup | Search by GM reference number, view/cancel bookings |

### 7.2 Manager-Facing

| Route | Page | Key Features |
|---|---|---|
| `/manager/login` | Staff Login | Email/password authentication (JWT) |
| `/manager/dashboard` | Analytics Dashboard | Revenue charts, occupancy metrics, booking management, guest list, reviews, AI insights |

### 7.3 Global Components

| Component | Features |
|---|---|
| **Navbar** | Navigation links, responsive design |
| **ChatWidget** | Floating AI chat, quick replies, voice input (STT via Web Speech API), voice output (TTS via ElevenLabs), markdown rendering, session management |
| **ResortViewer** | Procedural 3D resort: 4 wing buildings with balconies/rooftop pools/penthouse, central lobby with glass dome/fountain, infinity pool with animated water, ocean with beach/umbrellas, 27 palm trees, pathways, landscaping, interactive room windows with availability colors |

---

## 8. 3D Resort Visualization

The resort is rendered procedurally in code using **React Three Fiber** and **Three.js** — no external 3D models required.

### 8.1 Components

| Element | Details |
|---|---|
| **Wing Buildings (×4)** | 5-floor structures with foundation, accent strips, vertical columns, side windows, room windows (interactive, color-coded by availability), balconies with glass railings and planters, rooftop penthouse with glass facade, rooftop private pool, pergola lounge, parapet walls, AC units |
| **Grand Entrances** | Porte-cochère with 4 columns, gold frame, revolving door, entrance landscaping |
| **Central Lobby** | Octagonal structure, glass dome with ribs, gold accents, 4 grand entrances, central fountain |
| **Infinity Pool** | Animated water (sine wave), pool deck, 5 lounge chairs, 3 umbrellas, steps |
| **Ocean & Beach** | Animated ocean water, sandy beach, shallow water gradient, beach umbrellas, lounge chairs |
| **Palm Trees (×27)** | Variable heights, bark rings, coconuts, 8 fronds with leaf spines and drooping tips |
| **Pathways** | Connecting lobby to wings and pool |

### 8.2 Interactivity

- Click any room window → Room info panel with name, price, availability
- Color coding: **green** = available, **red** = occupied, **amber** = pending
- Legend overlay explaining color codes
- Camera controls (orbit, zoom, pan)

---

## 9. Project File Structure

```
MINI_PRj/
├── backend/                        # FastAPI backend
│   ├── .env                        # API keys & database config
│   ├── config.py                   # Pydantic settings
│   ├── main.py                     # FastAPI app entry point
│   ├── requirements.txt            # Python dependencies (13 packages)
│   ├── agents/                     # AI Agent layer
│   │   ├── base.py                 # BaseAgent (Groq LLM client)
│   │   ├── concierge.py            # ConciergeAgent (orchestrator)
│   │   ├── booking.py              # BookingAgent (5 tools)
│   │   ├── recommendation.py       # RecommendationAgent (scoring)
│   │   └── analytics.py            # AnalyticsAgent (manager KPIs)
│   ├── db/                         # Database layer
│   │   ├── models.py               # SQLAlchemy models (10 tables)
│   │   ├── queries.py              # Reusable async queries
│   │   ├── session.py              # Async session factory
│   │   ├── schema.sql              # DDL schema
│   │   ├── seed_bookings.py        # Booking seed data
│   │   ├── seed_extras.py          # Add-ons, reviews, events seed
│   │   └── seed_guests.py          # Guest seed data
│   └── routers/                    # API endpoints
│       ├── auth.py                 # JWT authentication
│       ├── rooms.py                # Room listing & availability
│       ├── bookings.py             # Booking CRUD
│       ├── chat.py                 # AI chat endpoint
│       ├── voice.py                # Text-to-speech
│       └── manager.py              # Manager dashboard APIs
│
├── frontend/                       # Next.js 14 frontend
│   ├── .env.local                  # API URL config
│   ├── package.json                # Node dependencies (12 packages)
│   ├── tailwind.config.ts          # Tailwind CSS config
│   ├── tsconfig.json               # TypeScript config
│   ├── public/models/              # GLB model directory
│   └── src/
│       ├── app/                    # Next.js App Router pages
│       │   ├── page.tsx            # Landing page
│       │   ├── layout.tsx          # Root layout
│       │   ├── not-found.tsx       # Custom 404
│       │   ├── globals.css         # Global styles
│       │   ├── rooms/page.tsx      # Room gallery
│       │   ├── rooms/[id]/page.tsx # Room detail
│       │   ├── booking/page.tsx    # Booking lookup
│       │   ├── explore/page.tsx    # 3D explorer
│       │   ├── manager/login/      # Manager login
│       │   └── manager/dashboard/  # Manager dashboard
│       ├── components/
│       │   ├── ChatWidget.tsx      # AI chat with STT/TTS
│       │   ├── Navbar.tsx          # Navigation bar
│       │   └── ResortViewer.tsx    # 3D resort (~900 lines)
│       └── lib/
│           └── api.ts              # Type-safe API client
│
└── .gitignore
```

**Total Files:** ~52 (excluding node_modules, .git, __pycache__)  
**Backend:** 19 Python files  
**Frontend:** 16 TypeScript/React files  

---

## 10. Key Features Summary

| Feature | Status | Technology |
|---|---|---|
| AI Concierge Chatbot | ✅ Complete | Groq LLM (Llama 3.3 70B), Multi-agent routing |
| Natural Language Room Search | ✅ Complete | BookingAgent tool calling |
| Personalized Recommendations | ✅ Complete | RecommendationAgent scoring engine |
| Full Booking Lifecycle | ✅ Complete | Create/lookup/cancel via chat or API |
| 3D Resort Explorer | ✅ Complete | React Three Fiber, procedural geometry |
| Interactive Room Availability Map | ✅ Complete | Color-coded 3D room windows |
| Voice Input (Speech-to-Text) | ✅ Complete | Web Speech API (browser native) |
| Voice Output (Text-to-Speech) | ✅ Complete | ElevenLabs API |
| Manager Authentication | ✅ Complete | JWT with bcrypt password hashing |
| Manager Analytics Dashboard | ✅ Complete | Revenue, occupancy, ratings, trends |
| AI-Generated Business Insights | ✅ Complete | AnalyticsAgent + Groq LLM |
| Quick Reply Suggestions | ✅ Complete | Context-aware clickable options |
| Responsive UI | ✅ Complete | Tailwind CSS |
| Real-time Availability | ✅ Complete | DB-driven availability queries |
| GLB Model Import Support | ✅ Complete | useGLTF loader ready |

---

## 11. How to Run

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL 13+ (database: `mini`, user: `postgres`)

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

### Access
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs

---

## 12. Conversation Flow Example

```
Guest: "I'm looking for a room for my honeymoon"
  └─► ConciergeAgent receives message
      └─► Asks for dates, budget, preferences via quick replies

Guest: "Dec 20-25, ocean view, around $800/night"
  └─► ConciergeAgent routes to RecommendationAgent
      └─► Scoring engine: honeymoon occasion → jacuzzi +25, sunset view +20
      └─► Returns top 5 ranked rooms with explanations

Guest: "I like the Sunset Suite, let's book it"
  └─► ConciergeAgent routes to BookingAgent
      └─► Collects guest details (name, email)
      └─► create_booking tool → verifies availability → calculates price
      └─► Returns booking ref: GM-XXXXXXXX

Guest: "What restaurants do you have?"
  └─► ConciergeAgent uses provide_resort_info(topic="dining")
      └─► Returns 5 restaurants with descriptions
```

---

*Report generated March 10, 2026*
