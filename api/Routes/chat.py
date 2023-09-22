from fastapi import APIRouter, Depends, Response, status
from db import get_DB
from sqlalchemy.orm import Session, load_only
from schema import userSchma, MsgSchma
from Authorize import hash, token
from Models.model import User, Message
from fastapi.security.oauth2 import OAuth2PasswordRequestForm
from sqlalchemy import or_,and_

app= APIRouter(
    prefix='/chat',
    tags=['Chat']
)

@app.post('/new')
def newUser(data:userSchma, res:Response, db:Session=Depends(get_DB)):
    check_exist= db.query(User).filter(User.phone_no == data.phone_no).first()
    if check_exist:
        res.status_code= status.HTTP_409_CONFLICT
        return {"status_code":409,"status":"failed","detail":"Mobile number already in use"}
    data.password= hash.encrypt(data.password)
    newUserObj=User(**data.dict()) 
    db.add(newUserObj)
    db.commit()
    db.refresh(newUserObj)
    return {"status_code":200,"status":"success","detail":"Registered successfully"}

@app.post('/login')
def login(res:Response, data:OAuth2PasswordRequestForm= Depends(), db:Session=Depends(get_DB)):
    get_user= db.query(User).filter(User.phone_no == data.username).first()
    if not get_user:
        res.status_code=status.HTTP_404_NOT_FOUND
        return {"status_code":404,"status":"failed","detail":"User not found"}
    if not hash.verify(data.password,get_user.password):
        res.status_code= status.HTTP_403_FORBIDDEN
        return {"status_code":403,"status":"failed","detail":"Username or password is invalid"}
    acc_token= token.get_token({"id":get_user.user_id,"name":get_user.name})
    return {"status_code":200,"status":"success","detail":"Logged in successfully","access_token":acc_token,"token_type":"bearer"}


@app.get('/find/{phone_no}')
def findUser(phone_no:int,res: Response, db: Session= Depends(get_DB),get_curr_user= Depends(token.get_current_user)):
    user= db.query(User).filter(User.phone_no == phone_no).first()
    if not user:
        res.status_code= status.HTTP_404_NOT_FOUND
        return {"status_code":404,"status":"failed","detail":"User not found"}
    del user.password
    return {"status_code":200,"status":"success","detail":"User found","data":user}

@app.get('/chatlist')
def getChatList(res: Response, db: Session= Depends(get_DB), get_curr_user= Depends(token.get_current_user)):
    sent_chat= db.query(Message.to_id).order_by(Message.msg_id.desc()).filter(Message.from_id == get_curr_user['id']).all()
    receive_chat= db.query(Message.from_id).order_by(Message.msg_id.desc()).filter(Message.to_id == get_curr_user['id']).all()
    get_chat= sent_chat+receive_chat
    
    if not get_chat:
        res.status_code= status.HTTP_404_NOT_FOUND
        return {"status_code":404,"status":"failed","detail":"No chats"}
    
    ids=[]
    for chat in get_chat:
        ids.append(chat[0])
    get_name= db.query(User).options(load_only('name')).filter(User.user_id.in_(ids)).all()
    return {"status_code":200,"status":"success","detail":"chat found","data":get_name}

@app.get('/prechat/{id}')
def getchat(id:int,res: Response, db: Session= Depends(get_DB), get_curr_user= Depends(token.get_current_user)):
    # update viewed status
    queryobj= db.query(Message).filter(Message.to_id==get_curr_user['id'], Message.from_id==id, Message.is_read==False)
    if queryobj.first():
        queryobj.update({"is_read":True}, synchronize_session= False)
        db.commit()
    #get messages
    my_msg= db.query(Message).options(load_only('message','is_read','from_id','createdAt')).filter(or_(and_(Message.from_id== get_curr_user['id'], Message.to_id==id),Message.to_id== get_curr_user['id'])).order_by(Message.createdAt).all()
    for msg in my_msg:
        msg.from_id = msg.from_id == get_curr_user['id']
        
    return {"status_code":200,"status":"success","detail":"chat found","data":my_msg}
    
@app.post('/chat')
def chat(data:MsgSchma, db: Session= Depends(get_DB), get_curr_user= Depends(token.get_current_user)):
    data.from_id=get_curr_user['id']
    msg= Message(**data.dict())
    db.add(msg)
    db.commit()
    return {"status_code":200,"status":"success","detail":"sent successfully"}
    
@app.put('/markasread/{sender_id}')
def markAsRead(sender_id:int, res: Response, db: Session= Depends(get_DB), get_curr_user= Depends(token.get_current_user)):
    queryobj= db.query(Message).filter(Message.to_id==get_curr_user['id'], Message.from_id==sender_id, Message.is_read==False)
    if not queryobj.first():
        res.status_code= status.HTTP_404_NOT_FOUND
        return {"status_code":404,"status":"failed","detail":"No Messages"}
    queryobj.update({"is_read":True}, synchronize_session= False)
    db.commit()
    return {"status_code":200,"status":"success","detail":"status changed"}