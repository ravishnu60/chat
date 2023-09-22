from passlib.context import CryptContext

encKey= CryptContext(schemes=['bcrypt'])

def encrypt(password):
    return encKey.hash(password)

def verify(plain,encrypted):
    return encKey.verify(secret=plain,hash=encrypted)