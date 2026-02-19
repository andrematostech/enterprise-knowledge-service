from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user_from_jwt, get_settings
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User
from app.schemas.auth import Token, UserCreate, UserLogin, UserRead


router = APIRouter(prefix="/auth", tags=["auth"])


def is_admin_user(db: Session, user: User) -> bool:
    first_user = db.execute(select(User).order_by(User.created_at.asc())).scalars().first()
    return bool(first_user and first_user.id == user.id)


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)) -> UserRead:
    existing = db.execute(select(User).where(User.email == payload.email)).scalars().first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
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
