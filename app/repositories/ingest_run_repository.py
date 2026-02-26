import uuid
from datetime import datetime

from sqlalchemy.orm import Session

from app.models.ingest_run import IngestRun


class IngestRunRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def create(self, knowledge_base_id: uuid.UUID, user_id: uuid.UUID | None) -> IngestRun:
        run = IngestRun(knowledge_base_id=knowledge_base_id, user_id=user_id, status="processing")
        self._db.add(run)
        self._db.commit()
        self._db.refresh(run)
        return run

    def complete(
        self,
        run_id: uuid.UUID,
        status: str,
        documents_processed: int,
        chunks_created: int,
        duration_ms: int | None,
        error_message: str | None = None,
    ) -> IngestRun:
        run = self._db.get(IngestRun, run_id)
        if not run:
            raise ValueError("Ingest run not found")
        run.status = status
        run.error_message = error_message
        run.documents_processed = documents_processed
        run.chunks_created = chunks_created
        run.duration_ms = duration_ms
        run.finished_at = datetime.utcnow()
        self._db.commit()
        self._db.refresh(run)
        return run
