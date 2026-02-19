"""add users and messages

Revision ID: 0002_auth_messaging
Revises: 0001_initial
Create Date: 2026-02-19 16:30:00

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0002_auth_messaging"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("full_name", sa.String(length=255), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "messages",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("sender_user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("recipient_user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("scope", sa.String(length=32), nullable=False),
        sa.Column("subject", sa.String(length=255), nullable=True),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("read_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["sender_user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["recipient_user_id"], ["users.id"]),
    )
    op.create_index("ix_messages_sender_user_id", "messages", ["sender_user_id"])
    op.create_index("ix_messages_recipient_user_id", "messages", ["recipient_user_id"])


def downgrade() -> None:
    op.drop_index("ix_messages_recipient_user_id", table_name="messages")
    op.drop_index("ix_messages_sender_user_id", table_name="messages")
    op.drop_table("messages")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
