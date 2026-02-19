from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_settings, require_auth
from app.repositories.document_repository import DocumentRepository
from app.repositories.knowledge_base_repository import KnowledgeBaseRepository
from app.schemas.common import Message
from app.schemas.document import DocumentRead
from app.services.document_service import DocumentService


router = APIRouter(
    prefix="/knowledge-bases/{knowledge_base_id}/documents",
    tags=["documents"],
    dependencies=[Depends(require_auth)],
)


def get_service(db: Session = Depends(get_db)) -> DocumentService:
    settings = get_settings()
    doc_repo = DocumentRepository(db)
    kb_repo = KnowledgeBaseRepository(db)
    return DocumentService(doc_repo, kb_repo, settings)


@router.post("", response_model=DocumentRead, status_code=status.HTTP_201_CREATED)
def upload_document(
    knowledge_base_id: UUID,
    file: UploadFile,
    service: DocumentService = Depends(get_service),
) -> DocumentRead:
    try:
        document = service.upload(knowledge_base_id, file)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return DocumentRead.model_validate(document)


@router.get("", response_model=list[DocumentRead])
def list_documents(
    knowledge_base_id: UUID,
    service: DocumentService = Depends(get_service),
) -> list[DocumentRead]:
    return [DocumentRead.model_validate(item) for item in service.list(knowledge_base_id)]


@router.delete("/{document_id}", response_model=Message)
def delete_document(
    knowledge_base_id: UUID,
    document_id: UUID,
    service: DocumentService = Depends(get_service),
) -> Message:
    if not service.delete(knowledge_base_id, document_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    return Message(detail="Deleted")
