from pydantic import BaseModel
from typing import Optional

class userSchma(BaseModel):
    name : str
    phone_no: int
    password : str
    
class MsgSchma(BaseModel):
    from_id:Optional[int]
    to_id:int
    message:str
    is_read:Optional[bool]=False
    