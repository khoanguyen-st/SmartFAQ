"""Application configuration."""

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict
import os

ENV_FILE = os.getenv("SETTINGS_ENV_FILE", ".env")

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=ENV_FILE, env_file_encoding="utf-8", case_sensitive=False, extra="ignore"
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

    EMBED_MODEL: str = Field("intfloat/multilingual-e5-base", alias="EMBED_MODEL")
    EMBED_DEVICE: str = Field("cpu", alias="EMBED_DEVICE")
    EMBED_NORMALIZE: bool = Field(True, alias="EMBED_NORMALIZE")
    EMBED_BATCH: int = Field(32, alias="EMBED_BATCH")

    CHROMA_URL: str = Field("http://localhost:8000", alias="CHROMA_URL")
    CHROMA_COLLECTION: str = Field("kb_main", alias="CHROMA_COLLECTION")
    CHROMA_METRIC: str = Field("cosine", alias="CHROMA_METRIC")
    CHROMA_HEADERS: str = Field("", alias="CHROMA_HEADERS")

    CONFIDENCE_THRESHOLD: float = Field(0.65, alias="CONFIDENCE_THRESHOLD")
    CONFIDENCE_DECAY: float = Field(0.6, alias="CONFIDENCE_DECAY")
    CONFIDENCE_DIVERSITY_TARGET: int = Field(3, alias="CONFIDENCE_DIVERSITY_TARGET")

    HYBRID_ENABLED: bool = Field(True, alias="HYBRID_ENABLED")
    HYBRID_K_VEC: int = Field(20, alias="HYBRID_K_VEC")
    HYBRID_K_LEX: int = Field(20, alias="HYBRID_K_LEX")
    HYBRID_FUSION_K: int = Field(60, alias="HYBRID_FUSION_K")
    HYBRID_MAX_DOCS: int = Field(5000, alias="HYBRID_MAX_DOCS")

    MAX_CONTEXT_CHARS: int = Field(8000, alias="MAX_CONTEXT_CHARS")
    TOP_K_RETRIEVAL: int = Field(5, alias="TOP_K_RETRIEVAL")
    MAX_SUB_QUERIES: int = Field(3, alias="MAX_SUB_QUERIES")
    TOP_K_PER_QUERY: int = Field(5, alias="TOP_K_PER_QUERY")

    # Query Expansion Settings
    QUERY_EXPANSION_ENABLED: bool = Field(True, alias="QUERY_EXPANSION_ENABLED")
    QUERY_EXPANSION_MAX: int = Field(1, alias="QUERY_EXPANSION_MAX")
    QUERY_EXPANSION_MIN_WORDS: int = Field(3, alias="QUERY_EXPANSION_MIN_WORDS")

    UPLOAD_DIR: str = Field("./uploads", alias="UPLOAD_DIR")
    UPLOAD_MAX_MB: int = Field(50, alias="UPLOAD_MAX_MB")

    # Cloud Storage
    MINIO_ENDPOINT: str = Field("", alias="MINIO_ENDPOINT")
    MINIO_ACCESS_KEY: str = Field("", alias="MINIO_ROOT_USER")
    MINIO_SECRET_KEY: str = Field("", alias="MINIO_ROOT_PASSWORD")
    MINIO_SECURE: bool = Field(False, alias="MINIO_SECURE")
    MINIO_BUCKET_NAME: str = Field("", alias="MINIO_BUCKET")

    # Celery
    CELERY_BROKER_URL: str = Field("redis://localhost:6379/0", alias="CELERY_BROKER_URL")
    CELERY_RESULT_BACKEND: str = Field("redis://localhost:6379/0", alias="CELERY_RESULT_BACKEND")

    # Email Configuration
    MAIL_USERNAME: str = Field("", alias="MAIL_USERNAME")
    MAIL_PASSWORD: str = Field("", alias="MAIL_PASSWORD")
    MAIL_FROM: str = Field("noreply@smartfaq.com", alias="MAIL_FROM")
    MAIL_FROM_NAME: str = Field("SmartFAQ System", alias="MAIL_FROM_NAME")
    MAIL_PORT: int = Field(587, alias="MAIL_PORT")
    MAIL_SERVER: str = Field("smtp.gmail.com", alias="MAIL_SERVER")
    MAIL_STARTTLS: bool = Field(True, alias="MAIL_STARTTLS")
    MAIL_SSL_TLS: bool = Field(False, alias="MAIL_SSL_TLS")
    MAIL_USE_CREDENTIALS: bool = Field(True, alias="MAIL_USE_CREDENTIALS")
    FRONTEND_RESET_PASSWORD_URL: str = Field(
        "http://localhost:5174/create-new-password", alias="FRONTEND_RESET_PASSWORD_URL"
    )

    # MongoDB Configuration
    mongo_url: str = Field("mongodb://localhost:27017", alias="MONGO_URL")
    mongo_db: str = Field("smartfaq", alias="MONGO_DB")
    mongo_chat_collection: str = Field("chat_messages", alias="MONGO_CHAT_COLLECTION")
    mongo_session_collection: str = Field("chat_sessions", alias="MONGO_SESSION_COLLECTION")

@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


def reload_settings() -> Settings:
    """Clear cache and reload settings from environment/file."""
    get_settings.cache_clear()
    return get_settings()


settings = get_settings()
