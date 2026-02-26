from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, or_, select
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user_from_jwt, get_settings
from app.core.security import create_access_token, hash_password, verify_password
from app.models.message import Message
from app.models.user import User
from app.schemas.auth import Token, UserCreate, UserLogin, UserRead


router = APIRouter(prefix="/auth", tags=["auth"])


def has_admin(db: Session) -> bool:
    return bool(db.execute(select(User).where(User.is_admin.is_(True))).scalars().first())


def is_admin_user(db: Session, user: User) -> bool:
    return bool(user.is_admin)


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)) -> UserRead:
    existing = db.execute(select(User).where(User.email == payload.email)).scalars().first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    should_promote = not has_admin(db)
    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
        position=payload.position,
        avatar_url=payload.avatar_url,
        is_admin=should_promote,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserRead.model_validate(
        {**user.__dict__, "is_admin": is_admin_user(db, user)},
        from_attributes=True,
    )


@router.post("/login", response_model=Token)
def login(payload: UserLogin, db: Session = Depends(get_db)) -> Token:
    user = db.execute(select(User).where(User.email == payload.email)).scalars().first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    settings = get_settings()
    token = create_access_token(str(user.id), settings)
    return Token(access_token=token)


@router.get("/me", response_model=UserRead)
def me(
    current_user: User = Depends(get_current_user_from_jwt),
    db: Session = Depends(get_db),
) -> UserRead:
    return UserRead.model_validate(
        {**current_user.__dict__, "is_admin": is_admin_user(db, current_user)},
        from_attributes=True,
    )


@router.get("/users", response_model=list[UserRead])
def list_users(
    current_user: User = Depends(get_current_user_from_jwt),
    db: Session = Depends(get_db),
) -> list[UserRead]:
    if not is_admin_user(db, current_user) and has_admin(db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    users = db.execute(select(User).order_by(User.created_at.asc())).scalars().all()
    return [
        UserRead.model_validate(
            {**user.__dict__, "is_admin": is_admin_user(db, user)},
            from_attributes=True,
        )
        for user in users
    ]


@router.delete("/users/{user_id}")
def delete_user(
    user_id: str,
    current_user: User = Depends(get_current_user_from_jwt),
    db: Session = Depends(get_db),
) -> dict:
    if not is_admin_user(db, current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")

    target = db.execute(select(User).where(User.id == user_id)).scalars().first()
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    db.execute(
        delete(Message).where(
            or_(
                Message.sender_user_id == user_id,
                Message.recipient_user_id == user_id,
            )
        )
    )
    db.delete(target)
    db.commit()
    return {"detail": "User deleted"}


@router.patch("/users/{user_id}/role")
def update_user_role(
    user_id: str,
    payload: dict,
    current_user: User = Depends(get_current_user_from_jwt),
    db: Session = Depends(get_db),
) -> dict:
    if not is_admin_user(db, current_user) and has_admin(db):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")

    target = db.execute(select(User).where(User.id == user_id)).scalars().first()
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    is_admin = bool(payload.get("is_admin"))
    target.is_admin = is_admin
    db.add(target)
    db.commit()
    return {"detail": "Role updated"}
