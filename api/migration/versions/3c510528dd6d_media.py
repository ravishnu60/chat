"""media

Revision ID: 3c510528dd6d
Revises: 04c859eccdb6
Create Date: 2023-10-14 17:57:44.568987

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '3c510528dd6d'
down_revision = '04c859eccdb6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('media',
    sa.Column('media_id', sa.Integer(), nullable=False),
    sa.Column('from_id', sa.Integer(), nullable=False),
    sa.Column('to_id', sa.Integer(), nullable=False),
    sa.Column('media_loc', sa.String(), nullable=False),
    sa.ForeignKeyConstraint(['from_id'], ['users.user_id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['to_id'], ['users.user_id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('media_id')
    )
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('media')
    # ### end Alembic commands ###
