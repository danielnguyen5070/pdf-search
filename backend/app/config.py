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
    # Comma-separated origins for the Next.js frontend (CORS).
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"
    weaviate_url: str = "http://localhost:8080"
    weaviate_grpc_port: int = 50051

    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
