"""merge multiple heads - 2025-12-03 16:35

Revision ID: 5a92820537fe
Revises: 71fc97c0b8ce, 8bc81c17c465
Create Date: 2025-12-03 16:35:04.239739

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5a92820537fe'
down_revision: Union[str, Sequence[str], None] = ('71fc97c0b8ce', '8bc81c17c465')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
