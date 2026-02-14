from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_api_key
from app.repositories.knowledge_base_repository import KnowledgeBaseRepository
from app.schemas.common import Message
from app.schemas.knowledge_base import KnowledgeBaseCreate, KnowledgeBaseRead
from app.services.knowledge_base_service import KnowledgeBaseService


router = APIRouter(prefix="/knowledge-bases", tags=["knowledge-bases"], dependencies=[Depends(require_api_key)])


def get_service(db: Session) -> KnowledgeBaseService:
    repo = KnowledgeBaseRepository(db)
    return KnowledgeBaseService(repo)


@router.post("", response_model=KnowledgeBaseRead, status_code=status.HTTP_201_CREATED)
def create_knowledge_base(payload: KnowledgeBaseCreate, db: Session = Depends(get_db)) -> KnowledgeBaseRead:
    service = get_service(db)
    knowledge_base = service.create(payload)
    return KnowledgeBaseRead.model_validate(knowledge_base)


@router.get("", response_model=list[KnowledgeBaseRead])
def list_knowledge_bases(db: Session = Depends(get_db)) -> list[KnowledgeBaseRead]:
    service = get_service(db)
    return [KnowledgeBaseRead.model_validate(item) for item in service.list()]


@router.get("/{knowledge_base_id}", response_model=KnowledgeBaseRead)
def get_knowledge_base(knowledge_base_id: UUID, db: Session = Depends(get_db)) -> KnowledgeBaseRead:
    service = get_service(db)
    knowledge_base = service.get(knowledge_base_id)
    if not knowledge_base:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Knowledge base not found")
    return KnowledgeBaseRead.model_validate(knowledge_base)


@router.delete("/{knowledge_base_id}", response_model=Message)
def delete_knowledge_base(knowledge_base_id: UUID, db: Session = Depends(get_db)) -> Message:
    service = get_service(db)
    if not service.delete(knowledge_base_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Knowledge base not found")
    return Message(detail="Deleted")
