"""Application settings, read from environment variables or backend/.env."""
from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=BACKEND_DIR / ".env", env_prefix="TUFF_", extra="ignore")

    # Server
    environment: str = "development"
    host: str = "127.0.0.1"
    port: int = 8000
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:8080"]
    log_level: str = "INFO"

    # Storage
    database_url: str = f"sqlite+aiosqlite:///{BACKEND_DIR / 'data' / 'tuff.db'}"
    auto_create_tables: bool = True  # dev convenience; production runs `alembic upgrade head`

    # Uploads / image analysis
    max_upload_bytes: int = 10 * 1024 * 1024
    max_image_side: int = 1280
    models_dir: Path = BACKEND_DIR / "models"

    @property
    def face_landmarker_model(self) -> Path:
        return self.models_dir / "face_landmarker.task"

    @property
    def face_detector_model(self) -> Path:
        return self.models_dir / "face_detection_yunet_2023mar.onnx"

    # Product search
    search_timeout_seconds: float = 12.0
    search_cache_ttl_seconds: int = 30 * 60
    max_products_per_store: int = 24
    browser_fallback: bool = True
    browser_executable: str | None = None  # e.g. /usr/bin/chromium; default: Playwright's bundled Chromium
    browser_max_pages: int = 4
    legacy_scrapers: bool = True
    garment_color_budget_seconds: float = 4.0

    # Rate limits (requests per minute per client IP)
    rate_limit_search: int = 30
    rate_limit_analysis: int = 10
    rate_limit_stylist: int = 20

    # Stylist (Gemini). Read without the TUFF_ prefix: the conventional name.
    gemini_api_key: str = Field(default="", validation_alias="GEMINI_API_KEY")
    gemini_model: str = Field(default="gemini-2.5-flash", validation_alias="GEMINI_MODEL")
    gemini_timeout_seconds: int = 30
    stylist_max_sessions: int = 500

    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()
