"""Application configuration."""

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", case_sensitive=False, extra="ignore"
    )

    # Core API
    env: str = Field("development", alias="APP_ENV")
    api_host: str = Field("0.0.0.0", alias="API_HOST")
    api_port: int = Field(8000, alias="API_PORT")
    cors_allow_origins: list[str] = Field(
        default=["http://localhost:5174", "http://localhost:5173"],
        alias="CORS_ALLOW_ORIGINS",
    )

    # Security
    jwt_secret: str = Field("change-me", alias="JWT_SECRET")
    jwt_expire_minutes: int = Field(60, alias="JWT_EXPIRE_MINUTES")

    # Database
    database_url: str = Field(
        "postgresql+psycopg://smartfaq:smartfaq@localhost:5432/smartfaq",
        alias="DATABASE_URL",
    )

    # Google Gemini LLM
    GOOGLE_API_KEY: str = Field("", alias="GOOGLE_API_KEY")
    LLM_MODEL: str = Field("gemini-2.0-flash-exp", alias="LLM_MODEL")
    LLM_TEMPERATURE: float = Field(0.3, alias="LLM_TEMPERATURE")
    LLM_MAX_TOKENS: int = Field(2048, alias="LLM_MAX_TOKENS")

    # Embeddings (HuggingFace Local)
    EMBED_MODEL: str = Field("intfloat/multilingual-e5-small", alias="EMBED_MODEL")
    EMBED_DEVICE: str = Field("cpu", alias="EMBED_DEVICE")  # cpu | cuda
    EMBED_NORMALIZE: bool = Field(True, alias="EMBED_NORMALIZE")
    EMBED_BATCH: int = Field(32, alias="EMBED_BATCH")

    # Vector Store (Chroma)
    CHROMA_URL: str = Field("http://localhost:8000", alias="CHROMA_URL")
    CHROMA_COLLECTION: str = Field("kb_main", alias="CHROMA_COLLECTION")
    CHROMA_METRIC: str = Field("cosine", alias="CHROMA_METRIC")  # cosine | l2 | ip
    CHROMA_HEADERS: str = Field("", alias="CHROMA_HEADERS")

    # RAG Configuration
    CONFIDENCE_THRESHOLD: float = Field(0.65, alias="CONFIDENCE_THRESHOLD")
    MAX_CONTEXT_CHARS: int = Field(8000, alias="MAX_CONTEXT_CHARS")
    TOP_K_RETRIEVAL: int = Field(5, alias="TOP_K_RETRIEVAL")

    # Document Upload
    UPLOAD_DIR: str = Field("./uploads", alias="UPLOAD_DIR")
    UPLOAD_MAX_MB: int = Field(50, alias="UPLOAD_MAX_MB")

    # Google Cloud Storage (optional)
    # GCS_ENABLED: bool = Field(True, alias="GCS_ENABLED")
    # GCS_BUCKET: str = Field("", alias="GCS_BUCKET")
    # GOOGLE_APPLICATION_CREDENTIALS: str = Field("Storage-document.json", alias="GOOGLE_APPLICATION_CREDENTIALS")

    # Celery
    CELERY_BROKER_URL: str = Field("redis://localhost:6379/0", alias="CELERY_BROKER_URL")
    CELERY_RESULT_BACKEND: str = Field("redis://localhost:6379/0", alias="CELERY_RESULT_BACKEND")


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
