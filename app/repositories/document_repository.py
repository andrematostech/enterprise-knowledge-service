from datetime import datetime
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.document import Document


class DocumentRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def create(self, document: Document) -> Document:
        self._db.add(document)
        self._db.commit()
        self._db.refresh(document)
        return document

    def list_by_knowledge_base(self, knowledge_base_id: UUID) -> list[Document]:
        return (
            self._db.query(Document)
            .filter(Document.knowledge_base_id == knowledge_base_id)
            .order_by(Document.created_at.desc())
            .all()
        )

    def get(self, document_id: UUID) -> Document | None:
        return self._db.get(Document, document_id)

    def delete(self, document: Document) -> None:
        self._db.delete(document)
        self._db.commit()

    def update_ingestion_state(self, document_id: UUID, content_hash: str, ingested_at: datetime) -> None:
        document = self._db.get(Document, document_id)
        if not document:
            return
        document.content_hash = content_hash
        document.last_ingested_at = ingested_at
        self._db.commit()
