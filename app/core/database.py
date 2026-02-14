from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import Settings


def get_engine(settings: Settings | None = None):
    resolved = settings or Settings()
    return create_engine(resolved.database_url, pool_pre_ping=True)


def get_session_factory(settings: Settings | None = None):
    engine = get_engine(settings)
    return sessionmaker(bind=engine, autoflush=False, autocommit=False, class_=Session)


def get_db_session(settings: Settings | None = None) -> Generator[Session, None, None]:
    session_factory = get_session_factory(settings)
    db = session_factory()
    try:
        yield db
    finally:
        db.close()
