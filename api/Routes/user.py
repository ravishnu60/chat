import os
from fastapi import APIRouter, Depends, Form, Response, status,UploadFile,File
from fastapi.responses import FileResponse
from db import get_DB
from sqlalchemy.orm import Session
from schema import userSchma, Profile, Password
from Authorize import hash, token, firecloud
from Models.model import User
from fastapi.security.oauth2 import OAuth2PasswordRequestForm
import shutil

app = APIRouter(
    prefix='/user',
    tags=['User']
)

# API toRegister a new user
@app.post('/register')
def newUser(data: userSchma, res: Response, db: Session = Depends(get_DB)):
    check_exist = db.query(User).filter(User.phone_no == data.phone_no).first()
    if check_exist:
        res.status_code = status.HTTP_409_CONFLICT
        return {"status_code": 409, "status": False, "detail": "Mobile number already in use"}
    data.password = hash.encrypt(data.password)
    newUserObj = User(**data.model_dump())
    db.add(newUserObj)
    db.commit()
    db.refresh(newUserObj)
    return {"status_code": 200, "status": True, "detail": "Registered successfully"}

# API to login for registered users
@app.post('/login')
def login(res: Response, data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_DB)):
    get_user = db.query(User).filter(User.phone_no == data.username).first()
    if not get_user:
        res.status_code = status.HTTP_404_NOT_FOUND
        return {"status_code": 404, "status": False, "detail": "User not found"}
    if not hash.verify(data.password, get_user.password):
        res.status_code = status.HTTP_403_FORBIDDEN
        return {"status_code": 403, "status": False, "detail": "Username or password is invalid"}
    acc_token = token.get_token(
        {"id": get_user.user_id, "name": get_user.name})
    return {"status_code": 200, "status": True, "detail": "Logged in successfully", "access_token": acc_token, "token_type": "bearer"}

# API to get logged in user
@app.get('/userinfo')
def userData(res: Response, db: Session = Depends(get_DB), get_curr_user=Depends(token.get_current_user)):
    query= db.query(User).filter(User.user_id== get_curr_user['id'])
    if not query.first():
        res.status_code = status.HTTP_404_NOT_FOUND
        return {"status_code": 404, "status": False, "detail": "User not found"}
    if not query.first().alive:
        query.update({"alive":True}, synchronize_session=False)
        db.commit()
    temp=query.first()
    data:dict={}
    data['name'],data['phone_no'],data['id']= temp.name, temp.phone_no, temp.user_id
    if temp.profile:
        # output= firecloud.getFile(temp.profile.split('##')[0])
        # if output:
        data['profile']= temp.profile.split('##')[0]
    else:
        data['profile']=None
    return {"status_code": 200, "status": True, "detail": "User found", "data": data}

# API to find a user
@app.get('/find/{phone_no}')
def findUser(phone_no: int, res: Response, db: Session = Depends(get_DB), get_curr_user=Depends(token.get_current_user)):
    user = db.query(User).filter(User.phone_no == phone_no).first()
    if not user or user.user_id == get_curr_user['id']:
        res.status_code = status.HTTP_404_NOT_FOUND
        return {"status_code": 404, "status": False, "detail": "User not found"}
    del user.password
    return {"status_code": 200, "status": True, "detail": "User found", "data": user}

# API to update user profile
@app.put('/update')
def updateProfile(data:Profile, res:Response, db: Session = Depends(get_DB), get_curr_user=Depends(token.get_current_user)):
    query= db.query(User).filter(User.user_id == get_curr_user['id'])

    if query.first():
        query.update(data.model_dump(), synchronize_session=False)
        db.commit()
        return {"status_code": 200, "status": True, "detail": "Data updated"}
    res.status_code= status.HTTP_400_BAD_REQUEST
    return {"status_code": 400, "status": False, "detail": "Error while updating"}

# API to change profile password
@app.put('/password')
def changePwd(data:Password, res:Response, db: Session = Depends(get_DB), get_curr_user=Depends(token.get_current_user)):
    query= db.query(User).filter(User.user_id == get_curr_user['id'])

    if hash.verify(data.password, query.first().password):
        query.update({"password":hash.encrypt(data.new_password)}, synchronize_session=False)
        db.commit()
        return {"status_code": 200, "status": True, "detail": "Password updated"}
    res.status_code= status.HTTP_400_BAD_REQUEST
    return {"status_code": 400, "status": False, "detail": "Old password is incorrect"}

def delPath(path):
    # remove local file after upload
    if os.path.exists(path):
        shutil.rmtree(path)

@app.put('/profilepic')
def addMedia(res: Response,source:UploadFile=File(), db: Session = Depends(get_DB), get_curr_user=Depends(token.get_current_user)):
    path = os.path.join("Assets",f"profile/{get_curr_user['id']}")
    file_loc= f"{path}/{source.filename}"
    query= db.query(User).filter(User.user_id == get_curr_user['id'])
    data= query.first()
    old_loc= data.profile.split('##')[1] if data.profile else None
    try:
        if not os.path.exists(path):
            os.makedirs(path)

        with open(file_loc, "wb+") as file_object:
            file_object.write(source.file.read())
            
        output= firecloud.uploadFile(file_loc, old_loc)
        link= firecloud.getFile(file_loc)
        if not output:
            delPath(path)
            return {"status_code": 409, "status": "failed", "detail": "Can't upload file"}
        
        query.update({"profile":f'{link}##{file_loc}'}, synchronize_session=False)
        db.commit()
        delPath(path)
    except Exception as err:
        print(err)
        res.status_code=status.HTTP_409_CONFLICT
        return {"status_code": 409, "status": "failed", "detail": "Can't upload file"}   
    return {"status_code": 200, "status": "success", "detail": "profile updated"}

# API to delete profile
@app.delete('/deleteuser')
def deleteuser(res: Response, db:Session= Depends(get_DB),get_curr_user= Depends(token.get_current_user)):
    query= db.query(User).filter(User.user_id == get_curr_user['id'])
    if query:
        query.delete(synchronize_session=False)
        db.commit()
    return {"status_code": 200, "status": True, "detail": "profile deleted"}