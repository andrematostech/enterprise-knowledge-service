from dataclasses import dataclass
from datetime import datetime, timezone
from uuid import UUID, uuid4

from app.api.routes.ingestion import get_service


@dataclass
class FakeIngestion:
    id: UUID
    knowledge_base_id: UUID
    status: str
    message: str | None
    created_at: datetime


class FakeIngestionService:
    def ingest(self, knowledge_base_id: UUID):
        return FakeIngestion(
            id=uuid4(),
            knowledge_base_id=knowledge_base_id,
            status="completed",
            message=None,
            created_at=datetime.now(timezone.utc),
        )


def test_ingest(client):
    service = FakeIngestionService()
    client.app.dependency_overrides[get_service] = lambda: service

    kb_id = uuid4()
    response = client.post(
        f"/api/v1/knowledge-bases/{kb_id}/ingest",
        headers={"X-API-Key": "test-key"},
    )

    assert response.status_code == 202
    data = response.json()
    assert data["status"] == "completed"
