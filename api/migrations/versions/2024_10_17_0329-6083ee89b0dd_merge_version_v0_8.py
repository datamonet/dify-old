"""merge version v0.8

Revision ID: 6083ee89b0dd
Revises: 27d5799cdb38, d8e744d88ed6
Create Date: 2024-10-17 03:29:16.812167

"""
from alembic import op
import models as models
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '6083ee89b0dd'
down_revision = ('27d5799cdb38', 'd8e744d88ed6')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
