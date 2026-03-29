"""Chat router — AI Concierge conversation endpoint."""
import uuid
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from backend.db.session import get_db
from backend.agents.concierge import concierge

router = APIRouter(prefix="/api/chat", tags=["chat"])

# In-memory session store (replace with Redis for production)
_sessions: dict[str, list[dict]] = {}


class ChatRequest(BaseModel):
    session_id: str | None = None
    message: str


class ChatResponse(BaseModel):
    session_id: str
    message: str
    quick_replies: list[str] = []
    action: str | None = None


@router.post("/", response_model=ChatResponse)
async def chat(req: ChatRequest, db: AsyncSession = Depends(get_db)):
    """Send a message to the AI Concierge and get a response."""
    session_id = req.session_id or str(uuid.uuid4())

    # Get or create conversation history
    if session_id not in _sessions:
        _sessions[session_id] = []

    history = _sessions[session_id]
    history.append({"role": "user", "content": req.message})

    # Process through concierge
    result = await concierge.process(history, db)

    # Store assistant response in history
    history.append({"role": "assistant", "content": result["message"]})

    # Keep only last 30 messages to avoid token overflow
    if len(history) > 30:
        _sessions[session_id] = history[-30:]

    return ChatResponse(
        session_id=session_id,
        message=result["message"],
        quick_replies=result.get("quick_replies", []),
        action=result.get("action"),
    )


@router.post("/reset")
async def reset_chat(session_id: str | None = None):
    """Reset a chat session."""
    if session_id and session_id in _sessions:
        del _sessions[session_id]
        return {"status": "session cleared"}
    return {"status": "ok", "note": "no session found"}


@router.get("/greeting")
async def greeting():
    """Return initial greeting with quick replies."""
    return {
        "message": (
            "Welcome to **Grand Meridian Resort**! 🌊\n\n"
            "I'm your AI Concierge — I can help you explore our resort, "
            "find the perfect room, and make a booking.\n\n"
            "How can I assist you today?"
        ),
        "quick_replies": [
            "Search available rooms",
            "Recommend a room for me",
            "Tell me about the resort",
            "I have a booking reference",
            "Show me the 3D resort view",
        ],
        "action": None,
    }
