from dataclasses import dataclass
from datetime import datetime, timezone
from uuid import UUID, uuid4

from app.api.routes.knowledge_bases import get_service
from app.schemas.knowledge_base import KnowledgeBaseCreate


@dataclass
class FakeKnowledgeBase:
    id: UUID
    name: str
    description: str | None
    created_at: datetime


class FakeKnowledgeBaseService:
    def __init__(self) -> None:
        self.items: dict[UUID, FakeKnowledgeBase] = {}

    def create(self, payload: KnowledgeBaseCreate) -> FakeKnowledgeBase:
        kb = FakeKnowledgeBase(uuid4(), payload.name, payload.description, datetime.now(timezone.utc))
        self.items[kb.id] = kb
        return kb

    def list(self):
        return list(self.items.values())

    def get(self, knowledge_base_id: UUID):
        return self.items.get(knowledge_base_id)

    def delete(self, knowledge_base_id: UUID):
        return self.items.pop(knowledge_base_id, None) is not None


def test_create_knowledge_base(client):
    service = FakeKnowledgeBaseService()
    client.app.dependency_overrides[get_service] = lambda: service

    response = client.post(
        "/api/v1/knowledge-bases",
        headers={"X-API-Key": "test-key"},
        json={"name": "Engineering", "description": "Docs"},
    )

    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Engineering"
    assert data["description"] == "Docs"


def test_list_knowledge_bases(client):
    service = FakeKnowledgeBaseService()
    client.app.dependency_overrides[get_service] = lambda: service

    client.post(
        "/api/v1/knowledge-bases",
        headers={"X-API-Key": "test-key"},
        json={"name": "Engineering", "description": "Docs"},
    )

    response = client.get("/api/v1/knowledge-bases", headers={"X-API-Key": "test-key"})
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "Engineering"
