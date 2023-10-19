from fastapi import APIRouter, Depends, Response, status, WebSocket, Form, UploadFile, File
from fastapi.responses import FileResponse
from db import get_DB
from sqlalchemy.orm import Session, load_only
from schema import userSchma, MediaScm, TypingSchema
from Authorize import hash, token
from Models.model import User, Message, Typing, Media
from fastapi.security.oauth2 import OAuth2PasswordRequestForm
from sqlalchemy import or_, and_
import json,pytz,os, random
from utils import secret

app = APIRouter(
    prefix='/chat',
    tags=['Chat']
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
def userData(res: Response, get_curr_user=Depends(token.get_current_user)):
    return {"status_code": 200, "status": "success", "detail": "User found", "data": get_curr_user}


@app.get('/find/{phone_no}')
def findUser(phone_no: int, res: Response, db: Session = Depends(get_DB), get_curr_user=Depends(token.get_current_user)):
    user = db.query(User).filter(User.phone_no == phone_no).first()
    if not user or user.user_id == get_curr_user['id']:
        res.status_code = status.HTTP_404_NOT_FOUND
        return {"status_code": 404, "status": "failed", "detail": "User not found"}
    del user.password
    return {"status_code": 200, "status": "success", "detail": "User found", "data": user}

#set typing off when end chat
def typingOff(db, id):
    query= db.query(Typing).filter(Typing.from_id ==id)
    
    if query.first():
        query.update({"typing": False}, synchronize_session=False)
        db.commit()

# get chat list by websocket
def newchat(user_id, db):
    get_chat = db.query(Message.from_id, Message.to_id, Message.is_read)\
    .order_by(Message.msg_id.desc())\
    .filter(or_(Message.from_id == user_id, Message.to_id == user_id)).all()
    
    if not get_chat:
        return False

    ids = []
    newtext = {}
    # get ids and new messgae count
    for chat in get_chat:
        id = 0
        if chat[0] == user_id:
            id = chat[1]
        elif chat[1] == user_id:
            id = chat[0]
            if chat[2] == False and str(id) in newtext:
                newtext[str(id)] += 1
            elif chat[2] == False:
                newtext[str(id)] = 1

        if id not in ids:
            ids.append(id)

        if str(id) not in newtext:
            newtext[str(id)] = 0

    get_name = []
    for id in ids:
        temp = db.query(User).options(load_only(User.name)).filter(User.user_id == id).first()
        temp.newmsg = newtext[str(id)]
        temp= temp.__dict__
        temp.pop('_sa_instance_state')
        get_name.append(temp)
    
    return get_name
       
@app.websocket("/chatlist/{id}")
async def chatlist(websocket: WebSocket, id: int, db: Session= Depends(get_DB)):
    await websocket.accept()
    
    while True:
        try:
            #receive
            await websocket.receive_text()

            # send message
            newData= newchat(id,db)
            if newData:
                await websocket.send_json(newData)
        except Exception as Err:
            print("Connection closed",Err)
            break

#updated viewwd status
def updateView(user_id,id,db):
    # update viewed status
    queryobj =db.query(Message).filter(
        Message.to_id == user_id, Message.from_id == id, Message.is_read == False)
    if queryobj.first():
        queryobj.update({"is_read": True}, synchronize_session=False)
        db.commit()
        
#get messages
def getmsg(user_id,id,limit, db):
    # get messages latest based on limit initial-10
    my_msg = db.query(Message)\
        .options(load_only(Message.message, Message.is_read, Message.from_id,Message.is_media, Message.createdAt))\
        .filter(or_(and_(Message.from_id == user_id, Message.to_id == id),
                    and_(Message.to_id == user_id, Message.from_id == id)))\
        .order_by(Message.createdAt.desc()).limit(limit).all()
    aligned_msg = []
    temp_date = None
    
    # Add Date in list
    for msg in my_msg:
        temp={}
        temp['is_read']= msg.is_read
        temp['from_id']= msg.from_id
        temp['createdAt']= msg.createdAt
        temp['message']= msg.message
        temp['is_media']= msg.is_media
        temp['msg_id']= msg.msg_id
        
        temp['createdAt'] = msg.createdAt.astimezone(pytz.timezone('Asia/Kolkata'))
        if temp_date == None:
            temp_date = temp['createdAt'].strftime('%d/%m/%Y')

        if temp_date != temp['createdAt'].strftime('%d/%m/%Y'):
            aligned_msg.append({"date": temp_date})
            temp_date =temp['createdAt'].strftime('%d/%m/%Y')

        temp['from_id'] = msg.from_id == user_id
        temp['createdAt'] = temp['createdAt'].strftime('%I:%M %p')
        aligned_msg.append(temp)

    # insert latest date into list
    aligned_msg.append({"date": temp_date})

    #latest data first (reversing)
    my_msg = aligned_msg.copy()
    aligned_msg.clear()
    for num in range(len(my_msg)):
        aligned_msg.append(my_msg[len(my_msg)-(num+1)])


    # send typing status
    type_status = db.query(Typing.typing).filter(
        Typing.to_id == user_id, Typing.from_id == id).first()
    if not type_status:
        type_status = {"typing": False}
    else:
        type_status = {"typing": type_status[0]}
    
    return {"message":aligned_msg, **type_status}


@app.websocket('/getchat/{user_id}')
async def getchat(websocket:WebSocket,user_id:int, id: int, db: Session = Depends(get_DB)):
    await websocket.accept()
    # user_id=> from_id, id=> to_id
    while True:
        try:
            #receive
            receive= await websocket.receive_text()
            receive= json.loads(receive)
            #save msg
            if receive.get('msg'):
                data=receive['msg']
                msg = Message(from_id=user_id, to_id=data['to_id'], message=data['message'])
                db.add(msg)
                db.commit()
            # send message
            newData=getmsg(user_id,id,int(receive['limit']),db)
            if newData:
                await websocket.send_json(newData)
            updateView(user_id,id,db)
        except Exception as Err:
            print("Connection closed",Err)
            typingOff(db, user_id)
            break

def checkPathAvailable(file_loc, name, path):
    if os.path.exists(file_loc):
        num=random.randint(1,1000)
        file_type=os.path.splitext(name)
        newname=file_type[0]+str(num)+file_type[1]
        file_new = (f"{path}/{newname}")
        return checkPathAvailable(file_new, name, path)
    else:
        return file_loc

@app.post('/media')
def addMedia(res: Response, data:str=Form(),source:UploadFile=File(), db: Session = Depends(get_DB), get_curr_user=Depends(token.get_current_user)):
    try:
        data= json.loads(data)
    except:
        res.status_code= status.HTTP_422_UNPROCESSABLE_ENTITY
        return {"status_code":422, "status":'Unprocessable Entity',"detail":"Construct data properly"}
    path = os.path.join("Assets",f"{get_curr_user['id']}_{data['to_id']}")
    file_loc= f"{path}/{source.filename}"
    file_loc= checkPathAvailable(file_loc, source.filename, path)
    
    media= Media(media_loc= file_loc)
    db.add(media)
    db.commit()
    db.refresh(media)
    try:
        msg = Message(from_id=get_curr_user['id'], to_id=data['to_id'], message=media.media_id, is_media=True)
        db.add(msg)
        db.commit()
        if not os.path.exists(path):
            os.makedirs(path)

        with open(file_loc, "wb+") as file_object:
            file_object.write(source.file.read())
    except:
        res.status_code=status.HTTP_409_CONFLICT
        return {"status_code": 409, "status": "failed", "detail": "Can't upload file"}   
    return {"status_code": 200, "status": "success", "detail": "sent successfully"}

@app.get('/media/{id}')
def getMedia(id:int,db: Session = Depends(get_DB)):
    source= db.query(Media).filter(Media.media_id == id).first()
    if not source:
        return {"status_code": 404, "status": "failed", "detail": "file not found"}
    return FileResponse(source.media_loc)

@app.put('/markasread/{sender_id}')
def markAsRead(sender_id: int, res: Response, db: Session = Depends(get_DB), get_curr_user=Depends(token.get_current_user)):
    queryobj = db.query(Message).filter(
        Message.to_id == get_curr_user['id'], Message.from_id == sender_id, Message.is_read == False)
    if not queryobj.first():
        res.status_code = status.HTTP_404_NOT_FOUND
        return {"status_code": 404, "status": "failed", "detail": "No Messages"}
    queryobj.update({"is_read": True}, synchronize_session=False)
    db.commit()
    return {"status_code": 200, "status": "success", "detail": "status changed"}


@app.put("/typing")
def typingStatus(data: TypingSchema, db: Session = Depends(get_DB), get_curr_user=Depends(token.get_current_user)):
    data.from_id = get_curr_user['id']
    query = db.query(Typing).filter(Typing.from_id ==
                                    get_curr_user['id'], Typing.to_id == data.to_id)

    if query.first():
        if data.typing != query.first().typing:
            query.update({"typing": data.typing}, synchronize_session=False)
            db.commit()
    else:
        newData = Typing(**data.model_dump())
        db.add(newData)
        db.commit()
    return {"status_code": 200, "status": "success", "detail": "status changed"}


@app.delete("/deletechat/{to_id}")
def deleteChat(to_id: int, res: Response, db: Session = Depends(get_DB), get_curr_user=Depends(token.get_current_user)):
    get_chat = db.query(Message).filter(Message.from_id ==
                                        get_curr_user['id'], Message.to_id == to_id)

    if get_chat.first():
        get_chat.delete(synchronize_session=False)
        db.commit()

    res.status_code = status.HTTP_204_NO_CONTENT
    return {"status_code": 204, "status": "success", "detail": "Chat deleted successfully"}


@app.delete("/deletemsg/{msg_id}/{media_id}")
def deleteChat(msg_id: int,media_id:int, res: Response, db: Session = Depends(get_DB), get_curr_user=Depends(token.get_current_user)):
    get_msg = db.query(Message).filter(
        Message.msg_id == msg_id, Message.from_id == get_curr_user['id'])
    
    get_media= db.query(Media).filter(Media.media_id == media_id)
    if get_media.first():
        try: 
            os.remove(get_media.first().media_loc)
        except OSError as error:
            pass
        get_media.delete(synchronize_session=False)
        db.commit()
        
    if get_msg.first():
        get_msg.delete(synchronize_session=False)
        db.commit()
    else:
        pass
    res.status_code = status.HTTP_204_NO_CONTENT
    return {"status_code": 204, "status": "success", "detail": "Chat deleted successfully"}
