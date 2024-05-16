from cryptography.fernet import Fernet
import os

key=''
with open(os.path.dirname(__file__)+"/data/key",'rb') as file:
    key= file.read()

f= Fernet(key)
    
with open(os.path.dirname(__file__)+"/data/encrypt",'rb') as file:
    decrypted= f.decrypt(file.read())
    
print(decrypted.decode())