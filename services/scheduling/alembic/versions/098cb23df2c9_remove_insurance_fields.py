"""remove_insurance_fields

Revision ID: 098cb23df2c9
Revises: b46b27d35cb5
Create Date: 2026-06-27 17:54:53.903102

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '098cb23df2c9'
down_revision: Union[str, Sequence[str], None] = 'b46b27d35cb5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Drop columns from appointments using batch operations for SQLite compatibility
    with op.batch_alter_table('appointments') as batch_op:
        batch_op.drop_column('insurance_carrier')
        batch_op.drop_column('insurance_policy_number')
        batch_op.drop_column('insurance_plan')
        
    # Drop column from doctors
    with op.batch_alter_table('doctors') as batch_op:
        batch_op.drop_column('accepted_insurances')


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('doctors') as batch_op:
        batch_op.add_column(sa.Column('accepted_insurances', sa.JSON(), nullable=True))

    with op.batch_alter_table('appointments') as batch_op:
        batch_op.add_column(sa.Column('insurance_carrier', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('insurance_plan', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('insurance_policy_number', sa.String(), nullable=True))
