from fastapi import FastAPI
import requests,time

app= FastAPI()

@app.on_event("startup")
def start():
    while True:
        try:
            data= requests.get("https://chat-api-zu97.onrender.com")
            print(data.json())
            time.sleep(300)
        except:
            print("error")
            time.sleep(300)