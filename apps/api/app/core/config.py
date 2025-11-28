"""Application configuration."""

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", case_sensitive=False, extra="ignore"
    )

    env: str = Field("development", alias="APP_ENV")
    api_host: str = Field("0.0.0.0", alias="API_HOST")
    api_port: int = Field(8000, alias="API_PORT")

    jwt_secret: str = Field("change-me", alias="JWT_SECRET")
    jwt_expire_minutes: int = Field(60, alias="JWT_EXPIRE_MINUTES")

    database_url: str = Field(
        "postgresql+psycopg://smartfaq:smartfaq@localhost:5432/smartfaq",
        alias="DATABASE_URL",
    )

    GOOGLE_API_KEY: str = Field("", alias="GOOGLE_API_KEY")
    LLM_MODEL: str = Field("gemini-2.5-flash", alias="LLM_MODEL")
    LLM_TEMPERATURE: float = Field(0.3, alias="LLM_TEMPERATURE")
    LLM_MAX_TOKENS: int = Field(2048, alias="LLM_MAX_TOKENS")

    EMBED_MODEL: str = Field("intfloat/multilingual-e5-small", alias="EMBED_MODEL")
    EMBED_DEVICE: str = Field("cpu", alias="EMBED_DEVICE")
    EMBED_NORMALIZE: bool = Field(True, alias="EMBED_NORMALIZE")
    EMBED_BATCH: int = Field(32, alias="EMBED_BATCH")

    CHROMA_URL: str = Field("http://localhost:8000", alias="CHROMA_URL")
    CHROMA_COLLECTION: str = Field("kb_main", alias="CHROMA_COLLECTION")
    CHROMA_METRIC: str = Field("cosine", alias="CHROMA_METRIC")
    CHROMA_HEADERS: str = Field("", alias="CHROMA_HEADERS")

    CONFIDENCE_THRESHOLD: float = Field(0.65, alias="CONFIDENCE_THRESHOLD")
    MAX_CONTEXT_CHARS: int = Field(8000, alias="MAX_CONTEXT_CHARS")
    TOP_K_RETRIEVAL: int = Field(5, alias="TOP_K_RETRIEVAL")

    UPLOAD_DIR: str = Field("./uploads", alias="UPLOAD_DIR")
    UPLOAD_MAX_MB: int = Field(50, alias="UPLOAD_MAX_MB")

    CELERY_BROKER_URL: str = Field("redis://localhost:6379/0", alias="CELERY_BROKER_URL")
    CELERY_RESULT_BACKEND: str = Field("redis://localhost:6379/0", alias="CELERY_RESULT_BACKEND")

    # MongoDB Configuration
    mongo_url: str = Field("mongodb://localhost:27017", alias="MONGO_URL")
    mongo_db: str = Field("smartfaq", alias="MONGO_DB")
    mongo_chat_collection: str = Field("chat_messages", alias="MONGO_CHAT_COLLECTION")
    mongo_session_collection: str = Field("chat_sessions", alias="MONGO_SESSION_COLLECTION")


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
