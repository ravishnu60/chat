from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
try:
    engine= create_engine("postgresql://postgres:postgres@localhost/chat")
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
    