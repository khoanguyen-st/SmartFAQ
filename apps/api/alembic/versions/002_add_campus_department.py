"""Add campus and department fields to users

Revision ID: 002_add_campus_department
Revises: 001_add_user_contact
Create Date: 2025-01-19 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSON


# revision identifiers, used by Alembic.
revision: str = '002_add_campus_department'
down_revision: Union[str, None] = '001_add_user_contact'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add campus and department columns to users table
    op.add_column('users', sa.Column('campus', JSON, nullable=True))
    op.add_column('users', sa.Column('department', JSON, nullable=True))


def downgrade() -> None:
    # Remove campus and department columns
    op.drop_column('users', 'department')
    op.drop_column('users', 'campus')
