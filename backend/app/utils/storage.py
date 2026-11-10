import os
import uuid
from werkzeug.utils import secure_filename
from app.config import Config

def init_storage_dirs():
    os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
    os.makedirs(Config.EXPORT_FOLDER, exist_ok=True)

def allowed_file(filename: str) -> bool:
    if '.' not in filename:
        return False
    ext = filename.rsplit('.', 1)[1].lower()
    return ext in Config.ALLOWED_EXTENSIONS

def save_uploaded_file(file_storage, user_id: str) -> tuple[str, str, str]:
    """
    Saves an uploaded file to private storage.
    Returns: (storage_key, original_filename, file_extension)
    """
    init_storage_dirs()
    original_name = secure_filename(file_storage.filename or 'resume')
    ext = original_name.rsplit('.', 1)[1].lower() if '.' in original_name else 'docx'
    
    unique_name = f"{user_id}_{uuid.uuid4().hex}.{ext}"
    dest_path = os.path.join(Config.UPLOAD_FOLDER, unique_name)
    file_storage.save(dest_path)
    
    return unique_name, original_name, ext

def get_upload_path(storage_key: str) -> str:
    return os.path.join(Config.UPLOAD_FOLDER, storage_key)

def get_export_path(storage_key: str) -> str:
    return os.path.join(Config.EXPORT_FOLDER, storage_key)

