"""Voice router — TTS via ElevenLabs for AI concierge voice responses."""
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import httpx

from backend.config import settings

router = APIRouter(prefix="/api/voice", tags=["voice"])

ELEVENLABS_TTS_URL = "https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream"


class TTSRequest(BaseModel):
    text: str
    voice_id: str | None = None


@router.post("/tts")
async def text_to_speech(req: TTSRequest):
    """Convert text to speech using ElevenLabs and stream audio back."""
    if not settings.elevenlabs_api_key:
        raise HTTPException(status_code=503, detail="ElevenLabs API key not configured")

    voice_id = req.voice_id or settings.elevenlabs_voice_id
    url = ELEVENLABS_TTS_URL.format(voice_id=voice_id)

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            url,
            headers={
                "xi-api-key": settings.elevenlabs_api_key,
                "Content-Type": "application/json",
            },
            json={
                "text": req.text,
                "model_id": "eleven_monolingual_v1",
                "voice_settings": {
                    "stability": 0.5,
                    "similarity_boost": 0.75,
                },
            },
        )

        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail="ElevenLabs API error",
            )

        return StreamingResponse(
            iter([response.content]),
            media_type="audio/mpeg",
            headers={"Content-Disposition": "inline; filename=speech.mp3"},
        )
