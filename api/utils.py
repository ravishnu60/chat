from pydantic.v1 import BaseSettings

class Secret(BaseSettings):
    db_url:str
    key:str
    uid:str
    
    class Config:
        env_file=".env"
        
secret=Secret()