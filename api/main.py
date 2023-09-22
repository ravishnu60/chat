from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi
from db import engine
from Models.model import base
from Routes import chat

app=FastAPI()
base.metadata.create_all(engine)

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