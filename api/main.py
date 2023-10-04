from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi
from Routes import chat
from fastapi.middleware.cors import CORSMiddleware

app=FastAPI()
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

api_detail = get_openapi(
    title="Chat API",
    version="1.0",
    routes=app.routes,
)
app.openapi_schema= api_detail