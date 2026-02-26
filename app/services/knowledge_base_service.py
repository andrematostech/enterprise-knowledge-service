from uuid import UUID

from app.models.knowledge_base import KnowledgeBase
from app.models.knowledge_base_member import KnowledgeBaseMember
from app.repositories.knowledge_base_repository import KnowledgeBaseRepository
from app.repositories.knowledge_base_member_repository import KnowledgeBaseMemberRepository
from app.schemas.knowledge_base import KnowledgeBaseCreate


class KnowledgeBaseService:
    def __init__(self, repo: KnowledgeBaseRepository, member_repo: KnowledgeBaseMemberRepository) -> None:
        self._repo = repo
        self._member_repo = member_repo

    def create(self, payload: KnowledgeBaseCreate, owner_user_id: UUID | None) -> KnowledgeBase:
        knowledge_base = KnowledgeBase(
            name=payload.name,
            description=payload.description,
            owner_user_id=owner_user_id,
        )
        knowledge_base = self._repo.create(knowledge_base)
        if owner_user_id:
            self._member_repo.create(
                KnowledgeBaseMember(
                    knowledge_base_id=knowledge_base.id,
                    user_id=owner_user_id,
                    role="owner",
                )
            )
        return knowledge_base

    def list(self, user_id: UUID | None) -> list[KnowledgeBase]:
        if not user_id:
            return self._repo.list()
        return self._repo.list_for_user(user_id)

    def get(self, knowledge_base_id: UUID) -> KnowledgeBase | None:
        return self._repo.get(knowledge_base_id)

    def delete(self, knowledge_base_id: UUID) -> bool:
        knowledge_base = self._repo.get(knowledge_base_id)
        if not knowledge_base:
            return False
        self._repo.delete(knowledge_base)
        return True
