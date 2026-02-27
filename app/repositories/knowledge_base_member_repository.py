from uuid import UUID

from sqlalchemy import delete, func, select
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

    def create_member(self, knowledge_base_id: UUID, user_id: UUID, role: str) -> KnowledgeBaseMember:
        membership = KnowledgeBaseMember(
            knowledge_base_id=knowledge_base_id,
            user_id=user_id,
            role=role,
        )
        return self.create(membership)

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

    def list_by_kb(self, knowledge_base_id: UUID) -> list[KnowledgeBaseMember]:
        return (
            self._db.execute(
                select(KnowledgeBaseMember)
                .where(KnowledgeBaseMember.knowledge_base_id == knowledge_base_id)
                .order_by(KnowledgeBaseMember.created_at.asc())
            )
            .scalars()
            .all()
        )

    def get_member(self, member_id: UUID) -> KnowledgeBaseMember | None:
        return self._db.get(KnowledgeBaseMember, member_id)

    def update_role(self, member: KnowledgeBaseMember, role: str) -> KnowledgeBaseMember:
        member.role = role
        self._db.commit()
        self._db.refresh(member)
        return member

    def delete_member(self, member: KnowledgeBaseMember) -> None:
        self._db.delete(member)
        self._db.commit()

    def find_by_user(self, knowledge_base_id: UUID, user_id: UUID) -> KnowledgeBaseMember | None:
        return (
            self._db.execute(
                select(KnowledgeBaseMember).where(
                    KnowledgeBaseMember.knowledge_base_id == knowledge_base_id,
                    KnowledgeBaseMember.user_id == user_id,
                )
            )
            .scalars()
            .first()
        )

    def count_owners(self, knowledge_base_id: UUID) -> int:
        return (
            self._db.execute(
                select(func.count(KnowledgeBaseMember.id)).where(
                    KnowledgeBaseMember.knowledge_base_id == knowledge_base_id,
                    KnowledgeBaseMember.role == "owner",
                )
            )
            .scalar()
            or 0
        )

    def delete_for_user(self, knowledge_base_id: UUID, user_id: UUID) -> None:
        self._db.execute(
            delete(KnowledgeBaseMember).where(
                KnowledgeBaseMember.knowledge_base_id == knowledge_base_id,
                KnowledgeBaseMember.user_id == user_id,
            )
        )
        self._db.commit()
