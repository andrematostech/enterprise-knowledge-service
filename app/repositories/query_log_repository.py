from datetime import datetime, timedelta
from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.chunk import Chunk
from app.models.document import Document
from app.models.ingest_run import IngestRun
from app.models.knowledge_base import KnowledgeBase
from app.models.knowledge_base_member import KnowledgeBaseMember
from app.models.query_log import QueryLog


class QueryLogRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def create(self, log: QueryLog) -> QueryLog:
        self._db.add(log)
        self._db.commit()
        self._db.refresh(log)
        return log

    def list_recent(self, knowledge_base_id: UUID, limit: int) -> list[QueryLog]:
        return (
            self._db.execute(
                select(QueryLog)
                .where(QueryLog.knowledge_base_id == knowledge_base_id)
                .order_by(QueryLog.created_at.desc())
                .limit(limit)
            )
            .scalars()
            .all()
        )

    def aggregate_volume_by_day(self, knowledge_base_id: UUID, days: int) -> list[dict]:
        start = datetime.utcnow() - timedelta(days=days)
        bucket = func.date_trunc("day", QueryLog.created_at).label("bucket")
        stmt = (
            select(
                bucket,
                func.count(QueryLog.id).label("count"),
                func.avg(QueryLog.latency_ms).label("avg_latency_ms"),
            )
            .where(QueryLog.knowledge_base_id == knowledge_base_id, QueryLog.created_at >= start)
            .group_by(bucket)
            .order_by(bucket)
        )
        rows = self._db.execute(stmt).all()
        return [
            {
                "date": row.bucket.date().isoformat(),
                "count": int(row.count or 0),
                "avg_latency_ms": int(row.avg_latency_ms) if row.avg_latency_ms is not None else None,
            }
            for row in rows
        ]

    def aggregate_latency_by_day(self, knowledge_base_id: UUID, days: int) -> list[dict]:
        start = datetime.utcnow() - timedelta(days=days)
        bucket = func.date_trunc("day", QueryLog.created_at).label("bucket")
        p95 = func.percentile_cont(0.95).within_group(QueryLog.latency_ms).label("p95_latency_ms")
        stmt = (
            select(
                bucket,
                func.avg(QueryLog.latency_ms).label("avg_latency_ms"),
                p95,
            )
            .where(
                QueryLog.knowledge_base_id == knowledge_base_id,
                QueryLog.created_at >= start,
                QueryLog.latency_ms.isnot(None),
            )
            .group_by(bucket)
            .order_by(bucket)
        )
        rows = self._db.execute(stmt).all()
        return [
            {
                "date": row.bucket.date().isoformat(),
                "avg_latency_ms": int(row.avg_latency_ms) if row.avg_latency_ms is not None else None,
                "p95_latency_ms": int(row.p95_latency_ms) if row.p95_latency_ms is not None else None,
            }
            for row in rows
        ]

    def aggregate_workspace_overview(self, user_id: UUID | None, days: int) -> dict:
        kb_stmt = select(KnowledgeBase.id)
        if user_id:
            kb_stmt = (
                kb_stmt.outerjoin(
                    KnowledgeBaseMember,
                    KnowledgeBaseMember.knowledge_base_id == KnowledgeBase.id,
                )
                .where(
                    or_(
                        KnowledgeBase.owner_user_id == user_id,
                        KnowledgeBaseMember.user_id == user_id,
                    )
                )
                .distinct()
            )
        kb_ids = [row[0] for row in self._db.execute(kb_stmt).all()]

        if not kb_ids:
            return {
                "knowledge_bases_count": 0,
                "documents_count": 0,
                "chunks_count": 0,
                "queries_count": 0,
                "avg_latency_ms": None,
                "last_ingest_at": None,
            }

        documents_count = (
            self._db.execute(
                select(func.count(Document.id)).where(Document.knowledge_base_id.in_(kb_ids))
            )
            .scalar()
            or 0
        )
        chunks_count = (
            self._db.execute(
                select(func.count(Chunk.id))
                .join(Document, Chunk.document_id == Document.id)
                .where(Document.knowledge_base_id.in_(kb_ids))
            )
            .scalar()
            or 0
        )

        start = datetime.utcnow() - timedelta(days=days)
        query_row = self._db.execute(
            select(
                func.count(QueryLog.id).label("queries_count"),
                func.avg(QueryLog.latency_ms).label("avg_latency_ms"),
            ).where(QueryLog.knowledge_base_id.in_(kb_ids), QueryLog.created_at >= start)
        ).one()

        last_ingest_at = self._db.execute(
            select(func.max(IngestRun.finished_at)).where(
                IngestRun.knowledge_base_id.in_(kb_ids),
                IngestRun.finished_at.isnot(None),
            )
        ).scalar()

        return {
            "knowledge_bases_count": len(kb_ids),
            "documents_count": int(documents_count),
            "chunks_count": int(chunks_count),
            "queries_count": int(query_row.queries_count or 0),
            "avg_latency_ms": int(query_row.avg_latency_ms) if query_row.avg_latency_ms is not None else None,
            "last_ingest_at": last_ingest_at,
        }
