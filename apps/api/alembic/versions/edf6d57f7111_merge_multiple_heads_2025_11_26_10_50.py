"""merge multiple heads - 2025-11-26 10:50

Revision ID: edf6d57f7111
Revises: 709c209cad81, f639d527b5a4
Create Date: 2025-11-26 10:50:11.900990

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'edf6d57f7111'
down_revision: Union[str, Sequence[str], None] = ('709c209cad81', 'f639d527b5a4')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
