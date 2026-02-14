from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_settings, require_api_key
from app.repositories.chunk_repository import ChunkRepository
from app.repositories.document_repository import DocumentRepository
from app.repositories.ingestion_repository import IngestionRepository
from app.repositories.knowledge_base_repository import KnowledgeBaseRepository
from app.schemas.ingestion import IngestionRead
from app.services.ingestion_service import IngestionService
from app.services.openai_service import OpenAIService
from app.services.vector_store_service import VectorStoreService


router = APIRouter(
    prefix="/knowledge-bases/{knowledge_base_id}",
    tags=["ingestion"],
    dependencies=[Depends(require_api_key)],
)


def get_service(db: Session = Depends(get_db)) -> IngestionService:
    settings = get_settings()
    kb_repo = KnowledgeBaseRepository(db)
    doc_repo = DocumentRepository(db)
    chunk_repo = ChunkRepository(db)
    ingestion_repo = IngestionRepository(db)
    openai = OpenAIService(settings)
    vector_store = VectorStoreService(settings)
    return IngestionService(settings, kb_repo, doc_repo, chunk_repo, ingestion_repo, openai, vector_store)


@router.post("/ingest", response_model=IngestionRead, status_code=status.HTTP_202_ACCEPTED)
def ingest_knowledge_base(
    knowledge_base_id: UUID,
    service: IngestionService = Depends(get_service),
) -> IngestionRead:
    try:
        ingestion = service.ingest(knowledge_base_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return IngestionRead.model_validate(ingestion)
