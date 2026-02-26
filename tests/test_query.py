from uuid import uuid4

from fastapi import HTTPException

from app.api.routes import query as query_route
from app.api.routes.query import get_service
from app.schemas.query import QueryResponse, QuerySource


class FakeRagService:
    def __init__(self) -> None:
        self.last_user_id = None

    def query(self, knowledge_base_id: str, payload, user_id=None):
        self.last_user_id = user_id
        return QueryResponse(
            answer="Answer from docs [1]",
            sources=[
                QuerySource(
                    chunk_id=str(uuid4()),
                    document_id=str(uuid4()),
                    filename="notes.txt",
                    score=0.8,
                    excerpt="Example excerpt",
                )
            ],
        )


def test_query(client, monkeypatch):
    service = FakeRagService()
    client.app.dependency_overrides[get_service] = lambda: service
    client.app.dependency_overrides[query_route.get_db] = lambda: None
    monkeypatch.setattr(query_route, "require_kb_access", lambda *args, **kwargs: None)

    kb_id = uuid4()
    response = client.post(
        f"/api/v1/knowledge-bases/{kb_id}/query",
        headers={"X-API-Key": "test-key"},
        json={"question": "What is EKS?", "top_k": 3},
    )

    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert len(data["sources"]) == 1
    assert service.last_user_id is None


def test_query_rbac_blocks(client, monkeypatch):
    service = FakeRagService()
    client.app.dependency_overrides[get_service] = lambda: service
    client.app.dependency_overrides[query_route.get_db] = lambda: None

    def _deny(*args, **kwargs):
        raise HTTPException(status_code=403, detail="Access denied")

    monkeypatch.setattr(query_route, "require_kb_access", _deny)

    kb_id = uuid4()
    response = client.post(
        f"/api/v1/knowledge-bases/{kb_id}/query",
        headers={"X-API-Key": "test-key"},
        json={"question": "What is EKS?", "top_k": 3},
    )

    assert response.status_code == 403
