from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_auth, require_kb_access
from app.models.user import User
from app.repositories.ingest_run_repository import IngestRunRepository
from app.repositories.query_log_repository import QueryLogRepository
from app.schemas.analytics import (
    LatencyPoint,
    QueryVolumePoint,
    RecentIngestRead,
    RecentQueryRead,
    WorkspaceOverviewRead,
)


router = APIRouter(tags=["analytics"])


def get_query_log_repo(db: Session = Depends(get_db)) -> QueryLogRepository:
    return QueryLogRepository(db)


def get_ingest_run_repo(db: Session = Depends(get_db)) -> IngestRunRepository:
    return IngestRunRepository(db)


def parse_range_days(range_str: str) -> int:
    if not range_str:
        return 7
    if range_str.endswith("d") and range_str[:-1].isdigit():
        return int(range_str[:-1])
    raise HTTPException(status_code=400, detail="Invalid range format. Use Nd, e.g. 7d.")


@router.get(
    "/knowledge-bases/{knowledge_base_id}/analytics/query-volume",
    response_model=list[QueryVolumePoint],
)
def query_volume(
    knowledge_base_id: UUID,
    range: str = Query(default="7d"),
    bucket: str = Query(default="day"),
    db: Session = Depends(get_db),
    current_user: User | None = Depends(require_auth),
    query_log_repo: QueryLogRepository = Depends(get_query_log_repo),
) -> list[QueryVolumePoint]:
    require_kb_access(knowledge_base_id, db, current_user, minimum_role="viewer")
    if bucket != "day":
        raise HTTPException(status_code=400, detail="Only day bucket is supported.")
    days = parse_range_days(range)
    points = query_log_repo.aggregate_volume_by_day(knowledge_base_id, days)
    return [QueryVolumePoint(**point) for point in points]


@router.get(
    "/knowledge-bases/{knowledge_base_id}/analytics/latency",
    response_model=list[LatencyPoint],
)
def latency_trend(
    knowledge_base_id: UUID,
    range: str = Query(default="7d"),
    bucket: str = Query(default="day"),
    db: Session = Depends(get_db),
    current_user: User | None = Depends(require_auth),
    query_log_repo: QueryLogRepository = Depends(get_query_log_repo),
) -> list[LatencyPoint]:
    require_kb_access(knowledge_base_id, db, current_user, minimum_role="viewer")
    if bucket != "day":
        raise HTTPException(status_code=400, detail="Only day bucket is supported.")
    days = parse_range_days(range)
    points = query_log_repo.aggregate_latency_by_day(knowledge_base_id, days)
    return [LatencyPoint(**point) for point in points]


@router.get(
    "/knowledge-bases/{knowledge_base_id}/analytics/recent-queries",
    response_model=list[RecentQueryRead],
)
def recent_queries(
    knowledge_base_id: UUID,
    limit: int = Query(default=10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User | None = Depends(require_auth),
    query_log_repo: QueryLogRepository = Depends(get_query_log_repo),
) -> list[RecentQueryRead]:
    require_kb_access(knowledge_base_id, db, current_user, minimum_role="viewer")
    logs = query_log_repo.list_recent(knowledge_base_id, limit)
    return [
        RecentQueryRead(
            created_at=log.created_at,
            query_text=log.query_text,
            latency_ms=log.latency_ms,
            retrieved_k=log.retrieved_k,
            retrieved_count=log.retrieved_count,
            error=log.error,
        )
        for log in logs
    ]


@router.get(
    "/knowledge-bases/{knowledge_base_id}/analytics/recent-ingests",
    response_model=list[RecentIngestRead],
)
def recent_ingests(
    knowledge_base_id: UUID,
    limit: int = Query(default=10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User | None = Depends(require_auth),
    ingest_run_repo: IngestRunRepository = Depends(get_ingest_run_repo),
) -> list[RecentIngestRead]:
    require_kb_access(knowledge_base_id, db, current_user, minimum_role="viewer")
    runs = ingest_run_repo.list_recent(knowledge_base_id, limit)
    return [
        RecentIngestRead(
            created_at=run.created_at,
            finished_at=run.finished_at,
            status=run.status,
            documents_processed=run.documents_processed,
            chunks_created=run.chunks_created,
            duration_ms=run.duration_ms,
            error_message=run.error_message,
        )
        for run in runs
    ]


@router.get("/workspace/overview", response_model=WorkspaceOverviewRead)
def workspace_overview(
    range: str = Query(default="7d"),
    current_user: User | None = Depends(require_auth),
    query_log_repo: QueryLogRepository = Depends(get_query_log_repo),
) -> WorkspaceOverviewRead:
    days = parse_range_days(range)
    overview = query_log_repo.aggregate_workspace_overview(current_user.id if current_user else None, days)
    return WorkspaceOverviewRead(**overview)
