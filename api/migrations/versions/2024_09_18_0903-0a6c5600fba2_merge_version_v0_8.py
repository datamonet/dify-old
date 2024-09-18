"""merge version v0.8

Revision ID: 0a6c5600fba2
Revises: 85bb9ee0665d, 675b5321501b
Create Date: 2024-09-18 09:03:47.557143

"""
from alembic import op
import models as models
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0a6c5600fba2'
down_revision = ('85bb9ee0665d', '675b5321501b')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
