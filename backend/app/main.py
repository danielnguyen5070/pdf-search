from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.chat import router as chat_router
from app.api.documents import router as documents_router
from app.config import get_settings
from app.services.document_service import get_document_service
from app.services.weaviate_service import close_client, create_collection


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Ensure storage directories and metadata file exist on startup.
    get_document_service()
    # Connect to Weaviate and ensure DocumentChunk collection exists.
    create_collection()
    try:
        yield
    finally:
        close_client()


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list(),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(documents_router)
    app.include_router(chat_router)

    @app.get("/health", tags=["health"])
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    return app


app = create_app()
