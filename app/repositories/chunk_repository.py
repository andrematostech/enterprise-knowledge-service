from uuid import UUID

from sqlalchemy.orm import Session
from sqlalchemy import delete, select

from app.models.chunk import Chunk


class ChunkRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def create_many(self, chunks: list[Chunk]) -> None:
        if not chunks:
            return
        self._db.add_all(chunks)
        self._db.commit()

    def list_ids_by_document(self, document_id: UUID) -> list[str]:
        rows = self._db.execute(select(Chunk.id).where(Chunk.document_id == document_id)).all()
        return [str(row[0]) for row in rows]

    def delete_by_document(self, document_id: UUID) -> None:
        self._db.execute(delete(Chunk).where(Chunk.document_id == document_id))
        self._db.commit()
