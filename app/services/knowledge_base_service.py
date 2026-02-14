from uuid import UUID

from app.models.knowledge_base import KnowledgeBase
from app.repositories.knowledge_base_repository import KnowledgeBaseRepository
from app.schemas.knowledge_base import KnowledgeBaseCreate


class KnowledgeBaseService:
    def __init__(self, repo: KnowledgeBaseRepository) -> None:
        self._repo = repo

    def create(self, payload: KnowledgeBaseCreate) -> KnowledgeBase:
        knowledge_base = KnowledgeBase(name=payload.name, description=payload.description)
        return self._repo.create(knowledge_base)

    def list(self) -> list[KnowledgeBase]:
        return self._repo.list()

    def get(self, knowledge_base_id: UUID) -> KnowledgeBase | None:
        return self._repo.get(knowledge_base_id)

    def delete(self, knowledge_base_id: UUID) -> bool:
        knowledge_base = self._repo.get(knowledge_base_id)
        if not knowledge_base:
            return False
        self._repo.delete(knowledge_base)
        return True
