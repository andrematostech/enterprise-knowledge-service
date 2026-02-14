from dataclasses import dataclass
from datetime import datetime, timezone
from uuid import UUID, uuid4

from app.api.routes.documents import get_service


@dataclass
class FakeDocument:
    id: UUID
    knowledge_base_id: UUID
    filename: str
    content_type: str
    size_bytes: int
    created_at: datetime


class FakeDocumentService:
    def __init__(self) -> None:
        self.items: dict[UUID, FakeDocument] = {}

    def upload(self, knowledge_base_id: UUID, upload):
        doc = FakeDocument(
            id=uuid4(),
            knowledge_base_id=knowledge_base_id,
            filename=upload.filename,
            content_type=upload.content_type or "text/plain",
            size_bytes=3,
            created_at=datetime.now(timezone.utc),
        )
        self.items[doc.id] = doc
        return doc

    def list(self, knowledge_base_id: UUID):
        return [item for item in self.items.values() if item.knowledge_base_id == knowledge_base_id]

    def delete(self, knowledge_base_id: UUID, document_id: UUID):
        doc = self.items.get(document_id)
        if not doc or doc.knowledge_base_id != knowledge_base_id:
            return False
        del self.items[document_id]
        return True


def test_upload_document(client):
    service = FakeDocumentService()
    client.app.dependency_overrides[get_service] = lambda: service

    kb_id = uuid4()
    response = client.post(
        f"/api/v1/knowledge-bases/{kb_id}/documents",
        headers={"X-API-Key": "test-key"},
        files={"file": ("notes.txt", b"abc", "text/plain")},
    )

    assert response.status_code == 201
    data = response.json()
    assert data["filename"] == "notes.txt"


def test_delete_document(client):
    service = FakeDocumentService()
    client.app.dependency_overrides[get_service] = lambda: service

    kb_id = uuid4()
    upload = client.post(
        f"/api/v1/knowledge-bases/{kb_id}/documents",
        headers={"X-API-Key": "test-key"},
        files={"file": ("notes.txt", b"abc", "text/plain")},
    )
    doc_id = upload.json()["id"]

    response = client.delete(
        f"/api/v1/knowledge-bases/{kb_id}/documents/{doc_id}",
        headers={"X-API-Key": "test-key"},
    )

    assert response.status_code == 200
    assert response.json()["detail"] == "Deleted"
