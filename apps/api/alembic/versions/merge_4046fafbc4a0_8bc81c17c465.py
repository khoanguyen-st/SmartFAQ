"""merge migration heads

Revision ID: 41f21e7f1b44
Revises: 4046fafbc4a0, 8bc81c17c465
Create Date: 2025-01-27 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '41f21e7f1b44'
down_revision: Union[str, Sequence[str], None] = ('4046fafbc4a0', '8bc81c17c465')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass

