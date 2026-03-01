from dataclasses import dataclass
from datetime import datetime, timezone
from uuid import UUID, uuid4

from app.api.routes import ingestion as ingestion_route
from app.api.routes.ingestion import get_service


@dataclass
class FakeIngestion:
    id: UUID
    knowledge_base_id: UUID
    user_id: UUID | None
    status: str
    error_message: str | None
    documents_processed: int
    chunks_created: int
    duration_ms: int | None
    created_at: datetime
    finished_at: datetime | None


class FakeIngestionService:
    def ingest(self, knowledge_base_id: UUID, user_id: UUID | None = None):
        return FakeIngestion(
            id=uuid4(),
            knowledge_base_id=knowledge_base_id,
            user_id=user_id,
            status="completed",
            error_message=None,
            documents_processed=1,
            chunks_created=3,
            duration_ms=123,
            created_at=datetime.now(timezone.utc),
            finished_at=datetime.now(timezone.utc),
        )


def test_ingest(client, monkeypatch):
    service = FakeIngestionService()
    client.app.dependency_overrides[get_service] = lambda: service
    monkeypatch.setattr(ingestion_route, "require_kb_access", lambda *args, **kwargs: None)

    kb_id = uuid4()
    response = client.post(
        f"/api/v1/knowledge-bases/{kb_id}/ingest",
        headers={"X-API-Key": "test-key"},
    )

    assert response.status_code == 202
    data = response.json()
    assert data["status"] == "completed"
