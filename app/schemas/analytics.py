from datetime import datetime

from pydantic import BaseModel


class QueryVolumePoint(BaseModel):
    date: str
    count: int
    avg_latency_ms: int | None


class LatencyPoint(BaseModel):
    date: str
    avg_latency_ms: int | None
    p95_latency_ms: int | None


class RecentQueryRead(BaseModel):
    created_at: datetime
    query_text: str | None
    latency_ms: int | None
    retrieved_k: int | None
    retrieved_count: int | None
    error: str | None


class RecentIngestRead(BaseModel):
    created_at: datetime
    finished_at: datetime | None
    status: str
    documents_processed: int
    chunks_created: int
    duration_ms: int | None
    error_message: str | None


class WorkspaceOverviewRead(BaseModel):
    knowledge_bases_count: int
    documents_count: int
    chunks_count: int
    queries_count: int
    avg_latency_ms: int | None
    last_ingest_at: datetime | None
