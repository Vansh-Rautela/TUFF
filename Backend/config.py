"""
Runtime configuration for the TUFF backend.

All values come from environment variables (optionally loaded from Backend/.env)
so that secrets and machine-specific paths never live in source code.
"""
import os

from dotenv import load_dotenv

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BACKEND_DIR, '.env'))


def _bool(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in ('1', 'true', 'yes', 'on')


def _int(name: str, default: int) -> int:
    try:
        return int(os.getenv(name, default))
    except (TypeError, ValueError):
        return default


def _list(name: str, default: str) -> list:
    return [item.strip() for item in os.getenv(name, default).split(',') if item.strip()]


# Server
HOST = os.getenv('TUFF_HOST', '127.0.0.1')
PORT = _int('TUFF_PORT', 5000)
DEBUG = _bool('TUFF_DEBUG', False)
CORS_ORIGINS = _list(
    'TUFF_CORS_ORIGINS',
    'http://localhost:8080,http://127.0.0.1:8080,http://localhost:5173,http://127.0.0.1:5173',
)

# Storage. Paths are resolved relative to the Backend directory, not the
# current working directory, so data lands in the same place however the
# server is started.
DATA_DIR = os.path.abspath(os.path.join(BACKEND_DIR, os.getenv('TUFF_DATA_DIR', 'user_data')))

# Uploads: base64 inflates by ~4/3, so 12 MB of JSON is roughly a 9 MB photo.
MAX_REQUEST_BYTES = _int('TUFF_MAX_REQUEST_BYTES', 12 * 1024 * 1024)
MAX_IMAGE_SIDE = _int('TUFF_MAX_IMAGE_SIDE', 1280)

# Product search (Selenium scrapers)
SCRAPER_WORKERS = _int('TUFF_SCRAPER_WORKERS', 3)
SCRAPER_TIMEOUT_SECONDS = _int('TUFF_SCRAPER_TIMEOUT_SECONDS', 90)
SCRAPE_CACHE_TTL_SECONDS = _int('TUFF_SCRAPE_CACHE_TTL_SECONDS', 15 * 60)
MAX_PRODUCTS_PER_RESPONSE = _int('TUFF_MAX_PRODUCTS', 50)

# TUFFY (Gemini)
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')
GEMINI_MODEL = os.getenv('GEMINI_MODEL', 'gemini-2.5-flash')
GEMINI_TIMEOUT_SECONDS = _int('GEMINI_TIMEOUT_SECONDS', 30)
TUFFY_MAX_SESSIONS = _int('TUFFY_MAX_SESSIONS', 500)
TUFFY_MAX_MESSAGE_CHARS = _int('TUFFY_MAX_MESSAGE_CHARS', 2000)
