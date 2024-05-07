from fastapi import FastAPI
from Routes import chat, user
from fastapi.middleware.cors import CORSMiddleware
import time, requests, threading

app=FastAPI(
    title="Connect API",
    version="2.0",
    description="Communicate with people"
)
# base.metadata.drop_all(engine)

origins=['*']

app.add_middleware(
    CORSMiddleware,
     allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    
)

@app.get('/')
def root():
    return {"status_code":200,"status":"success","detail":"API is running"}

app.include_router(chat.app)
app.include_router(user.app)


def continueCall(event):
    ip="https://chat-6yfc.onrender.com"
    # ip="http://localhost:8080"
    while True:
        try:
            data= requests.get(f"{ip}/user/userinfo")
            time.sleep(15)
            data= requests.get(f"{ip}/")
            time.sleep(15)
            if event.is_set():
                break
        except:
            time.sleep(15)
            
event= threading.Event()
loop= threading.Thread(target=continueCall, args=(event,))
loop.start()

@app.on_event("shutdown")
def close():
    try:
        event.set()
        loop.join()
        pass
    except:
        pass