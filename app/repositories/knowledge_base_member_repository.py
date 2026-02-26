from uuid import UUID

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.models.knowledge_base_member import KnowledgeBaseMember


class KnowledgeBaseMemberRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def create(self, membership: KnowledgeBaseMember) -> KnowledgeBaseMember:
        self._db.add(membership)
        self._db.commit()
        self._db.refresh(membership)
        return membership

    def get_role(self, knowledge_base_id: UUID, user_id: UUID) -> str | None:
        membership = (
            self._db.execute(
                select(KnowledgeBaseMember).where(
                    KnowledgeBaseMember.knowledge_base_id == knowledge_base_id,
                    KnowledgeBaseMember.user_id == user_id,
                )
            )
            .scalars()
            .first()
        )
        return membership.role if membership else None

    def delete_for_user(self, knowledge_base_id: UUID, user_id: UUID) -> None:
        self._db.execute(
            delete(KnowledgeBaseMember).where(
                KnowledgeBaseMember.knowledge_base_id == knowledge_base_id,
                KnowledgeBaseMember.user_id == user_id,
            )
        )
        self._db.commit()
