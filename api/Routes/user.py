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

@app.post('/new')
def newUser(data: userSchma, res: Response, db: Session = Depends(get_DB)):
    check_exist = db.query(User).filter(User.phone_no == data.phone_no).first()
    if check_exist:
        res.status_code = status.HTTP_409_CONFLICT
        return {"status_code": 409, "status": "failed", "detail": "Mobile number already in use"}
    data.password = hash.encrypt(data.password)
    newUserObj = User(**data.model_dump())
    db.add(newUserObj)
    db.commit()
    db.refresh(newUserObj)
    return {"status_code": 200, "status": "success", "detail": "Registered successfully"}


@app.post('/login')
def login(res: Response, data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_DB)):
    get_user = db.query(User).filter(User.phone_no == data.username).first()
    if not get_user:
        res.status_code = status.HTTP_404_NOT_FOUND
        return {"status_code": 404, "status": "failed", "detail": "User not found"}
    if not hash.verify(data.password, get_user.password):
        res.status_code = status.HTTP_403_FORBIDDEN
        return {"status_code": 403, "status": "failed", "detail": "Username or password is invalid"}
    acc_token = token.get_token(
        {"id": get_user.user_id, "name": get_user.name})
    return {"status_code": 200, "status": "success", "detail": "Logged in successfully", "access_token": acc_token, "token_type": "bearer"}


@app.get('/userinfo')
def userData(db: Session = Depends(get_DB),  get_curr_user=Depends(token.get_current_user)):
    query= db.query(User).filter(User.user_id== get_curr_user['id'])
    if not query.first().alive:
        query.update({"alive":True}, synchronize_session=False)
        db.commit()
    temp=query.first()
    data:dict={}
    data['name'],data['phone_no'],data['id']= temp.name, temp.phone_no, temp.user_id
    if temp.profile:
        output= firecloud.getFile(temp.profile.split("##")[1])
        if output:
            data['profile']= output
    else:
        data['profile']=None
        
    # data['profile']= f"{secret.base_url}user/profile/{get_curr_user['id']}" if temp.profile else None
    return {"status_code": 200, "status": "success", "detail": "User found", "data": data}


@app.get('/find/{phone_no}')
def findUser(phone_no: int, res: Response, db: Session = Depends(get_DB), get_curr_user=Depends(token.get_current_user)):
    user = db.query(User).filter(User.phone_no == phone_no).first()
    if not user or user.user_id == get_curr_user['id']:
        res.status_code = status.HTTP_404_NOT_FOUND
        return {"status_code": 404, "status": "failed", "detail": "User not found"}
    del user.password
    return {"status_code": 200, "status": "success", "detail": "User found", "data": user}


@app.put('/update')
def updateProfile(data:Profile, res:Response, db: Session = Depends(get_DB), get_curr_user=Depends(token.get_current_user)):
    query= db.query(User).filter(User.user_id == get_curr_user['id'])

    if query.first():
        query.update(data.model_dump(), synchronize_session=False)
        db.commit()
        return {"status_code": 200, "status": "success", "detail": "Data updated"}
    res.status_code= status.HTTP_400_BAD_REQUEST
    return {"status_code": 400, "status": "failed", "detail": "Error while updating"}

@app.put('/password')
def changePwd(data:Password, res:Response, db: Session = Depends(get_DB), get_curr_user=Depends(token.get_current_user)):
    query= db.query(User).filter(User.user_id == get_curr_user['id'])

    if hash.verify(data.password, query.first().password):
        query.update({"password":hash.encrypt(data.new_password)}, synchronize_session=False)
        db.commit()
        return {"status_code": 200, "status": "success", "detail": "Password updated"}
    res.status_code= status.HTTP_400_BAD_REQUEST
    return {"status_code": 400, "status": "failed", "detail": "Old password is incorrect"}

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
    old_loc= data.profile.split("##")[1] if data.profile else None
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
        
        query.update({"profile":f"{link}##{file_loc}"}, synchronize_session=False)
        db.commit()
        delPath(path)
    except Exception as err:
        res.status_code=status.HTTP_409_CONFLICT
        return {"status_code": 409, "status": "failed", "detail": "Can't upload file"}   
    return {"status_code": 200, "status": "success", "detail": "profile updated"}

#No use manage in firebase
@app.get('/profile/{id}')
def getMedia(id:int,db: Session = Depends(get_DB)):
    source= db.query(User).filter(User.user_id == id).first()
    check_file= os.path.exists(source.profile)
    if not source or check_file:
        return {"status_code": 404, "status": "failed", "detail": "file not found"}
    return FileResponse(source.profile)
