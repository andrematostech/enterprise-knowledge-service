from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_auth, require_kb_access, role_at_least
from app.models.user import User
from app.repositories.knowledge_base_member_repository import KnowledgeBaseMemberRepository
from app.schemas.kb_member import (
    KnowledgeBaseMemberCreate,
    KnowledgeBaseMemberRead,
    KnowledgeBaseMemberUpdate,
)


router = APIRouter(
    prefix="/knowledge-bases/{knowledge_base_id}/members",
    tags=["knowledge-base-members"],
    dependencies=[Depends(require_auth)],
)


def get_member_repo(db: Session = Depends(get_db)) -> KnowledgeBaseMemberRepository:
    return KnowledgeBaseMemberRepository(db)


def resolve_user(
    db: Session,
    user_id: UUID | None,
    email: str | None,
) -> User | None:
    if user_id:
        return db.get(User, user_id)
    if email:
        return db.query(User).filter(User.email == email).first()
    return None


def ensure_admin(member_repo: KnowledgeBaseMemberRepository, kb_id: UUID, current_user: User) -> None:
    role = member_repo.get_role(kb_id, current_user.id)
    if not role_at_least(role, "admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")


def ensure_owner(member_repo: KnowledgeBaseMemberRepository, kb_id: UUID, current_user: User) -> None:
    role = member_repo.get_role(kb_id, current_user.id)
    if role != "owner":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Owner role required")


def ensure_not_last_owner(member_repo: KnowledgeBaseMemberRepository, kb_id: UUID) -> None:
    if member_repo.count_owners(kb_id) <= 1:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot remove last owner")


@router.get("", response_model=list[KnowledgeBaseMemberRead])
def list_members(
    knowledge_base_id: UUID,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(require_auth),
    member_repo: KnowledgeBaseMemberRepository = Depends(get_member_repo),
) -> list[KnowledgeBaseMemberRead]:
    require_kb_access(knowledge_base_id, db, current_user, minimum_role="member")
    members = member_repo.list_by_kb(knowledge_base_id)
    return [
        KnowledgeBaseMemberRead(
            id=member.id,
            user_id=member.user_id,
            email=member.user.email if member.user else None,
            full_name=member.user.full_name if member.user else None,
            position=member.user.position if member.user else None,
            role=member.role,
            created_at=member.created_at,
        )
        for member in members
    ]


@router.post("", response_model=KnowledgeBaseMemberRead, status_code=status.HTTP_201_CREATED)
def add_member(
    knowledge_base_id: UUID,
    payload: KnowledgeBaseMemberCreate,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(require_auth),
    member_repo: KnowledgeBaseMemberRepository = Depends(get_member_repo),
) -> KnowledgeBaseMemberRead:
    require_kb_access(knowledge_base_id, db, current_user, minimum_role="member")
    if not current_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")
    ensure_admin(member_repo, knowledge_base_id, current_user)

    if payload.role == "owner":
        ensure_owner(member_repo, knowledge_base_id, current_user)

    user = resolve_user(db, payload.user_id, payload.email)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    existing = member_repo.find_by_user(knowledge_base_id, user.id)
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User already a member")

    member = member_repo.create_member(knowledge_base_id, user.id, payload.role)
    return KnowledgeBaseMemberRead(
        id=member.id,
        user_id=member.user_id,
        email=user.email,
        full_name=user.full_name,
        position=user.position,
        role=member.role,
        created_at=member.created_at,
    )


@router.patch("/{member_id}", response_model=KnowledgeBaseMemberRead)
def update_member(
    knowledge_base_id: UUID,
    member_id: UUID,
    payload: KnowledgeBaseMemberUpdate,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(require_auth),
    member_repo: KnowledgeBaseMemberRepository = Depends(get_member_repo),
) -> KnowledgeBaseMemberRead:
    require_kb_access(knowledge_base_id, db, current_user, minimum_role="member")
    if not current_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")
    ensure_admin(member_repo, knowledge_base_id, current_user)

    member = member_repo.get_member(member_id)
    if not member or member.knowledge_base_id != knowledge_base_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    if payload.role == "owner":
        ensure_owner(member_repo, knowledge_base_id, current_user)
    if member.role == "owner" and payload.role != "owner":
        ensure_owner(member_repo, knowledge_base_id, current_user)
        ensure_not_last_owner(member_repo, knowledge_base_id)

    member = member_repo.update_role(member, payload.role)
    user = member.user
    return KnowledgeBaseMemberRead(
        id=member.id,
        user_id=member.user_id,
        email=user.email if user else None,
        full_name=user.full_name if user else None,
        position=user.position if user else None,
        role=member.role,
        created_at=member.created_at,
    )


@router.delete("/{member_id}", response_model=KnowledgeBaseMemberRead)
def remove_member(
    knowledge_base_id: UUID,
    member_id: UUID,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(require_auth),
    member_repo: KnowledgeBaseMemberRepository = Depends(get_member_repo),
) -> KnowledgeBaseMemberRead:
    require_kb_access(knowledge_base_id, db, current_user, minimum_role="member")
    if not current_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")
    ensure_admin(member_repo, knowledge_base_id, current_user)

    member = member_repo.get_member(member_id)
    if not member or member.knowledge_base_id != knowledge_base_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    if member.role == "owner":
        ensure_owner(member_repo, knowledge_base_id, current_user)
        ensure_not_last_owner(member_repo, knowledge_base_id)

    user = member.user
    member_repo.delete_member(member)
    return KnowledgeBaseMemberRead(
        id=member.id,
        user_id=member.user_id,
        email=user.email if user else None,
        full_name=user.full_name if user else None,
        position=user.position if user else None,
        role=member.role,
        created_at=member.created_at,
    )
