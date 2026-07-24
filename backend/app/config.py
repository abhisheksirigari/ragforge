"""
Central configuration. Everything is loaded from environment variables / .env
so the same code runs locally, in Docker, or in CI with different secrets.
"""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # LLM provider
    llm_provider: str = "anthropic"
    anthropic_api_key: str = ""
    openai_api_key: str = ""
    gemini_api_key: str = ""
    anthropic_model: str = "claude-sonnet-4-5"
    openai_model: str = "gpt-4o-mini"
    gemini_model: str = "gemini-2.5-flash"

    # Embeddings: "gemini" (API-based, lightweight, needs GEMINI_API_KEY) or
    # "local" (sentence-transformers, no API key needed, but heavy on RAM —
    # can exceed 512MB free-tier hosting limits, so it's the dev-only default
    # for a low-memory deployment).
    embedding_provider: str = "gemini"
    embedding_model: str = "all-MiniLM-L6-v2"
    gemini_embedding_model: str = "models/text-embedding-004"

    # Auth
    jwt_secret: str = "dev-secret-change-me"
    jwt_expire_minutes: int = 1440
    jwt_algorithm: str = "HS256"

    # Storage
    chroma_persist_dir: str = "./data/chroma"
    upload_dir: str = "./data/uploads"
    sqlite_path: str = "./data/ragforge.db"

    # Retrieval / chunking
    chunk_size: int = 800
    chunk_overlap: int = 120
    top_k: int = 5


@lru_cache
def get_settings() -> Settings:
    return Settings()
