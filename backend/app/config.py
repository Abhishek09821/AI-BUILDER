import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / '.env')

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'applymate-super-secret-key-change-in-prod-2026')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'applymate-jwt-token-secret-key-2026')
    JWT_EXPIRATION_HOURS = int(os.getenv('JWT_EXPIRATION_HOURS', '72'))
    
    # Database config: default to local PostgreSQL if available, otherwise fallback to SQLite
    DEFAULT_PG_URL = 'postgresql://localhost:5432/applymate'
    DATABASE_URL = os.getenv('DATABASE_URL', DEFAULT_PG_URL)
    
    # SQLAlchemy
    SQLALCHEMY_DATABASE_URI = DATABASE_URL
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # LLM Settings
    LLM_PROVIDER = os.getenv('LLM_PROVIDER', 'gemini') # gemini | openai | mock
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '')
    
    # File Storage (Always resolve to absolute path under backend)
    env_storage = os.getenv('STORAGE_DIR')
    if env_storage and os.path.isabs(env_storage):
        STORAGE_DIR = env_storage
    else:
        STORAGE_DIR = str(BASE_DIR / 'storage')
        
    UPLOAD_FOLDER = os.path.join(STORAGE_DIR, 'uploads')
    EXPORT_FOLDER = os.path.join(STORAGE_DIR, 'exports')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024 # 16 MB max upload
    ALLOWED_EXTENSIONS = {'docx', 'pdf'}
    
    # CORS
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173').split(',')
