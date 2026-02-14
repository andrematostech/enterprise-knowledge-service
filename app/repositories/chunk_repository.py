from sqlalchemy.orm import Session

from app.models.chunk import Chunk


class ChunkRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def create_many(self, chunks: list[Chunk]) -> None:
        if not chunks:
            return
        self._db.add_all(chunks)
        self._db.commit()
