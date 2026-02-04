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
    
    # OpenAI settings
    openai_api_key: str = field(
        default_factory=lambda: os.getenv("OPENAI_API_KEY", "")
    )
    openai_model: str = field(
        default_factory=lambda: os.getenv("OPENAI_MODEL", "gpt-5-nano-2025-08-07")
    )
    openai_max_output_tokens: int = field(
        default_factory=lambda: int(os.getenv("OPENAI_MAX_OUTPUT_TOKENS", "600"))
    )
    openai_temperature: float = field(
        default_factory=lambda: float(os.getenv("OPENAI_TEMPERATURE", "0.2"))
    )
    
    # Feature flags
    use_llm: bool = field(
        default_factory=lambda: os.getenv("USE_LLM", "true").lower() == "true"
    )


def _parse_cors_origins() -> List[str]:
    """Parse CORS origins from environment variable."""
    origins_str = os.getenv(
        "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
    )
    return [origin.strip() for origin in origins_str.split(",") if origin.strip()]


settings = Settings()

