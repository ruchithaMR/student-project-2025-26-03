"""
Configuration file for the Fake News Detection Backend
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Base directory
BASE_DIR = Path(__file__).parent

# Flask Configuration
DEBUG = os.getenv('DEBUG', 'True') == 'True'
HOST = os.getenv('HOST', '0.0.0.0')
PORT = int(os.getenv('PORT', 5000))

# Runtime pipeline no longer depends on a local ML model.
MAX_SEQUENCE_LENGTH = 256

# File Upload Configuration
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
MAX_UPLOAD_SIZE = 16 * 1024 * 1024  # 16MB
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff'}

# API Keys (set these in .env file)
NEWSAPI_KEY = os.getenv('NEWSAPI_KEY', '')
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '')
OPENAI_MODEL = os.getenv('OPENAI_MODEL', 'gpt-4o-mini')
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')
GEMINI_MODEL = os.getenv('GEMINI_MODEL', 'gemini-2.0-flash')
OLLAMA_BASE_URL = os.getenv('OLLAMA_BASE_URL', 'http://localhost:11434')
OLLAMA_MODEL = os.getenv('OLLAMA_MODEL', 'qwen2.5:3b')
OLLAMA_VISION_MODEL = os.getenv('OLLAMA_VISION_MODEL', 'gemma3:1b')
LLM_PROVIDER = os.getenv('LLM_PROVIDER', 'auto').lower()
OPENAI_TIMEOUT_SECONDS = int(os.getenv('OPENAI_TIMEOUT_SECONDS', 20))

# CoinGecko API
COINGECKO_API_URL = 'https://api.coingecko.com/api/v3'

# CORS Configuration
CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:5173,http://localhost:3000').split(',')

# Logging Configuration
LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
LOG_FILE = os.path.join(BASE_DIR, 'logs', 'app.log')
LAYER_ANALYSIS_LOGS = os.getenv('LAYER_ANALYSIS_LOGS', 'True') == 'True'

# MongoDB Atlas Configuration
MONGODB_URI = os.getenv('MONGODB_URI', None)

# Database Configuration (for future use - legacy)
DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///fakenews.db')

# Cache Configuration
CACHE_TYPE = 'simple'
CACHE_DEFAULT_TIMEOUT = 300  # 5 minutes

# Security
SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')

# Verification Thresholds
CRYPTO_PRICE_TOLERANCE_PCT = 10  # Allow 10% difference
SOURCE_CREDIBILITY_THRESHOLD = 70
