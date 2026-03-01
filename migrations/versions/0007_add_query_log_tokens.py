"""add query log token usage

Revision ID: 0007_add_query_log_tokens
Revises: 0006_multi_tenant_telemetry
Create Date: 2026-02-28 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "0007_add_query_log_tokens"
down_revision = "0006_multi_tenant_telemetry"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("query_logs", sa.Column("prompt_tokens", sa.Integer(), nullable=True))
    op.add_column("query_logs", sa.Column("completion_tokens", sa.Integer(), nullable=True))
    op.add_column("query_logs", sa.Column("total_tokens", sa.Integer(), nullable=True))
    op.add_column("query_logs", sa.Column("cost_usd", sa.Float(), nullable=True))


def downgrade() -> None:
    op.drop_column("query_logs", "cost_usd")
    op.drop_column("query_logs", "total_tokens")
    op.drop_column("query_logs", "completion_tokens")
    op.drop_column("query_logs", "prompt_tokens")
