import uuid

from sqlalchemy.orm import Session

from app.models.ingestion import Ingestion


class IngestionRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def create(self, knowledge_base_id: uuid.UUID, status: str, message: str | None = None) -> Ingestion:
        ingestion = Ingestion(knowledge_base_id=knowledge_base_id, status=status, message=message)
        self._db.add(ingestion)
        self._db.commit()
        self._db.refresh(ingestion)
        return ingestion

    def update_status(self, ingestion_id: uuid.UUID, status: str, message: str | None = None) -> Ingestion:
        ingestion = self._db.get(Ingestion, ingestion_id)
        if not ingestion:
            raise ValueError("Ingestion not found")
        ingestion.status = status
        ingestion.message = message
        self._db.commit()
        self._db.refresh(ingestion)
        return ingestion

    def get(self, ingestion_id: uuid.UUID) -> Ingestion | None:
        return self._db.get(Ingestion, ingestion_id)
