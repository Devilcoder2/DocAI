"""add_patient_health_columns

Revision ID: 87bb6ada507c
Revises: 245faab5c5e0
Create Date: 2026-06-27 21:46:24.597863

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '87bb6ada507c'
down_revision: Union[str, Sequence[str], None] = '245faab5c5e0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('users', sa.Column('age', sa.Integer(), nullable=True))
    op.add_column('users', sa.Column('weight', sa.Float(), nullable=True))
    op.add_column('users', sa.Column('height', sa.Float(), nullable=True))
    op.add_column('users', sa.Column('gender', sa.String(), nullable=True))
    op.add_column('users', sa.Column('allergies', sa.Text(), nullable=True))
    op.add_column('users', sa.Column('chronic_illnesses', sa.Text(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('users', 'chronic_illnesses')
    op.drop_column('users', 'allergies')
    op.drop_column('users', 'gender')
    op.drop_column('users', 'height')
    op.drop_column('users', 'weight')
    op.drop_column('users', 'age')
