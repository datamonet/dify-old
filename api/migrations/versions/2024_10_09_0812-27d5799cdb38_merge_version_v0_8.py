"""merge version v0.8

Revision ID: 27d5799cdb38
Revises: 0a6c5600fba2, 33f5fac87f29
Create Date: 2024-10-09 08:12:31.111009

"""
from alembic import op
import models as models
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '27d5799cdb38'
down_revision = ('0a6c5600fba2', '33f5fac87f29')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
