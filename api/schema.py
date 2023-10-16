from pydantic import BaseModel
from typing import Optional

class userSchma(BaseModel):
    name : str
    phone_no: int
    password : str
    
class MediaScm():
    from_id:Optional[int]=0
    to_id:int

class TypingSchema(BaseModel):
    from_id:Optional[int]=0
    to_id:int
    typing:bool
    