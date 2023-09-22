from jose import JWTError, jwt
import datetime
from fastapi.security.oauth2 import OAuth2PasswordBearer
from fastapi import status, HTTPException, Depends

Oauth_token= OAuth2PasswordBearer('chat/login')

secret_key= "gcdygfrt89y87r8y dih uicdfkugcd7fesgcuiofe"
algorithm= 'HS256'
    
def get_token(data):
    expire= datetime.datetime.utcnow() + datetime.timedelta(minutes=30)
    data["exp"]=expire
    return jwt.encode(data,secret_key,algorithm=algorithm)

def get_current_user(token=Depends(Oauth_token)):
    try:
        return jwt.decode(token,secret_key,algorithms=[algorithm])
    except JWTError as err:
        print(err)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,detail="Unauthorized access")
        
        