import os
import uuid
from pathlib import Path
from uuid import UUID

from fastapi import UploadFile

from app.core.config import Settings
from app.models.document import Document
from app.repositories.chunk_repository import ChunkRepository
from app.repositories.document_repository import DocumentRepository
from app.repositories.knowledge_base_repository import KnowledgeBaseRepository
from app.services.vector_store_service import VectorStoreService
from app.utils.files import ensure_directory, sanitize_filename, save_upload_file


class DocumentService:
    def __init__(
        self,
        document_repo: DocumentRepository,
        knowledge_base_repo: KnowledgeBaseRepository,
        chunk_repo: ChunkRepository,
        vector_store: VectorStoreService,
        settings: Settings,
    ) -> None:
        self._document_repo = document_repo
        self._knowledge_base_repo = knowledge_base_repo
        self._chunk_repo = chunk_repo
        self._vector_store = vector_store
        self._settings = settings

    def upload(self, knowledge_base_id: UUID, upload: UploadFile, replace_existing: bool = False) -> Document:
        knowledge_base = self._knowledge_base_repo.get(knowledge_base_id)
        if not knowledge_base:
            raise ValueError("Knowledge base not found")

        allowed = {ext.strip().lower() for ext in self._settings.allowed_file_types.split(",") if ext.strip()}
        filename = sanitize_filename(upload.filename or "document")
        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
        if ext not in allowed:
            raise ValueError("File type not allowed")

        existing = self._document_repo.list_by_filename(knowledge_base_id, filename)
        if existing:
            if not replace_existing:
                raise ValueError("Document with the same filename already exists")
            # Replace flow: remove existing chunks/vectors + storage blobs before re-upload.
            for item in existing:
                chunk_ids = self._chunk_repo.list_ids_by_document(item.id)
                if chunk_ids:
                    self._vector_store.delete_embeddings(str(knowledge_base_id), ids=chunk_ids)
                    self._chunk_repo.delete_by_document(item.id)
                try:
                    if os.path.exists(item.storage_path):
                        os.remove(item.storage_path)
                except OSError:
                    pass
            self._document_repo.delete_by_filename(knowledge_base_id, filename)

        max_bytes = self._settings.file_size_limit_mb * 1024 * 1024
        kb_folder = os.path.join(self._settings.storage_path, str(knowledge_base_id))
        ensure_directory(kb_folder)

        document_id = uuid.uuid4()
        document = Document(
            id=document_id,
            knowledge_base_id=knowledge_base_id,
            filename=filename,
            content_type=upload.content_type or "application/octet-stream",
            storage_path="",
            size_bytes=0,
            source="upload",
            status="ready",
        )
        storage_filename = f"{document_id}_{filename}"
        storage_path = os.path.join(kb_folder, storage_filename)

        size_bytes = save_upload_file(upload, storage_path, max_bytes)
        document.storage_path = storage_path
        document.size_bytes = size_bytes

        return self._document_repo.create(document)

    def register_local(
        self,
        knowledge_base_id: UUID,
        relative_path: str,
        content_type: str | None = None,
        filename: str | None = None,
    ) -> Document:
        knowledge_base = self._knowledge_base_repo.get(knowledge_base_id)
        if not knowledge_base:
            raise ValueError("Knowledge base not found")
        if not relative_path or not relative_path.strip():
            raise ValueError("Relative path is required")

        relative_path = relative_path.strip()
        if Path(relative_path).is_absolute():
            raise ValueError("Relative path must not be absolute")

        storage_root = Path(self._settings.storage_path).resolve()
        target_path = (storage_root / relative_path).resolve()
        if storage_root != target_path and storage_root not in target_path.parents:
            raise ValueError("Path must be inside storage directory")
        if not target_path.exists() or not target_path.is_file():
            raise ValueError("File not found")

        ext = target_path.suffix.lower().lstrip(".")
        if ext not in {"csv", "txt"}:
            raise ValueError("Only CSV and TXT files can be registered")

        resolved_content_type = content_type or ("text/csv" if ext == "csv" else "text/plain")
        if resolved_content_type not in {"text/csv", "text/plain"}:
            raise ValueError("Only CSV and TXT files can be registered")

        resolved_filename = filename.strip() if filename else target_path.name
        if not resolved_filename:
            raise ValueError("Filename is required")

        existing = self._document_repo.list_by_filename(knowledge_base_id, resolved_filename)
        if existing:
            raise ValueError("Document with the same filename already exists")

        size_bytes = target_path.stat().st_size
        document = Document(
            id=uuid.uuid4(),
            knowledge_base_id=knowledge_base_id,
            filename=resolved_filename,
            content_type=resolved_content_type,
            storage_path=str(target_path),
            size_bytes=size_bytes,
            source="local_registered",
            status="ready",
        )
        return self._document_repo.create(document)

    def list(self, knowledge_base_id: UUID) -> list[Document]:
        return self._document_repo.list_by_knowledge_base(knowledge_base_id)

    def delete(self, knowledge_base_id: UUID, document_id: UUID) -> bool:
        document = self._document_repo.get(document_id)
        if not document:
            return False
        if document.knowledge_base_id != knowledge_base_id:
            return False

        chunk_ids = self._chunk_repo.list_ids_by_document(document.id)
        if chunk_ids:
            self._vector_store.delete_embeddings(str(knowledge_base_id), ids=chunk_ids)
            self._chunk_repo.delete_by_document(document.id)

        try:
            if os.path.exists(document.storage_path):
                os.remove(document.storage_path)
        except OSError:
            pass

        self._document_repo.delete(document)
        return True
