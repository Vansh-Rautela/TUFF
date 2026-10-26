from fastapi import APIRouter
from sqlalchemy import text

from app.api.deps import ServicesDep

router = APIRouter(tags=["health"])


@router.get("/health", summary="Liveness and which capabilities are available")
async def health(services: ServicesDep):
    async with services.db.sessionmaker() as session:
        await session.execute(text("SELECT 1"))
    return {
        "status": "ok",
        "version": "2.0.0",
        "color_analysis": services.analyzer.detector if services.analyzer else "unavailable",
        "stylist": services.stylist.mode,
        "stores": [s["name"] for s in services.search.stores()],
    }
