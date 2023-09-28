from pydantic import BaseModel
from typing import Optional

class userSchma(BaseModel):
    name : str
    phone_no: int
    password : str
    
class MsgSchma(BaseModel):
    from_id:Optional[int]=0
    to_id:int
    message:str
    is_read:Optional[bool]=False

class TypingSchema(BaseModel):
    from_id:Optional[int]=0
    to_id:int
    typing:bool
    