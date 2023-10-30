import pyrebase
import firebase_admin
from firebase_admin import auth, credentials, storage as strge
from utils import secret

# generate custom token
cred = credentials.Certificate("Authorize/firebasenote.json")
app = firebase_admin.initialize_app(cred)


#pyrebase requires
firebaseConfig = {
  "apiKey": "AIzaSyARQhb77vGdoiLsl5QlYTLw3UG-XuZAU00",
  "authDomain": "connect-a2cd0.firebaseapp.com",
  "projectId": "connect-a2cd0",
  "storageBucket": "connect-a2cd0.appspot.com",
  "messagingSenderId": "143413505084",
  "appId": "1:143413505084:web:30dedf7cb19ce50ecde739",
  "measurementId": "G-E8MHXXEFSD",
  "databaseURL":""
}

firebase= pyrebase.initialize_app(firebaseConfig)
storage= firebase.storage()



def removeFile(path):
    bucket = strge.bucket(firebaseConfig['storageBucket'])

    try:
        # Delete the image
        blob = bucket.blob(path)
        blob.delete()
        return True
    except Exception as e:
        return False

def uploadFile(file_path, old_path):
    #check if exist
    bucket = strge.bucket(firebaseConfig['storageBucket'])

    if old_path:
        try:
            # Delete the image
            blob = bucket.blob(old_path)
            blob.delete()
        except Exception as e:
            pass
    
    try:
        storage.child(file_path).put(file_path)
        return True
    except:
        return False

def getFile(path):
    try:
        custom_token = auth.create_custom_token(secret.uid, app=app)

        custom_token= custom_token.decode()
        user=firebase.auth().sign_in_with_custom_token(custom_token)

        url= storage.child(path).get_url(user['idToken'])
        return url
    except Exception as err:
        return False
