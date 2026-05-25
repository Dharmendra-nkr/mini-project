"""Configuration — loads env variables."""
from pathlib import Path
from pydantic_settings import BaseSettings

_ENV_FILE = Path(__file__).resolve().parent / ".env"


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql+asyncpg://postgres:12345@localhost:5432/mini"
    database_url_sync: str = "postgresql://postgres:12345@localhost:5432/mini"

    # Groq
    groq_api_key: str = ""

    # ElevenLabs
    elevenlabs_api_key: str = ""
    elevenlabs_voice_id: str = "21m00Tcm4TlvDq8ikWAM"

    # Pinecone (optional — for persistent cloud vector store)
    # If not set, falls back to local numpy-based vector store
    pinecone_api_key: str = ""
    pinecone_index_name: str = "grand-meridian"

    # JWT
    jwt_secret: str = "grand-meridian-secret-key-change-in-production-2026"
    jwt_algorithm: str = "HS256"
    jwt_expiry_hours: int = 8

    # CORS
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:5173"]

    model_config = {"env_file": str(_ENV_FILE), "extra": "ignore"}


settings = Settings()
