from fastapi import FastAPI

from app.api.routes.health import router as health_router
from app.api.routes.knowledge_bases import router as knowledge_base_router
from app.api.routes.documents import router as documents_router
from app.api.routes.ingestion import router as ingestion_router
from app.api.routes.query import router as query_router
from app.core.logging import configure_logging


def create_app() -> FastAPI:
    configure_logging()
    app = FastAPI(title="Enterprise Knowledge Service", version="0.1.0")

    app.include_router(health_router)
    app.include_router(knowledge_base_router, prefix="/api/v1")
    app.include_router(documents_router, prefix="/api/v1")
    app.include_router(ingestion_router, prefix="/api/v1")
    app.include_router(query_router, prefix="/api/v1")

    return app


app = create_app()
