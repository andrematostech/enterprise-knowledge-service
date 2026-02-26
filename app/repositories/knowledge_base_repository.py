from uuid import UUID

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models.knowledge_base import KnowledgeBase
from app.models.knowledge_base_member import KnowledgeBaseMember


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

    def list_for_user(self, user_id: UUID) -> list[KnowledgeBase]:
        return (
            self._db.execute(
                select(KnowledgeBase)
                .outerjoin(
                    KnowledgeBaseMember,
                    KnowledgeBaseMember.knowledge_base_id == KnowledgeBase.id,
                )
                .where(
                    or_(
                        KnowledgeBase.owner_user_id == user_id,
                        KnowledgeBaseMember.user_id == user_id,
                    )
                )
                .order_by(KnowledgeBase.created_at.desc())
            )
            .scalars()
            .unique()
            .all()
        )

    def get(self, knowledge_base_id: UUID) -> KnowledgeBase | None:
        return self._db.get(KnowledgeBase, knowledge_base_id)

    def delete(self, knowledge_base: KnowledgeBase) -> None:
        self._db.delete(knowledge_base)
        self._db.commit()
