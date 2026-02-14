import uuid

from app.core.config import Settings
from app.models.chunk import Chunk
from app.repositories.chunk_repository import ChunkRepository
from app.repositories.document_repository import DocumentRepository
from app.repositories.ingestion_repository import IngestionRepository
from app.repositories.knowledge_base_repository import KnowledgeBaseRepository
from app.services.openai_service import OpenAIService
from app.services.vector_store_service import VectorStoreService
from app.utils.documents import extract_text_from_file
from app.utils.hashing import sha256_text
from app.utils.text import chunk_text, normalize_whitespace


class IngestionService:
    def __init__(
        self,
        settings: Settings,
        knowledge_base_repo: KnowledgeBaseRepository,
        document_repo: DocumentRepository,
        chunk_repo: ChunkRepository,
        ingestion_repo: IngestionRepository,
        openai_service: OpenAIService,
        vector_store: VectorStoreService,
    ) -> None:
        self._settings = settings
        self._knowledge_base_repo = knowledge_base_repo
        self._document_repo = document_repo
        self._chunk_repo = chunk_repo
        self._ingestion_repo = ingestion_repo
        self._openai = openai_service
        self._vector_store = vector_store

    def ingest(self, knowledge_base_id: uuid.UUID):
        knowledge_base = self._knowledge_base_repo.get(knowledge_base_id)
        if not knowledge_base:
            raise ValueError("Knowledge base not found")

        ingestion = self._ingestion_repo.create(knowledge_base_id, status="processing")

        try:
            documents = self._document_repo.list_by_knowledge_base(knowledge_base_id)
            for document in documents:
                raw_text = extract_text_from_file(document.storage_path, document.content_type)
                normalized = normalize_whitespace(raw_text)
                if not normalized:
                    continue

                parts = chunk_text(normalized, self._settings.chunk_size, self._settings.chunk_overlap)
                chunks: list[Chunk] = []
                for index, part in enumerate(parts):
                    chunk_id = uuid.uuid4()
                    chunks.append(
                        Chunk(
                            id=chunk_id,
                            document_id=document.id,
                            position=index,
                            text=part,
                            hash=sha256_text(part),
                        )
                    )

                self._chunk_repo.create_many(chunks)
                embeddings = self._openai.embed_texts([chunk.text for chunk in chunks])
                self._vector_store.add_embeddings(str(knowledge_base_id), chunks, embeddings, document.filename)

            ingestion = self._ingestion_repo.update_status(ingestion.id, status="completed")
        except Exception as exc:  # noqa: BLE001
            ingestion = self._ingestion_repo.update_status(ingestion.id, status="failed", message=str(exc))
            raise

        return ingestion
