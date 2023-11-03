from sqlalchemy import Integer, Column, String, TypeDecorator, func, type_coerce,LargeBinary, BigInteger, DateTime, Boolean, ForeignKey
from db import base
from utils import secret

key=secret.key

#TypeDecorator - Create a type which can add additional functionality of an existing type
class PGPString(TypeDecorator):
    impl = LargeBinary # Assign the type LargerBinary to large values
    cache_ok=True 
    def __init__(self):
        super(PGPString, self).__init__()  # Initialize with superclass

    def bind_expression(self, bindvalue):
        # type_coerce use to aasociate with sql expression with specific type
        #pgp_sym_encrypt - is used to encrypt
        return func.pgp_sym_encrypt(type_coerce(bindvalue,String), key)
    
    def column_expression(self, col):
        #pgp_sym_decrypt - is used to decrypt
        return func.pgp_sym_decrypt(col, key)


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
    message= Column(PGPString, nullable= False)
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
