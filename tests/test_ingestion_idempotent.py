from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from io import BytesIO
from typing import Iterable
from uuid import UUID, uuid4

from fastapi import UploadFile

from app.core.config import Settings
from app.models.chunk import Chunk
from app.models.document import Document
from app.services.document_service import DocumentService
from app.services.ingestion_service import IngestionService


@dataclass
class FakeKnowledgeBase:
    id: UUID
    name: str = "KB"


class FakeKnowledgeBaseRepo:
    def __init__(self, items: Iterable[FakeKnowledgeBase]) -> None:
        self.items = {item.id: item for item in items}

    def get(self, knowledge_base_id: UUID):
        return self.items.get(knowledge_base_id)


class FakeDocumentRepo:
    def __init__(self) -> None:
        self.items: dict[UUID, Document] = {}

    def create(self, document: Document) -> Document:
        self.items[document.id] = document
        return document

    def get(self, document_id: UUID) -> Document | None:
        return self.items.get(document_id)

    def list_by_knowledge_base(self, knowledge_base_id: UUID) -> list[Document]:
        return [doc for doc in self.items.values() if doc.knowledge_base_id == knowledge_base_id]

    def list_by_filename(self, knowledge_base_id: UUID, filename: str) -> list[Document]:
        return [
            doc
            for doc in self.items.values()
            if doc.knowledge_base_id == knowledge_base_id and doc.filename == filename
        ]

    def delete_by_filename(self, knowledge_base_id: UUID, filename: str) -> None:
        for doc_id in [
            doc.id
            for doc in self.items.values()
            if doc.knowledge_base_id == knowledge_base_id and doc.filename == filename
        ]:
            self.items.pop(doc_id, None)

    def delete(self, document: Document) -> None:
        self.items.pop(document.id, None)

    def update_ingestion_state(self, document_id: UUID, content_hash: str, last_ingested_at: datetime) -> None:
        doc = self.items.get(document_id)
        if doc:
            doc.content_hash = content_hash
            doc.last_ingested_at = last_ingested_at


class FakeChunkRepo:
    def __init__(self) -> None:
        self.by_id: dict[UUID, Chunk] = {}
        self.by_document: dict[UUID, list[Chunk]] = {}

    def create_many(self, chunks: list[Chunk]) -> None:
        for chunk in chunks:
            self.by_id[chunk.id] = chunk
            self.by_document.setdefault(chunk.document_id, []).append(chunk)

    def list_ids_by_document(self, document_id: UUID) -> list[UUID]:
        return [chunk.id for chunk in self.by_document.get(document_id, [])]

    def delete_by_document(self, document_id: UUID) -> None:
        for chunk in self.by_document.get(document_id, []):
            self.by_id.pop(chunk.id, None)
        self.by_document.pop(document_id, None)

    def count_by_document(self, document_id: UUID) -> int:
        return len(self.by_document.get(document_id, []))


@dataclass
class FakeIngestRun:
    id: UUID
    knowledge_base_id: UUID
    status: str
    documents_processed: int
    chunks_created: int
    duration_ms: int | None
    error_message: str | None
    created_at: datetime


class FakeIngestRunRepo:
    def __init__(self) -> None:
        self.items: dict[UUID, FakeIngestRun] = {}

    def create(self, knowledge_base_id: UUID, user_id: UUID | None) -> FakeIngestRun:
        run = FakeIngestRun(
            id=uuid4(),
            knowledge_base_id=knowledge_base_id,
            status="running",
            documents_processed=0,
            chunks_created=0,
            duration_ms=None,
            error_message=None,
            created_at=datetime.now(timezone.utc),
        )
        self.items[run.id] = run
        return run

    def complete(
        self,
        run_id: UUID,
        status: str,
        documents_processed: int,
        chunks_created: int,
        duration_ms: int,
        error_message: str | None = None,
    ) -> FakeIngestRun:
        run = self.items[run_id]
        run.status = status
        run.documents_processed = documents_processed
        run.chunks_created = chunks_created
        run.duration_ms = duration_ms
        run.error_message = error_message
        return run

    def list(self) -> list[FakeIngestRun]:
        return list(self.items.values())


class FakeOpenAIService:
    def embed_texts(self, texts: list[str]) -> list[list[float]]:
        return [[0.1, 0.2, 0.3] for _ in texts]


class FakeVectorStore:
    def __init__(self) -> None:
        self.ids_by_kb: dict[str, set[UUID]] = {}
        self.add_calls: list[list[UUID]] = []
        self.delete_calls: list[list[UUID]] = []

    def add_embeddings(self, knowledge_base_id: str, chunks: list[Chunk], embeddings, filename: str) -> None:
        ids = [chunk.id for chunk in chunks]
        self.add_calls.append(ids)
        self.ids_by_kb.setdefault(knowledge_base_id, set()).update(ids)

    def delete_embeddings(self, knowledge_base_id: str, ids: list[UUID]) -> None:
        self.delete_calls.append(ids)
        store = self.ids_by_kb.setdefault(knowledge_base_id, set())
        for chunk_id in ids:
            store.discard(chunk_id)

    def get_ids(self, knowledge_base_id: UUID) -> set[UUID]:
        return set(self.ids_by_kb.get(str(knowledge_base_id), set()))


def test_ingestion_idempotent_and_delete_cleans(tmp_path):
    settings = Settings(storage_path=str(tmp_path), allowed_file_types="txt")
    kb_id = uuid4()

    kb_repo = FakeKnowledgeBaseRepo([FakeKnowledgeBase(id=kb_id)])
    document_repo = FakeDocumentRepo()
    chunk_repo = FakeChunkRepo()
    ingest_run_repo = FakeIngestRunRepo()
    openai = FakeOpenAIService()
    vector_store = FakeVectorStore()

    document_service = DocumentService(document_repo, kb_repo, chunk_repo, vector_store, settings)

    upload = UploadFile(
        filename="notes.txt",
        file=BytesIO(b"hello world\nhello kivo\n"),
        content_type="text/plain",
    )
    document = document_service.upload(kb_id, upload)

    ingestion_service = IngestionService(
        settings,
        kb_repo,
        document_repo,
        chunk_repo,
        ingest_run_repo,
        openai,
        vector_store,
    )

    # First ingest
    ingestion_service.ingest(kb_id)
    chunk_ids_first = chunk_repo.list_ids_by_document(document.id)
    vector_ids_first = vector_store.get_ids(kb_id)

    assert chunk_ids_first
    assert vector_ids_first
    assert set(chunk_ids_first) == vector_ids_first
    assert chunk_repo.count_by_document(document.id) == len(chunk_ids_first)

    # Second ingest (idempotent: no duplicates)
    ingestion_service.ingest(kb_id)
    chunk_ids_second = chunk_repo.list_ids_by_document(document.id)
    vector_ids_second = vector_store.get_ids(kb_id)

    assert chunk_ids_second == chunk_ids_first
    assert len(chunk_ids_second) == len(chunk_ids_first)
    assert vector_ids_second == vector_ids_first

    # Optional: prove two ingest runs happened (if service always creates runs)
    assert len(ingest_run_repo.list()) == 2

    # Delete cleans chunks + vectors + document
    deleted = document_service.delete(kb_id, document.id)

    assert deleted is True
    assert chunk_repo.list_ids_by_document(document.id) == []
    assert vector_store.get_ids(kb_id) == set()
    assert document_repo.get(document.id) is None

    # Ensure vector delete was called with the correct IDs
    assert vector_store.delete_calls
    assert set(vector_store.delete_calls[-1]) == set(chunk_ids_first)
