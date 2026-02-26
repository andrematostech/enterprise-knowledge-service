"""add is_admin to users

Revision ID: 0004_add_is_admin
Revises: 0003_user_profile_fields
Create Date: 2026-02-25 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "0004_add_is_admin"
down_revision = "0003_user_profile_fields"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("is_admin", sa.Boolean(), server_default=sa.text("false"), nullable=False),
    )


def downgrade() -> None:
    op.drop_column("users", "is_admin")
