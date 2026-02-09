import json
import base64

from cryptography.fernet import Fernet

from src.config import settings


def _get_fernet() -> Fernet:
    key = settings.encryption_key
    if not key:
        key = Fernet.generate_key().decode()
    if len(key) != 44:
        key = base64.urlsafe_b64encode(key.ljust(32, "0")[:32].encode()).decode()
    return Fernet(key.encode())


def encrypt_credentials(data: dict) -> str:
    f = _get_fernet()
    return f.encrypt(json.dumps(data).encode()).decode()


def decrypt_credentials(encrypted: str) -> dict:
    f = _get_fernet()
    return json.loads(f.decrypt(encrypted.encode()).decode())
