from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "PDF Search API"
    app_version: str = "0.1.0"
    storage_dir: Path = Path("storage/pdfs")
    metadata_file: Path = Path("storage/metadata.json")
    host: str = "0.0.0.0"
    port: int = 8000
    allowed_content_type: str = "application/pdf"
    allowed_extension: str = ".pdf"


@lru_cache
def get_settings() -> Settings:
    return Settings()
