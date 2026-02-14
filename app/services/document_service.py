import os
from uuid import UUID

from fastapi import UploadFile

from app.core.config import Settings
from app.models.document import Document
from app.repositories.document_repository import DocumentRepository
from app.repositories.knowledge_base_repository import KnowledgeBaseRepository
from app.utils.files import ensure_directory, sanitize_filename, save_upload_file


class DocumentService:
    def __init__(
        self,
        document_repo: DocumentRepository,
        knowledge_base_repo: KnowledgeBaseRepository,
        settings: Settings,
    ) -> None:
        self._document_repo = document_repo
        self._knowledge_base_repo = knowledge_base_repo
        self._settings = settings

    def upload(self, knowledge_base_id: UUID, upload: UploadFile) -> Document:
        knowledge_base = self._knowledge_base_repo.get(knowledge_base_id)
        if not knowledge_base:
            raise ValueError("Knowledge base not found")

        allowed = {ext.strip().lower() for ext in self._settings.allowed_file_types.split(",") if ext.strip()}
        filename = sanitize_filename(upload.filename or "document")
        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
        if ext not in allowed:
            raise ValueError("File type not allowed")

        max_bytes = self._settings.file_size_limit_mb * 1024 * 1024
        kb_folder = os.path.join(self._settings.storage_path, str(knowledge_base_id))
        ensure_directory(kb_folder)

        document = Document(
            knowledge_base_id=knowledge_base_id,
            filename=filename,
            content_type=upload.content_type or "application/octet-stream",
            storage_path="",
            size_bytes=0,
        )
        storage_filename = f"{document.id}_{filename}"
        storage_path = os.path.join(kb_folder, storage_filename)

        size_bytes = save_upload_file(upload, storage_path, max_bytes)
        document.storage_path = storage_path
        document.size_bytes = size_bytes

        return self._document_repo.create(document)

    def list(self, knowledge_base_id: UUID) -> list[Document]:
        return self._document_repo.list_by_knowledge_base(knowledge_base_id)

    def delete(self, knowledge_base_id: UUID, document_id: UUID) -> bool:
        document = self._document_repo.get(document_id)
        if not document:
            return False
        if document.knowledge_base_id != knowledge_base_id:
            return False

        try:
            if os.path.exists(document.storage_path):
                os.remove(document.storage_path)
        except OSError:
            pass

        self._document_repo.delete(document)
        return True
