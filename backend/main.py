"""Grand Meridian Resort — FastAPI Backend Entry Point."""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config import settings
from backend.db.session import engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown."""
    yield
    await engine.dispose()


app = FastAPI(
    title="Grand Meridian Resort API",
    description="AI Concierge + 3D Booking Platform backend",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
from backend.routers.auth import router as auth_router
from backend.routers.rooms import router as rooms_router
from backend.routers.bookings import router as bookings_router
from backend.routers.chat import router as chat_router
from backend.routers.voice import router as voice_router
from backend.routers.manager import router as manager_router

app.include_router(auth_router)
app.include_router(rooms_router)
app.include_router(bookings_router)
app.include_router(chat_router)
app.include_router(voice_router)
app.include_router(manager_router)


@app.get("/")
async def root():
    return {
        "name": "Grand Meridian Resort API",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": {
            "rooms": "/api/rooms",
            "bookings": "/api/bookings",
            "chat": "/api/chat",
            "voice": "/api/voice/tts",
            "auth": "/api/auth/login",
            "manager": "/api/manager/dashboard",
        },
    }


@app.get("/health")
async def health():
    return {"status": "ok"}
