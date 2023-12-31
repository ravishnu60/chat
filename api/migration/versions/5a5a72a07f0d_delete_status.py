"""delete_status

Revision ID: 5a5a72a07f0d
Revises: 3c510528dd6d
Create Date: 2023-10-14 18:00:18.259183

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '5a5a72a07f0d'
down_revision = '3c510528dd6d'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('messages', sa.Column('from_delete', sa.Boolean(), server_default='false', nullable=False))
    op.add_column('messages', sa.Column('to_delete', sa.Boolean(), server_default='false', nullable=False))
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('messages', 'to_delete')
    op.drop_column('messages', 'from_delete')
    # ### end Alembic commands ###
