from pydantic import BaseSettings

class Secret(BaseSettings):
    db_url:str
    
    class Config:
        env_file=".env"
        
secret=Secret()