"""merge multiple heads - 2025-12-03 23:42

Revision ID: 376369171de3
Revises: 06ea341d33b0, 71fc97c0b8ce
Create Date: 2025-12-03 23:42:40.116497

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '376369171de3'
down_revision: Union[str, Sequence[str], None] = ('06ea341d33b0', '71fc97c0b8ce')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
