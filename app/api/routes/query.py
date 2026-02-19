from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_settings, require_auth
from app.repositories.knowledge_base_repository import KnowledgeBaseRepository
from app.schemas.query import QueryRequest, QueryResponse
from app.services.openai_service import OpenAIService
from app.services.rag_service import RagService
from app.services.vector_store_service import VectorStoreService


router = APIRouter(
    prefix="/knowledge-bases/{knowledge_base_id}",
    tags=["query"],
    dependencies=[Depends(require_auth)],
)


def get_service(db: Session = Depends(get_db)) -> RagService:
    settings = get_settings()
    kb_repo = KnowledgeBaseRepository(db)
    openai = OpenAIService(settings)
    vector_store = VectorStoreService(settings)
    return RagService(settings, kb_repo, openai, vector_store)


@router.post("/query", response_model=QueryResponse)
def query_knowledge_base(
    knowledge_base_id: UUID,
    payload: QueryRequest,
    service: RagService = Depends(get_service),
) -> QueryResponse:
    try:
        return service.query(str(knowledge_base_id), payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
