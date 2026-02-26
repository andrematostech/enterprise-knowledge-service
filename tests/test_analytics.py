from datetime import datetime, timezone
from uuid import uuid4

from app.api.routes import analytics as analytics_route


class FakeQueryLogRepo:
    def aggregate_volume_by_day(self, knowledge_base_id, days):
        return [{"date": "2026-02-25", "count": 3, "avg_latency_ms": 420}]

    def aggregate_latency_by_day(self, knowledge_base_id, days):
        return [{"date": "2026-02-25", "avg_latency_ms": 420, "p95_latency_ms": 900}]

    def list_recent(self, knowledge_base_id, limit):
        return [
            type(
                "Log",
                (),
                {
                    "created_at": datetime(2026, 2, 25, 10, 0, tzinfo=timezone.utc),
                    "query_text": "What is EKS?",
                    "latency_ms": 420,
                    "retrieved_k": 5,
                    "retrieved_count": 4,
                    "error": None,
                },
            )()
        ]

    def aggregate_workspace_overview(self, user_id, days):
        return {
            "knowledge_bases_count": 2,
            "documents_count": 5,
            "chunks_count": 25,
            "queries_count": 9,
            "avg_latency_ms": 410,
            "last_ingest_at": datetime(2026, 2, 25, 9, 0, tzinfo=timezone.utc),
        }


class FakeIngestRunRepo:
    def list_recent(self, knowledge_base_id, limit):
        return [
            type(
                "Run",
                (),
                {
                    "created_at": datetime(2026, 2, 25, 8, 0, tzinfo=timezone.utc),
                    "finished_at": datetime(2026, 2, 25, 8, 5, tzinfo=timezone.utc),
                    "status": "success",
                    "documents_processed": 2,
                    "chunks_created": 12,
                    "duration_ms": 300000,
                    "error_message": None,
                },
            )()
        ]


def test_query_volume(client, monkeypatch):
    kb_id = uuid4()
    client.app.dependency_overrides[analytics_route.get_query_log_repo] = lambda: FakeQueryLogRepo()
    client.app.dependency_overrides[analytics_route.get_db] = lambda: None
    monkeypatch.setattr(analytics_route, "require_kb_access", lambda *args, **kwargs: None)
    response = client.get(
        f"/api/v1/knowledge-bases/{kb_id}/analytics/query-volume?range=7d&bucket=day",
        headers={"X-API-Key": "test-key"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data[0]["count"] == 3


def test_latency_trend(client, monkeypatch):
    kb_id = uuid4()
    client.app.dependency_overrides[analytics_route.get_query_log_repo] = lambda: FakeQueryLogRepo()
    client.app.dependency_overrides[analytics_route.get_db] = lambda: None
    monkeypatch.setattr(analytics_route, "require_kb_access", lambda *args, **kwargs: None)
    response = client.get(
        f"/api/v1/knowledge-bases/{kb_id}/analytics/latency?range=7d&bucket=day",
        headers={"X-API-Key": "test-key"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data[0]["p95_latency_ms"] == 900


def test_recent_queries(client, monkeypatch):
    kb_id = uuid4()
    client.app.dependency_overrides[analytics_route.get_query_log_repo] = lambda: FakeQueryLogRepo()
    client.app.dependency_overrides[analytics_route.get_db] = lambda: None
    monkeypatch.setattr(analytics_route, "require_kb_access", lambda *args, **kwargs: None)
    response = client.get(
        f"/api/v1/knowledge-bases/{kb_id}/analytics/recent-queries?limit=5",
        headers={"X-API-Key": "test-key"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data[0]["query_text"] == "What is EKS?"


def test_recent_ingests(client, monkeypatch):
    kb_id = uuid4()
    client.app.dependency_overrides[analytics_route.get_ingest_run_repo] = lambda: FakeIngestRunRepo()
    client.app.dependency_overrides[analytics_route.get_db] = lambda: None
    monkeypatch.setattr(analytics_route, "require_kb_access", lambda *args, **kwargs: None)
    response = client.get(
        f"/api/v1/knowledge-bases/{kb_id}/analytics/recent-ingests?limit=5",
        headers={"X-API-Key": "test-key"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data[0]["status"] == "success"


def test_workspace_overview(client):
    client.app.dependency_overrides[analytics_route.get_query_log_repo] = lambda: FakeQueryLogRepo()
    response = client.get(
        "/api/v1/workspace/overview?range=7d",
        headers={"X-API-Key": "test-key"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["knowledge_bases_count"] == 2
