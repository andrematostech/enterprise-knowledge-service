import chromadb

from app.core.config import Settings
from app.models.chunk import Chunk
from app.utils.files import ensure_directory


class VectorStoreService:
    def __init__(self, settings: Settings) -> None:
        ensure_directory(settings.chroma_path)
        self._client = chromadb.PersistentClient(path=settings.chroma_path)

    def add_embeddings(
        self,
        knowledge_base_id: str,
        chunks: list[Chunk],
        embeddings: list[list[float]],
        filename: str,
    ) -> None:
        if not chunks:
            return
        collection = self._client.get_or_create_collection(name=f"kb_{knowledge_base_id}")
        ids = [str(chunk.id) for chunk in chunks]
        documents = [chunk.text for chunk in chunks]
        metadatas = [
            {
                "chunk_id": str(chunk.id),
                "document_id": str(chunk.document_id),
                "position": int(chunk.position),
                "filename": filename,
            }
            for chunk in chunks
        ]
        collection.add(ids=ids, embeddings=embeddings, documents=documents, metadatas=metadatas)

    def query(self, knowledge_base_id: str, embedding: list[float], top_k: int) -> dict:
        collection = self._client.get_or_create_collection(name=f"kb_{knowledge_base_id}")
        return collection.query(query_embeddings=[embedding], n_results=top_k, include=["documents", "metadatas", "distances"])

    def delete_embeddings(
        self,
        knowledge_base_id: str,
        ids: list[str] | None = None,
        where: dict | None = None,
    ) -> None:
        collection = self._client.get_or_create_collection(name=f"kb_{knowledge_base_id}")
        if ids:
            collection.delete(ids=ids)
            return
        if where:
            collection.delete(where=where)
