from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api import admin, auth, chat, docs, fallback, staff
from .core.config import settings

def create_app() -> FastAPI:
    app = FastAPI(
        title="Greenwich SmartFAQ API",
        version="0.1.0",
        docs_url="/docs/openapi",
        redoc_url="/docs/redoc",
    )

    origins = settings.cors_allow_origins

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
    app.include_router(docs.router, prefix="/api/docs", tags=["documents"])
    app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
    app.include_router(fallback.router, prefix="/api/fallback", tags=["fallback"])
    app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
    app.include_router(staff.router, prefix="/api/staff", tags=["staff"])

    @app.get("/health", tags=["system"])
    def health_check() -> dict[str, str]:
        return {"status": "ok", "environment": settings.env}

    return app


app = create_app()
