from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_settings, require_auth, require_kb_access
from app.core.database import get_db_session
from app.models.user import User
from app.repositories.chunk_repository import ChunkRepository
from app.repositories.document_repository import DocumentRepository
from app.repositories.ingest_run_repository import IngestRunRepository
from app.repositories.knowledge_base_repository import KnowledgeBaseRepository
from app.schemas.ingestion import IngestionRead
from app.services.ingestion_service import IngestionService
from app.services.openai_service import OpenAIService
from app.services.vector_store_service import VectorStoreService


router = APIRouter(
    prefix="/knowledge-bases/{knowledge_base_id}",
    tags=["ingestion"],
    dependencies=[Depends(require_auth)],
)


def get_service(db: Session = Depends(get_db)) -> IngestionService:
    settings = get_settings()
    kb_repo = KnowledgeBaseRepository(db)
    doc_repo = DocumentRepository(db)
    chunk_repo = ChunkRepository(db)
    ingest_run_repo = IngestRunRepository(db)
    openai = OpenAIService(settings)
    vector_store = VectorStoreService(settings)
    return IngestionService(settings, kb_repo, doc_repo, chunk_repo, ingest_run_repo, openai, vector_store)


def run_ingest_background(knowledge_base_id: UUID, user_id: UUID | None, run_id: UUID) -> None:
    settings = get_settings()
    db_gen = get_db_session(settings)
    db = next(db_gen)
    try:
        kb_repo = KnowledgeBaseRepository(db)
        doc_repo = DocumentRepository(db)
        chunk_repo = ChunkRepository(db)
        ingest_run_repo = IngestRunRepository(db)
        openai = OpenAIService(settings)
        vector_store = VectorStoreService(settings)
        service = IngestionService(settings, kb_repo, doc_repo, chunk_repo, ingest_run_repo, openai, vector_store)
        service.ingest(knowledge_base_id, user_id=user_id, run_id=run_id)
    finally:
        try:
            next(db_gen)
        except StopIteration:
            pass


@router.post("/ingest", response_model=IngestionRead, status_code=status.HTTP_202_ACCEPTED)
def ingest_knowledge_base(
    knowledge_base_id: UUID,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(require_auth),
    service: IngestionService = Depends(get_service),
) -> IngestionRead:
    try:
        require_kb_access(knowledge_base_id, db, current_user, "admin")
        user_id = current_user.id if current_user else None
        run = service._ingest_run_repo.create(knowledge_base_id, user_id)
        background_tasks.add_task(run_ingest_background, knowledge_base_id, user_id, run.id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return IngestionRead.model_validate(run)
