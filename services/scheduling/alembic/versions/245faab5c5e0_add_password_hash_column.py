"""add_password_hash_column

Revision ID: 245faab5c5e0
Revises: 098cb23df2c9
Create Date: 2026-06-27 21:22:34.126604

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '245faab5c5e0'
down_revision: Union[str, Sequence[str], None] = '098cb23df2c9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('users', sa.Column('password_hash', sa.String(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('users', 'password_hash')
