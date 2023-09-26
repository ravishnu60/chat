from sqlalchemy import Column, Integer, String, DateTime, BigInteger, ForeignKey, Boolean, func
from db import base

class User(base):
    __tablename__ = 'users'
    user_id= Column(Integer, primary_key=True,nullable= False)
    name= Column(String, nullable= False)
    phone_no= Column(BigInteger, nullable= False)
    password= Column(String, nullable= False)
    createdAt= Column(DateTime, nullable= False, server_default= func.now())
    
class Message(base):
    __tablename__= 'messages'
    msg_id= Column(Integer, primary_key=True,nullable= False)
    from_id= Column(Integer, ForeignKey('users.user_id',ondelete='CASCADE'), nullable= False)
    to_id= Column(Integer, ForeignKey('users.user_id',ondelete='CASCADE'), nullable= False)
    message= Column(String, nullable= False)
    is_read= Column(Boolean, nullable= False,server_default='false')
    sent=Column(Boolean,nullable= False, server_default='true')
    createdAt= Column(DateTime, nullable= False, server_default=func.now())