"""Add email and phone_number to users

Revision ID: 001_add_user_contact
Revises: 
Create Date: 2025-11-10 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '001_add_user_contact'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add email and phone_number columns to users table
    op.add_column('users', sa.Column('email', sa.String(length=255), nullable=True))
    op.add_column('users', sa.Column('phone_number', sa.String(length=20), nullable=True))
    
    # Create unique constraint for email
    op.create_unique_constraint('uq_users_email', 'users', ['email'])


def downgrade() -> None:
    # Drop unique constraint
    op.drop_constraint('uq_users_email', 'users', type_='unique')
    
    # Remove columns
    op.drop_column('users', 'phone_number')
    op.drop_column('users', 'email')
