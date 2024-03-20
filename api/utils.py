from pydantic.v1 import BaseSettings

class Secret(BaseSettings):
    db_url:str
    key:str
    bucket_id:str
    
    class Config:
        env_file=".env"
        
secret=Secret()