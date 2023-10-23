from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from utils import secret
try:
    engine= create_engine(secret.db_url, pool_size=10, max_overflow=30)
    session_local = sessionmaker(bind=engine,autocommit=False,autoflush=False)
    base= declarative_base()
    print("Connected to DB")
except Exception as err:
    print(err)
    
def get_DB():
    session= session_local()
    try:
        yield session
    finally:
        session.close()
    