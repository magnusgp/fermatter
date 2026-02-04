"""Application configuration."""

import os
from dataclasses import dataclass, field
from typing import List

from dotenv import load_dotenv

load_dotenv()


@dataclass
class Settings:
    """Application settings loaded from environment variables."""

    env: str = field(default_factory=lambda: os.getenv("ENV", "development"))
    log_level: str = field(default_factory=lambda: os.getenv("LOG_LEVEL", "INFO"))
    cors_origins: List[str] = field(default_factory=lambda: _parse_cors_origins())


def _parse_cors_origins() -> List[str]:
    """Parse CORS origins from environment variable."""
    origins_str = os.getenv(
        "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
    )
    return [origin.strip() for origin in origins_str.split(",") if origin.strip()]


settings = Settings()
