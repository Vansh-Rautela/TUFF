"""Request-scoped dependencies."""
from collections.abc import AsyncIterator
from typing import Annotated

from fastapi import Depends, Path, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.rate_limit import client_key, rate_limiter
from app.services.container import Services

USER_ID_PATTERN = r"^[A-Za-z0-9_-]{1,64}$"
UserId = Annotated[str, Path(pattern=USER_ID_PATTERN, description="Opaque user id from POST /users")]


def get_services(request: Request) -> Services:
    return request.app.state.services


async def get_session(services: Annotated[Services, Depends(get_services)]) -> AsyncIterator[AsyncSession]:
    async with services.db.sessionmaker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


def rate_limit(bucket: str):
    def dependency(request: Request, services: Annotated[Services, Depends(get_services)]) -> None:
        limit = getattr(services.settings, f"rate_limit_{bucket}")
        rate_limiter.check(bucket, client_key(request), limit)

    return Depends(dependency)


ServicesDep = Annotated[Services, Depends(get_services)]
SessionDep = Annotated[AsyncSession, Depends(get_session)]
