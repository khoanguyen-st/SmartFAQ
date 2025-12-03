"""merge multiple heads - 2025-12-03 23:32

Revision ID: f19c919bb909
Revises: 71fc97c0b8ce, 41f21e7f1b44
Create Date: 2025-12-03 23:32:58.489957

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f19c919bb909'
down_revision: Union[str, Sequence[str], None] = ('71fc97c0b8ce', '41f21e7f1b44')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
