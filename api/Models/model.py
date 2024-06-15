from sqlalchemy import Integer, Column, String, BigInteger, DateTime, Boolean, ForeignKey, func
from sqlalchemy_utils.types.encrypted.encrypted_type import AesEngine
from sqlalchemy_utils import EncryptedType
from db import base
from utils import secret


class User(base):
    __tablename__ = 'users'
    user_id= Column(Integer, primary_key=True,nullable= False)
    name= Column(String, nullable= False)
    phone_no= Column(BigInteger, nullable= False)
    password= Column(String, nullable= False)
    createdAt= Column(DateTime, nullable= False, server_default= func.now())
    alive= Column(Boolean, server_default='false')
    last_seen= Column(DateTime)
    profile= Column(String, nullable= True)
    
class Message(base):
    __tablename__= 'messages'
    msg_id= Column(Integer, primary_key=True,nullable= False)
    from_id= Column(Integer, ForeignKey('users.user_id',ondelete='CASCADE'), nullable= False)
    to_id= Column(Integer, ForeignKey('users.user_id',ondelete='CASCADE'), nullable= False)
    message= Column(EncryptedType(String, secret.key, AesEngine, 'pkcs5'))
    is_read= Column(Boolean, nullable= False,server_default='false')
    is_media=Column(Boolean,nullable= False, server_default='false')
    createdAt= Column(DateTime, nullable= False, server_default=func.now())
    pin=Column(String)

class Typing(base):
    __tablename__= 'typing'
    type_id= Column(Integer, primary_key=True,nullable= False)
    from_id= Column(Integer, ForeignKey('users.user_id',ondelete='CASCADE'), nullable= False)
    to_id= Column(Integer, ForeignKey('users.user_id',ondelete='CASCADE'), nullable= False)
    typing= Column(Boolean, nullable= False,server_default='false')
