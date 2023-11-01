from fastapi import FastAPI
import requests,time, datetime

app= FastAPI()

@app.get("/")
def opne():
    return {"status":200, "detail":"API is running"}
@app.on_event("shutdown")
def start():
    while True:
        try:
            for i in range(3):
                data= requests.get("https://runnn.onrender.com")
                print(data.json(), datetime.datetime.now().today().time())
                time.sleep(30)
            break
        except:
            print("error")
            time.sleep(30)