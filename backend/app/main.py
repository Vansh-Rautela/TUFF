"""TUFF API entry point.

    uv run uvicorn app.main:app --reload          # development
    uv run uvicorn app.main:app --host 0.0.0.0     # production (behind a proxy)
"""
import time
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from app.api.v1.router import api_router
from app.core.config import Settings, get_settings
from app.core.errors import register_error_handlers
from app.core.logging import configure_logging, request_id_var
from app.services.container import build_services


def create_app(settings: Settings | None = None, services_factory=None) -> FastAPI:
    settings = settings or get_settings()
    configure_logging(settings.log_level)

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        factory = services_factory or (lambda: build_services(settings, create_tables=settings.auto_create_tables))
        app.state.services = await factory()
        yield
        await app.state.services.close()

    app = FastAPI(
        title="TUFF API",
        version="2.0.0",
        description="Personal color analysis, multi-store fashion search and explainable recommendations.",
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url=None,
    )
    app.add_middleware(GZipMiddleware, minimum_size=1024)
    app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origins, allow_methods=["*"],
                       allow_headers=["*"], expose_headers=["X-Request-ID", "Server-Timing"])

    @app.middleware("http")
    async def request_context(request: Request, call_next):
        request_id = request.headers.get("X-Request-ID", "")[:64] or uuid.uuid4().hex[:12]
        token = request_id_var.set(request_id)
        started = time.perf_counter()
        try:
            response = await call_next(request)
        finally:
            request_id_var.reset(token)
        response.headers["X-Request-ID"] = request_id
        response.headers["Server-Timing"] = f"app;dur={(time.perf_counter() - started) * 1000:.1f}"
        return response

    register_error_handlers(app)
    app.include_router(api_router)
    return app


app = create_app()
