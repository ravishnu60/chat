from cryptography.fernet import Fernet
import os

if not os.path.exists(os.getcwd()+"/data"):
    os.makedirs(os.getcwd()+"/data")
key=  Fernet.generate_key()
with open(os.path.dirname(__file__)+"/data/key",'wb') as file:
    file.write(key)

dataToEncrypt=input("Enter text : ")

f= Fernet(key)
encode = f.encrypt(dataToEncrypt.encode())
with open(os.path.dirname(__file__)+"/data/encrypt",'wb') as file:
    file.write(encode)