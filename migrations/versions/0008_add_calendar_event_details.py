"""add calendar event subject and participants

Revision ID: 0008_add_calendar_event_details
Revises: 0007_add_query_log_tokens
Create Date: 2026-03-01
"""

from alembic import op
import sqlalchemy as sa


revision = "0008_add_calendar_event_details"
down_revision = "0007_add_query_log_tokens"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("calendar_events", sa.Column("subject", sa.String(length=255), nullable=True))
    op.add_column("calendar_events", sa.Column("participants", sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column("calendar_events", "participants")
    op.drop_column("calendar_events", "subject")
