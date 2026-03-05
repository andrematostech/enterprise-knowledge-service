"""Add document source and status fields.

Revision ID: 0009_add_document_source_status
Revises: 0008_add_calendar_event_details
Create Date: 2026-03-04
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "0009_add_document_source_status"
down_revision = "0008_add_calendar_event_details"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "documents",
        sa.Column("source", sa.String(length=32), nullable=False, server_default="upload"),
    )
    op.add_column(
        "documents",
        sa.Column("status", sa.String(length=32), nullable=False, server_default="ready"),
    )


def downgrade() -> None:
    op.drop_column("documents", "status")
    op.drop_column("documents", "source")
