"""multi tenant + telemetry

Revision ID: 0006_multi_tenant_telemetry
Revises: 0005_add_calendar_events
Create Date: 2026-02-26 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "0006_multi_tenant_telemetry"
down_revision = "0005_add_calendar_events"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "knowledge_bases",
        sa.Column("owner_user_id", sa.dialects.postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_index("ix_knowledge_bases_owner_user_id", "knowledge_bases", ["owner_user_id"])
    op.create_foreign_key(
        "fk_knowledge_bases_owner_user_id",
        "knowledge_bases",
        "users",
        ["owner_user_id"],
        ["id"],
        ondelete="SET NULL",
    )

    op.create_table(
        "knowledge_base_members",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("knowledge_base_id", sa.dialects.postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", sa.dialects.postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("role", sa.String(length=16), nullable=False, server_default="member"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_kb_members_kb_id", "knowledge_base_members", ["knowledge_base_id"])
    op.create_index("ix_kb_members_user_id", "knowledge_base_members", ["user_id"])
    op.create_foreign_key(
        "fk_kb_members_kb_id",
        "knowledge_base_members",
        "knowledge_bases",
        ["knowledge_base_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_foreign_key(
        "fk_kb_members_user_id",
        "knowledge_base_members",
        "users",
        ["user_id"],
        ["id"],
        ondelete="CASCADE",
    )

    op.add_column("documents", sa.Column("content_hash", sa.String(length=64), nullable=True))
    op.add_column("documents", sa.Column("last_ingested_at", sa.DateTime(timezone=True), nullable=True))

    op.create_table(
        "ingest_runs",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("knowledge_base_id", sa.dialects.postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", sa.dialects.postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("documents_processed", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("chunks_created", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("duration_ms", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_ingest_runs_kb_id", "ingest_runs", ["knowledge_base_id"])
    op.create_index("ix_ingest_runs_user_id", "ingest_runs", ["user_id"])
    op.create_foreign_key(
        "fk_ingest_runs_kb_id",
        "ingest_runs",
        "knowledge_bases",
        ["knowledge_base_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_foreign_key(
        "fk_ingest_runs_user_id",
        "ingest_runs",
        "users",
        ["user_id"],
        ["id"],
        ondelete="SET NULL",
    )

    op.create_table(
        "query_logs",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("knowledge_base_id", sa.dialects.postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", sa.dialects.postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("query_text", sa.Text(), nullable=True),
        sa.Column("latency_ms", sa.Integer(), nullable=True),
        sa.Column("embed_ms", sa.Integer(), nullable=True),
        sa.Column("retrieve_ms", sa.Integer(), nullable=True),
        sa.Column("generate_ms", sa.Integer(), nullable=True),
        sa.Column("retrieved_k", sa.Integer(), nullable=True),
        sa.Column("retrieved_count", sa.Integer(), nullable=True),
        sa.Column("model", sa.String(length=128), nullable=True),
        sa.Column("embedding_model", sa.String(length=128), nullable=True),
        sa.Column("vector_db", sa.String(length=64), nullable=True),
        sa.Column("error", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_query_logs_kb_id", "query_logs", ["knowledge_base_id"])
    op.create_index("ix_query_logs_user_id", "query_logs", ["user_id"])
    op.create_foreign_key(
        "fk_query_logs_kb_id",
        "query_logs",
        "knowledge_bases",
        ["knowledge_base_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_foreign_key(
        "fk_query_logs_user_id",
        "query_logs",
        "users",
        ["user_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_index("ix_query_logs_user_id", table_name="query_logs")
    op.drop_index("ix_query_logs_kb_id", table_name="query_logs")
    op.drop_table("query_logs")

    op.drop_index("ix_ingest_runs_user_id", table_name="ingest_runs")
    op.drop_index("ix_ingest_runs_kb_id", table_name="ingest_runs")
    op.drop_table("ingest_runs")

    op.drop_column("documents", "last_ingested_at")
    op.drop_column("documents", "content_hash")

    op.drop_index("ix_kb_members_user_id", table_name="knowledge_base_members")
    op.drop_index("ix_kb_members_kb_id", table_name="knowledge_base_members")
    op.drop_table("knowledge_base_members")

    op.drop_constraint("fk_knowledge_bases_owner_user_id", "knowledge_bases", type_="foreignkey")
    op.drop_index("ix_knowledge_bases_owner_user_id", table_name="knowledge_bases")
    op.drop_column("knowledge_bases", "owner_user_id")
