from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_auth, require_kb_access
from app.models.user import User
from app.repositories.knowledge_base_repository import KnowledgeBaseRepository
from app.repositories.knowledge_base_member_repository import KnowledgeBaseMemberRepository
from app.schemas.common import Message
from app.schemas.knowledge_base import KnowledgeBaseCreate, KnowledgeBaseRead
from app.services.knowledge_base_service import KnowledgeBaseService


router = APIRouter(prefix="/knowledge-bases", tags=["knowledge-bases"], dependencies=[Depends(require_auth)])


def get_service(db: Session = Depends(get_db)) -> KnowledgeBaseService:
    repo = KnowledgeBaseRepository(db)
    member_repo = KnowledgeBaseMemberRepository(db)
    return KnowledgeBaseService(repo, member_repo)


@router.post("", response_model=KnowledgeBaseRead, status_code=status.HTTP_201_CREATED)
def create_knowledge_base(
    payload: KnowledgeBaseCreate,
    current_user: User | None = Depends(require_auth),
    service: KnowledgeBaseService = Depends(get_service),
) -> KnowledgeBaseRead:
    owner_user_id = current_user.id if current_user else None
    knowledge_base = service.create(payload, owner_user_id)
    return KnowledgeBaseRead.model_validate(knowledge_base)


@router.get("", response_model=list[KnowledgeBaseRead])
def list_knowledge_bases(
    current_user: User | None = Depends(require_auth),
    service: KnowledgeBaseService = Depends(get_service),
) -> list[KnowledgeBaseRead]:
    user_id = current_user.id if current_user else None
    return [KnowledgeBaseRead.model_validate(item) for item in service.list(user_id)]


@router.get("/{knowledge_base_id}", response_model=KnowledgeBaseRead)
def get_knowledge_base(
    knowledge_base_id: UUID,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(require_auth),
    service: KnowledgeBaseService = Depends(get_service),
) -> KnowledgeBaseRead:
    knowledge_base = require_kb_access(knowledge_base_id, db, current_user, "viewer")
    return KnowledgeBaseRead.model_validate(knowledge_base)


@router.delete("/{knowledge_base_id}", response_model=Message)
def delete_knowledge_base(
    knowledge_base_id: UUID,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(require_auth),
    service: KnowledgeBaseService = Depends(get_service),
) -> Message:
    require_kb_access(knowledge_base_id, db, current_user, "owner")
    if not service.delete(knowledge_base_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Knowledge base not found")
    return Message(detail="Deleted")
