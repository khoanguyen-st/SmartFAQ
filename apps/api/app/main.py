import asyncio
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api import admin, auth, chat, docs, fallback, staff
from .core.config import settings
from .rag.embedder import get_embeddings
from .rag.llm import LLMWrapper
from .rag.retriever import Retriever
from .rag.vector_store import get_vectorstore

logger = logging.getLogger(__name__)


def create_app() -> FastAPI:
    app = FastAPI(
        title="Greenwich SmartFAQ API",
        version="0.1.0",
        docs_url="/docs/openapi",
        redoc_url="/docs/redoc",
    )

    # Configure CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            # Development
            "http://localhost:5173",  # web-student dev
            "http://localhost:5174",  # web-admin dev
            # Production - Cloudflare Pages
            "https://smartfaq-admin.pages.dev",
            "https://smartfaq-student.pages.dev",
            # Production - Custom domains
            "https://admin.smartfaq.dev.devplus.edu.vn",
            "https://chat.smartfaq.dev.devplus.edu.vn",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
    app.include_router(docs.router, prefix="/api/docs", tags=["documents"])
    app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
    app.include_router(fallback.router, prefix="/api/fallback", tags=["fallback"])
    app.include_router(admin.router, prefix="/api/user", tags=["user"])
    app.include_router(staff.router, prefix="/api/user", tags=["user"])

    # Start background cron worker on startup
    @app.on_event("startup")
    async def _start_cron() -> None:
        try:
            from .workers import cron

            app.state.cron_task = asyncio.create_task(cron.start_periodic_task())
        except Exception:
            # log lazily to avoid importing logging at top-level here
            import logging

            logging.getLogger(__name__).exception("Failed to start cron worker")

    @app.on_event("shutdown")
    async def _stop_cron() -> None:
        task = getattr(app.state, "cron_task", None)
        if task:
            task.cancel()
            try:
                await task
            except Exception:
                pass

    @app.get("/health", tags=["system"])
    def health_check() -> dict[str, str]:
        return {"status": "ok", "environment": settings.env}

    @app.on_event("startup")
    async def warmup() -> None:
        """
        Warm critical components so that the first user request is fast and clean.
        - Init embeddings/vectorstore (ensure collection exists).
        - Build BM25 index if hybrid retrieval is enabled.
        - Init LLM client.
        """
        try:
            get_embeddings()
            vs = get_vectorstore()
            # Lightweight ping to ensure collection is ready
            try:
                vs.similarity_search("ping", k=1)
            except Exception:
                logger.exception("Warmup: vectorstore similarity_search failed")

            if settings.HYBRID_ENABLED:
                try:
                    Retriever()._get_lexical_index()
                except Exception:
                    logger.exception("Warmup: failed to build BM25 lexical index")

            # Init LLM
            try:
                LLMWrapper()
            except Exception:
                logger.exception("Warmup: failed to initialize LLM")

            logger.info("Warmup completed.")
        except Exception:
            logger.exception("Warmup failed.")

    return app


app = create_app()
