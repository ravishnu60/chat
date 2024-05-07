from pydantic import BaseModel
from typing import Optional

class userSchma(BaseModel):
    name : str
    phone_no: int
    password : str

class TypingSchema(BaseModel):
    from_id:Optional[int]=0
    to_id:int
    typing:bool

class Profile(BaseModel):
    name:str
    phone_no:int

class Password(BaseModel):
    password:str
    new_password:str