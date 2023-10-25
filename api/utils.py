from pydantic.v1 import BaseSettings

class Secret(BaseSettings):
    db_url:str
    base_url:str
    key:str
    
    class Config:
        env_file=".env"
        
secret=Secret()