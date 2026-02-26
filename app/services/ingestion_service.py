import time
import uuid
from datetime import datetime

from app.core.config import Settings
from app.models.chunk import Chunk
from app.models.ingest_run import IngestRun
from app.repositories.chunk_repository import ChunkRepository
from app.repositories.document_repository import DocumentRepository
from app.repositories.ingest_run_repository import IngestRunRepository
from app.repositories.knowledge_base_repository import KnowledgeBaseRepository
from app.services.openai_service import OpenAIService
from app.services.vector_store_service import VectorStoreService
from app.utils.documents import extract_text_from_file
from app.utils.hashing import sha256_file, sha256_text
from app.utils.text import chunk_text, normalize_whitespace


class IngestionService:
    def __init__(
        self,
        settings: Settings,
        knowledge_base_repo: KnowledgeBaseRepository,
        document_repo: DocumentRepository,
        chunk_repo: ChunkRepository,
        ingest_run_repo: IngestRunRepository,
        openai_service: OpenAIService,
        vector_store: VectorStoreService,
    ) -> None:
        self._settings = settings
        self._knowledge_base_repo = knowledge_base_repo
        self._document_repo = document_repo
        self._chunk_repo = chunk_repo
        self._ingest_run_repo = ingest_run_repo
        self._openai = openai_service
        self._vector_store = vector_store

    def ingest(self, knowledge_base_id: uuid.UUID, user_id: uuid.UUID | None = None) -> IngestRun:
        knowledge_base = self._knowledge_base_repo.get(knowledge_base_id)
        if not knowledge_base:
            raise ValueError("Knowledge base not found")

        run = self._ingest_run_repo.create(knowledge_base_id, user_id)
        start_time = time.perf_counter()
        documents_processed = 0
        chunks_created = 0

        try:
            documents = self._document_repo.list_by_knowledge_base(knowledge_base_id)
            for document in documents:
                content_hash = sha256_file(document.storage_path)
                if document.content_hash == content_hash and document.last_ingested_at:
                    continue

                raw_text = extract_text_from_file(document.storage_path, document.content_type)
                normalized = normalize_whitespace(raw_text)
                if not normalized:
                    continue

                parts = chunk_text(normalized, self._settings.chunk_size, self._settings.chunk_overlap)
                chunks: list[Chunk] = []
                for index, part in enumerate(parts):
                    chunk_text_hash = sha256_text(part)
                    chunk_id = uuid.uuid5(
                        uuid.NAMESPACE_URL,
                        f"{knowledge_base_id}:{document.id}:{index}:{chunk_text_hash}",
                    )
                    chunks.append(
                        Chunk(
                            id=chunk_id,
                            document_id=document.id,
                            position=index,
                            text=part,
                            hash=chunk_text_hash,
                        )
                    )

                existing_ids = self._chunk_repo.list_ids_by_document(document.id)
                if existing_ids:
                    self._vector_store.delete_embeddings(str(knowledge_base_id), ids=existing_ids)
                    self._chunk_repo.delete_by_document(document.id)

                if chunks:
                    self._chunk_repo.create_many(chunks)
                    embeddings = self._openai.embed_texts([chunk.text for chunk in chunks])
                    self._vector_store.add_embeddings(str(knowledge_base_id), chunks, embeddings, document.filename)

                documents_processed += 1
                chunks_created += len(chunks)
                self._document_repo.update_ingestion_state(document.id, content_hash, datetime.utcnow())

            duration_ms = int((time.perf_counter() - start_time) * 1000)
            run = self._ingest_run_repo.complete(
                run.id,
                status="completed",
                documents_processed=documents_processed,
                chunks_created=chunks_created,
                duration_ms=duration_ms,
            )
        except Exception as exc:  # noqa: BLE001
            duration_ms = int((time.perf_counter() - start_time) * 1000)
            run = self._ingest_run_repo.complete(
                run.id,
                status="failed",
                documents_processed=documents_processed,
                chunks_created=chunks_created,
                duration_ms=duration_ms,
                error_message=str(exc),
            )
            raise

        return run
