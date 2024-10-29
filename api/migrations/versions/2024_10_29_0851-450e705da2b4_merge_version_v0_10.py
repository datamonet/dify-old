"""merge version v0.10

Revision ID: 450e705da2b4
Revises: 6083ee89b0dd, 43fa78bc3b7d
Create Date: 2024-10-29 08:51:09.744707

"""
from alembic import op
import models as models
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '450e705da2b4'
down_revision = ('6083ee89b0dd', '43fa78bc3b7d')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
