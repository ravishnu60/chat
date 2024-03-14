from fastapi import FastAPI
from Routes import chat, user
from fastapi.middleware.cors import CORSMiddleware
import time, requests

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

@app.on_event("shutdown")
def close():
    print("executed for restart")
    while True:
        try:
            for i in range(3):
                data= requests.get("https://chat-api-zu97.onrender.com")
                time.sleep(10)
            break
        except:
            time.sleep(10)

# api_detail = get_openapi(
#     title="Chat API",
#     version="1.0",
#     routes=app.routes,
# )
# app.openapi_schema= api_detail