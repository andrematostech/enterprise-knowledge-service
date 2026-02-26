from collections.abc import Generator
from functools import lru_cache
import uuid

from fastapi import Header, HTTPException, status, Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.core.config import Settings
from app.core.database import get_db_session
from app.core.security import api_key_matches, decode_access_token
from app.models.knowledge_base import KnowledgeBase
from app.models.knowledge_base_member import KnowledgeBaseMember
from app.models.user import User


ROLE_ORDER = {"viewer": 1, "member": 2, "admin": 3, "owner": 4}


@lru_cache
def get_settings() -> Settings:
    return Settings()


def get_db() -> Generator[Session, None, None]:
    settings = get_settings()
    yield from get_db_session(settings)


http_bearer = HTTPBearer(auto_error=False)


def require_api_key(x_api_key: str = Header(default="", alias="X-API-Key")) -> None:
    settings = get_settings()
    if not api_key_matches(x_api_key, settings.api_key):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")


def get_current_user_from_jwt(
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials | None = Depends(http_bearer),
) -> User:
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing token")
    settings = get_settings()
    try:
        payload = decode_access_token(credentials.credentials, settings)
    except JWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc
    user = db.get(User, user_uuid)
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Inactive user")
    return user


def require_auth(
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials | None = Depends(http_bearer),
    x_api_key: str = Header(default="", alias="X-API-Key"),
) -> User | None:
    settings = get_settings()
    if credentials:
        try:
            payload = decode_access_token(credentials.credentials, settings)
            user_id = payload.get("sub")
            if user_id:
                try:
                    user_uuid = uuid.UUID(user_id)
                except ValueError:
                    user_uuid = None
                if user_uuid:
                    user = db.get(User, user_uuid)
                    if user and user.is_active:
                        return user
        except JWTError:
            pass
    if api_key_matches(x_api_key, settings.api_key):
        return None
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")


def role_at_least(role: str | None, minimum: str) -> bool:
    if not role:
        return False
    return ROLE_ORDER.get(role, 0) >= ROLE_ORDER.get(minimum, 0)


def get_kb_role(db: Session, knowledge_base: KnowledgeBase, user_id: uuid.UUID) -> str | None:
    if knowledge_base.owner_user_id == user_id:
        return "owner"
    membership = (
        db.execute(
            select(KnowledgeBaseMember).where(
                KnowledgeBaseMember.knowledge_base_id == knowledge_base.id,
                KnowledgeBaseMember.user_id == user_id,
            )
        )
        .scalars()
        .first()
    )
    return membership.role if membership else None


def require_kb_access(
    knowledge_base_id: uuid.UUID,
    db: Session,
    current_user: User | None,
    minimum_role: str = "viewer",
) -> KnowledgeBase:
    knowledge_base = db.get(KnowledgeBase, knowledge_base_id)
    if not knowledge_base:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Knowledge base not found")

    if current_user is None:
        return knowledge_base

    role = get_kb_role(db, knowledge_base, current_user.id)
    if not role_at_least(role, minimum_role):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return knowledge_base
