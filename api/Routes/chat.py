from fastapi import APIRouter, Depends, Response, status
import pytz
from db import get_DB
from sqlalchemy.orm import Session, load_only
from schema import userSchma, MsgSchma, TypingSchema
from Authorize import hash, token
from Models.model import User, Message, Typing
from fastapi.security.oauth2 import OAuth2PasswordRequestForm
from sqlalchemy import or_,and_
import datetime

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
    newUserObj=User(**data.model_dump()) 
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

@app.get('/userinfo')
def userData(res: Response, get_curr_user= Depends(token.get_current_user)):
    return {"status_code":200,"status":"success","detail":"User found","data":get_curr_user}

@app.get('/find/{phone_no}')
def findUser(phone_no:int,res: Response, db: Session= Depends(get_DB),get_curr_user= Depends(token.get_current_user)):
    user= db.query(User).filter(User.phone_no == phone_no).first()
    if not user or user.user_id == get_curr_user['id']:
        res.status_code= status.HTTP_404_NOT_FOUND
        return {"status_code":404,"status":"failed","detail":"User not found"}
    del user.password
    return {"status_code":200,"status":"success","detail":"User found","data":user}

@app.get('/chatlist')
def getChatList(res: Response, db: Session= Depends(get_DB), get_curr_user= Depends(token.get_current_user)):
    get_chat= db.query(Message.from_id,Message.to_id,Message.is_read)\
        .order_by(Message.msg_id.desc())\
            .filter(or_(Message.from_id == get_curr_user['id'],Message.to_id == get_curr_user['id'])).all()

    if not get_chat:
        res.status_code= status.HTTP_404_NOT_FOUND
        return {"status_code":404,"status":"failed","detail":"No chats"}
    
    ids=[]
    newtext={}
    #get ids and new messgae count
    for chat in get_chat:
        id=0
        if chat[0] == get_curr_user['id']:
            id=chat[1]
        elif chat[1]== get_curr_user['id']:
            id=chat[0]
            if chat[2]==False and str(id) in newtext:
                newtext[str(id)]+=1
            elif chat[2]==False:
                newtext[str(id)]=1
            
        if id not in ids:
            ids.append(id)
            
        if str(id) not in newtext:
            newtext[str(id)]=0
    
    
    get_name=[]
    for id in ids:
        temp= db.query(User).options(load_only(User.name)).filter(User.user_id==id).first()
        temp.newmsg=newtext[str(id)]
        get_name.append(temp)
    
    # get_name= db.query(User).options(load_only(User.name)).filter(User.user_id.in_(ids)).all()
    return {"status_code":200,"status":"success","detail":"chat found","data":get_name}

@app.get('/pastchat')
def getchat(id:int,res: Response,limit:int=10, db: Session= Depends(get_DB), get_curr_user= Depends(token.get_current_user)):
    # update viewed status
    queryobj= db.query(Message).filter(Message.to_id==get_curr_user['id'], Message.from_id==id, Message.is_read==False)
    if queryobj.first():
        queryobj.update({"is_read":True}, synchronize_session= False)
        db.commit()
    
    #get messages latest 10
    my_msg= db.query(Message)\
        .options(load_only(Message.message,Message.is_read,Message.from_id,Message.createdAt))\
        .filter(or_(and_(Message.from_id== get_curr_user['id'], Message.to_id==id),
                    and_(Message.to_id== get_curr_user['id'],Message.from_id == id)))\
        .order_by(Message.createdAt.desc()).limit(limit).all()
    aligned_msg=[]
    temp_date=None
    #Add Date in list
    for msg in my_msg:
        msg.createdAt= msg.createdAt.astimezone(pytz.timezone('Asia/Kolkata'))
        if temp_date==None:
            temp_date= msg.createdAt.strftime('%d/%m/%Y')
            
        if temp_date != msg.createdAt.strftime('%d/%m/%Y'):
            aligned_msg.append({"date":temp_date})
            temp_date= msg.createdAt.strftime('%d/%m/%Y')
            
        msg.from_id = msg.from_id == get_curr_user['id']
        msg.createdAt= msg.createdAt.strftime('%I:%M %p')
        aligned_msg.append(msg)
    
    #insert latest date into list
    aligned_msg.append({"date":temp_date})
        
    my_msg= aligned_msg.copy()
    aligned_msg.clear()
    for num in range(len(my_msg)):
        aligned_msg.append(my_msg[len(my_msg)-(num+1)])
    
    #send typing status
    type_status= db.query(Typing.typing).filter(Typing.to_id==get_curr_user['id'], Typing.from_id==id).first()
    if not type_status:
        type_status= {"typing":False}
    else:
        type_status= {"typing":type_status[0]}     
    
    return {"status_code":200,"status":"success","detail":"chat found","data":{"message":aligned_msg,**type_status}}
    
@app.post('/message')
def chat(data:MsgSchma, db: Session= Depends(get_DB), get_curr_user= Depends(token.get_current_user)):
    data.from_id=get_curr_user['id']
    msg= Message(**data.model_dump())
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

@app.put("/typing")
def typingStatus(data:TypingSchema,db: Session= Depends(get_DB), get_curr_user= Depends(token.get_current_user)):
    data.from_id= get_curr_user['id']
    query= db.query(Typing).filter(Typing.from_id==get_curr_user['id'], Typing.to_id==data.to_id)
    
    if query.first():
        if data.typing != query.first().typing:
            query.update({"typing":data.typing}, synchronize_session=False)
            db.commit()
    else:
        newData= Typing(**data.model_dump())
        db.add(newData)
        db.commit()
    return {"status_code":200,"status":"success","detail":"status changed"}

@app.delete("/deletechat/{to_id}")
def deleteChat(to_id:int, res: Response, db: Session= Depends(get_DB), get_curr_user= Depends(token.get_current_user)):
    get_chat= db.query(Message).filter(Message.from_id== get_curr_user['id'], Message.to_id==to_id)
    
    if get_chat.first():
        get_chat.delete(synchronize_session=False)
        db.commit()
    
    res.status_code= status.HTTP_204_NO_CONTENT
    return {"status_code":204,"status":"success","detail":"Chat deleted successfully"}

@app.delete("/deletemsg/{msg_id}")
def deleteChat(msg_id:int, res: Response, db: Session= Depends(get_DB), get_curr_user= Depends(token.get_current_user)):
    get_msg= db.query(Message).filter(Message.msg_id == msg_id, Message.from_id == get_curr_user['id'])

    if get_msg.first():
        get_msg.delete(synchronize_session=False)
        db.commit()
    else:
        print("no")
    res.status_code= status.HTTP_204_NO_CONTENT
    return {"status_code":204,"status":"success","detail":"Chat deleted successfully"}