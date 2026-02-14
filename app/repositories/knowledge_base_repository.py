from uuid import UUID

from sqlalchemy.orm import Session

from app.models.knowledge_base import KnowledgeBase


class KnowledgeBaseRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def create(self, knowledge_base: KnowledgeBase) -> KnowledgeBase:
        self._db.add(knowledge_base)
        self._db.commit()
        self._db.refresh(knowledge_base)
        return knowledge_base

    def list(self) -> list[KnowledgeBase]:
        return self._db.query(KnowledgeBase).order_by(KnowledgeBase.created_at.desc()).all()

    def get(self, knowledge_base_id: UUID) -> KnowledgeBase | None:
        return self._db.get(KnowledgeBase, knowledge_base_id)

    def delete(self, knowledge_base: KnowledgeBase) -> None:
        self._db.delete(knowledge_base)
        self._db.commit()
