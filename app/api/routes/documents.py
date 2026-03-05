from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_settings, require_auth, require_kb_access
from app.models.user import User
from app.repositories.chunk_repository import ChunkRepository
from app.repositories.document_repository import DocumentRepository
from app.repositories.knowledge_base_repository import KnowledgeBaseRepository
from app.models.knowledge_base import KnowledgeBase
from app.schemas.common import Message
from app.schemas.document import DocumentRead, DocumentRegisterRequest
from app.services.document_service import DocumentService
from app.services.vector_store_service import VectorStoreService


router = APIRouter(
    prefix="/knowledge-bases/{knowledge_base_id}/documents",
    tags=["documents"],
    dependencies=[Depends(require_auth)],
)


def get_service(db: Session = Depends(get_db)) -> DocumentService:
    settings = get_settings()
    doc_repo = DocumentRepository(db)
    kb_repo = KnowledgeBaseRepository(db)
    chunk_repo = ChunkRepository(db)
    vector_store = VectorStoreService(settings)
    return DocumentService(doc_repo, kb_repo, chunk_repo, vector_store, settings)


@router.post("", response_model=DocumentRead, status_code=status.HTTP_201_CREATED)
def upload_document(
    knowledge_base_id: UUID,
    file: UploadFile,
    replace_existing: bool = False,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(require_auth),
    service: DocumentService = Depends(get_service),
) -> DocumentRead:
    try:
        require_kb_access(knowledge_base_id, db, current_user, "admin")
        document = service.upload(knowledge_base_id, file, replace_existing=replace_existing)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return DocumentRead.model_validate(document)


@router.post("/register", response_model=DocumentRead, status_code=status.HTTP_201_CREATED)
def register_document(
    knowledge_base_id: UUID,
    payload: DocumentRegisterRequest,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(require_auth),
    service: DocumentService = Depends(get_service),
) -> DocumentRead:
    try:
        require_kb_access(knowledge_base_id, db, current_user, "admin")
        if payload.knowledge_base_id != knowledge_base_id:
            raise ValueError("Knowledge base mismatch")
        document = service.register_local(
            knowledge_base_id=knowledge_base_id,
            relative_path=payload.relative_path,
            content_type=payload.content_type,
            filename=payload.filename,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return DocumentRead.model_validate(document)


@router.get("", response_model=list[DocumentRead])
def list_documents(
    knowledge_base_id: UUID,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(require_auth),
    service: DocumentService = Depends(get_service),
) -> list[DocumentRead]:
    knowledge_base = db.get(KnowledgeBase, knowledge_base_id)
    if knowledge_base is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Knowledge base not found")
    return [DocumentRead.model_validate(item) for item in service.list(knowledge_base_id)]


@router.delete("/{document_id}", response_model=Message)
def delete_document(
    knowledge_base_id: UUID,
    document_id: UUID,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(require_auth),
    service: DocumentService = Depends(get_service),
) -> Message:
    require_kb_access(knowledge_base_id, db, current_user, "admin")
    if not service.delete(knowledge_base_id, document_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    return Message(detail="Deleted")
