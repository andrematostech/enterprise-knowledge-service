from collections.abc import Generator
from functools import lru_cache

from fastapi import Header, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.core.database import get_db_session
from app.core.security import api_key_matches


@lru_cache
def get_settings() -> Settings:
    return Settings()


def require_api_key(x_api_key: str = Header(default="", alias="X-API-Key")) -> None:
    settings = get_settings()
    if not api_key_matches(x_api_key, settings.api_key):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")


def get_db() -> Generator[Session, None, None]:
    settings = get_settings()
    yield from get_db_session(settings)
