from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.health import router as health_router
from app.api.routes.auth import router as auth_router
from app.api.routes.knowledge_bases import router as knowledge_base_router
from app.api.routes.documents import router as documents_router
from app.api.routes.ingestion import router as ingestion_router
from app.api.routes.calendar import router as calendar_router
from app.api.routes.query import router as query_router
from app.api.routes.messages import router as messages_router
from app.api.routes.analytics import router as analytics_router
from app.api.routes.members import router as members_router
from app.core.config import Settings
from app.core.logging import configure_logging

from alembic import command
from alembic.config import Config
from pathlib import Path
import logging


def run_migrations() -> None:
    settings = Settings()
    if not settings.auto_migrate:
        return
    root = Path(__file__).resolve().parent.parent
    alembic_ini = root / "alembic.ini"
    if not alembic_ini.exists():
        logging.getLogger(__name__).warning("Alembic config not found; skipping migrations.")
        return
    config = Config(str(alembic_ini))
    config.set_main_option("sqlalchemy.url", settings.database_url)
    command.upgrade(config, "head")


def create_app() -> FastAPI:
    configure_logging()
    app = FastAPI(title="Enterprise Knowledge Service", version="0.1.0")
    run_migrations()

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:8000",
            "http://127.0.0.1:8000",
        ],
        allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health_router)
    app.include_router(auth_router, prefix="/api/v1")
    app.include_router(knowledge_base_router, prefix="/api/v1")
    app.include_router(documents_router, prefix="/api/v1")
    app.include_router(ingestion_router, prefix="/api/v1")
    app.include_router(query_router, prefix="/api/v1")
    app.include_router(messages_router, prefix="/api/v1")
    app.include_router(calendar_router, prefix="/api/v1")
    app.include_router(analytics_router, prefix="/api/v1")
    app.include_router(members_router, prefix="/api/v1")

    return app


app = create_app()
