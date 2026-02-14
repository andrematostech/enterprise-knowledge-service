from uuid import uuid4

from app.api.routes.query import get_service
from app.schemas.query import QueryResponse, QuerySource


class FakeRagService:
    def query(self, knowledge_base_id: str, payload):
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


def test_query(client):
    service = FakeRagService()
    client.app.dependency_overrides[get_service] = lambda: service

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
