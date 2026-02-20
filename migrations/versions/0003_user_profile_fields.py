"""add user profile fields

Revision ID: 0003_user_profile_fields
Revises: 0002_auth_messaging
Create Date: 2026-02-19
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "0003_user_profile_fields"
down_revision = "0002_auth_messaging"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("position", sa.String(length=120), nullable=True))
    op.add_column("users", sa.Column("avatar_url", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "avatar_url")
    op.drop_column("users", "position")
