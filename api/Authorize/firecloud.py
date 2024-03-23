from firebase_admin import credentials, storage
from cryptography.fernet import Fernet
import firebase_admin, os, json, datetime
from utils import secret

# decode the credentials
with open(os.path.dirname(__file__)+"/data/key",'rb') as file:
    key= file.read()
f= Fernet(key)
with open(os.path.dirname(__file__)+"/data/encrypt",'rb') as file:
    decrypted= f.decrypt(file.read())

base_token= json.loads(decrypted.decode())

# initialize
cred = credentials.Certificate(base_token)
app = firebase_admin.initialize_app(cred)

bucket = storage.bucket( secret.bucket_id)

def removeFile(path):
    try:
        # Delete the image
        blob = bucket.blob(path)
        blob.delete()
        return True
    except Exception as e:
        return False

def uploadFile(file_path, old_path):
    print(file_path)
    if old_path:
        try:
            # Delete the image
            blob = bucket.blob(old_path)
            blob.delete()
        except Exception as e:
            pass
    try:
        blob = bucket.blob(file_path)
        blob.upload_from_filename(file_path)
        return True
    except Exception as Err:
        print(Err)
        return False

def getFile(path):
    blob = bucket.blob(path)
    try:
        # for public url
        url= blob.generate_signed_url(datetime.timedelta(days=365))  #-- signed url with expire time
        return url
    except Exception as err:
        return False
