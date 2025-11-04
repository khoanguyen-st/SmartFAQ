"""FastAPI application bootstrap."""

from fastapi import FastAPI
from pydantic import BaseModel, Field

from .api import admin, auth, chat, docs, fallback
from .core.config import settings


class HealthResponse(BaseModel):
    """Response model for health check endpoint."""
    status: str = Field(..., description="Service status")
    environment: str = Field(..., description="Current environment")


def create_app() -> FastAPI:
    app = FastAPI(
        title="Greenwich SmartFAQ API",
        version="0.1.0",
        docs_url="/docs/openapi",
        redoc_url="/docs/redoc",
    )

    app.include_router(auth.router, prefix="/auth", tags=["auth"])
    app.include_router(docs.router, prefix="/docs", tags=["documents"])
    app.include_router(chat.router, prefix="/chat", tags=["chat"])
    app.include_router(fallback.router, prefix="/fallback", tags=["fallback"])
    app.include_router(admin.router, prefix="/admin", tags=["admin"])

    @app.get("/health", tags=["system"], response_model=HealthResponse)
    def health_check() -> HealthResponse:
        return HealthResponse(status="ok", environment=settings.env)

    return app


app = create_app()
