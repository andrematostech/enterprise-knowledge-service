from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_settings, require_auth
from app.models.knowledge_base import KnowledgeBase
from app.repositories.knowledge_base_repository import KnowledgeBaseRepository
from app.repositories.query_log_repository import QueryLogRepository
from app.schemas.query import QueryRequest, QueryResponse
from app.services.openai_service import OpenAIService
from app.services.rag_service import RagService
from app.services.vector_store_service import VectorStoreService
from app.models.user import User


router = APIRouter(
    prefix="/knowledge-bases/{knowledge_base_id}",
    tags=["query"],
    dependencies=[Depends(require_auth)],
)


def get_service(db: Session = Depends(get_db)) -> RagService:
    settings = get_settings()
    kb_repo = KnowledgeBaseRepository(db)
    query_log_repo = QueryLogRepository(db)
    openai = OpenAIService(settings)
    vector_store = VectorStoreService(settings)
    return RagService(settings, kb_repo, openai, vector_store, query_log_repo)


@router.post("/query", response_model=QueryResponse)
def query_knowledge_base(
    knowledge_base_id: UUID,
    payload: QueryRequest,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(require_auth),
    service: RagService = Depends(get_service),
) -> QueryResponse:
    knowledge_base = db.get(KnowledgeBase, knowledge_base_id)
    if knowledge_base is None:
        raise HTTPException(status_code=404, detail="Knowledge base not found")

    try:
        user_id = current_user.id if current_user else None
        return service.query(str(knowledge_base_id), payload, user_id=user_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
