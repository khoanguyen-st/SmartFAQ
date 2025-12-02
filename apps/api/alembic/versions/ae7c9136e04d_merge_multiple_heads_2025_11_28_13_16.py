"""merge multiple heads - 2025-11-28 13:16

Revision ID: ae7c9136e04d
Revises: d7165892e3a5, f1027a5bd3dd
Create Date: 2025-11-28 13:16:31.978076

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ae7c9136e04d'
down_revision: Union[str, Sequence[str], None] = ('d7165892e3a5', 'f1027a5bd3dd')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass