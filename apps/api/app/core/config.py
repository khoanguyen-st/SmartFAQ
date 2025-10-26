"""Application configuration."""

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
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
    chroma_persist_dir: str = Field("/data/chroma", alias="CHROMA_PERSIST_DIR")


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


settings = get_settings()