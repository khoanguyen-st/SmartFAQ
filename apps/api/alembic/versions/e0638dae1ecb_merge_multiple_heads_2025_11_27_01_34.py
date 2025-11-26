"""merge multiple heads - 2025-11-27 01:34

Revision ID: e0638dae1ecb
Revises: bd43cf121469, dac48aab7df1
Create Date: 2025-11-27 01:34:43.599405

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e0638dae1ecb'
down_revision: Union[str, Sequence[str], None] = ('bd43cf121469', 'dac48aab7df1')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
