from sqlalchemy.orm import Session

from app.models.query_log import QueryLog


class QueryLogRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def create(self, log: QueryLog) -> QueryLog:
        self._db.add(log)
        self._db.commit()
        self._db.refresh(log)
        return log
