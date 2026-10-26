import json
import time
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse

from app.api.deps import USER_ID_PATTERN, ServicesDep, SessionDep, rate_limit
from app.db.models import Product
from app.repositories import user_repository as users_repo
from app.schemas.products import ProductOut, SearchResponse, StoreInfo, StoreStatus
from app.services.recommendation.personalization import load_user_context, personalize
from app.services.search.query_builder import build_query

router = APIRouter(prefix="/products", tags=["products"])


class SearchParams:
    def __init__(
        self,
        q: Annotated[str, Query(max_length=120, description="What the user typed")] = "",
        store: Annotated[list[str], Query(description="Stores to search (repeatable); default: fast stores")] = [],  # noqa: B006
        gender: Annotated[str | None, Query(max_length=10)] = None,
        style: Annotated[list[str], Query(max_length=10)] = [],  # noqa: B006
        min_price: Annotated[float | None, Query(ge=0)] = None,
        max_price: Annotated[float | None, Query(ge=0)] = None,
        user_id: Annotated[str | None, Query(pattern=USER_ID_PATTERN)] = None,
        exclude_seen: bool = False,
    ):
        self.q, self.stores, self.gender, self.styles = q, store, gender, style
        self.min_price, self.max_price, self.user_id, self.exclude_seen = min_price, max_price, user_id, exclude_seen

    def in_price_range(self, product: Product) -> bool:
        if self.min_price is None and self.max_price is None:
            return True
        if product.price is None:
            return False
        return (self.min_price or 0) <= product.price <= (self.max_price or float("inf"))


async def _query_for(params: SearchParams, session) -> str:
    gender, styles = params.gender, params.styles
    if params.user_id and (gender is None or not styles):
        profile, _ = await load_user_context(session, params.user_id)
        if profile:
            gender = gender or profile.gender
            styles = styles or profile.styles
    return build_query(params.q, gender, styles)


@router.get("/stores", response_model=list[StoreInfo])
async def list_stores(services: ServicesDep):
    return services.search.stores()


@router.get("/search", response_model=SearchResponse, dependencies=[rate_limit("search")],
            summary="Search stores and (with user_id) rank results for that user")
async def search_products(services: ServicesDep, session: SessionDep, params: Annotated[SearchParams, Depends()]):
    started = time.perf_counter()
    query = await _query_for(params, session)
    results = await services.search.search(query, services.search.resolve_stores(params.stores))
    products = [p for r in results for p in r.products if params.in_price_range(p)]
    profile, taste = await load_user_context(session, params.user_id)
    return SearchResponse(
        query=query,
        products=personalize(products, profile, taste, exclude_seen=params.exclude_seen),
        stores=[StoreStatus(store=r.store, count=len(r.products), cached=r.cached, elapsed_ms=r.elapsed_ms,
                            error=r.error) for r in results],
        elapsed_ms=int((time.perf_counter() - started) * 1000),
    )


@router.get("/search/stream", dependencies=[rate_limit("search")],
            summary="Server-Sent Events: one `store` event per store as soon as it answers, then `done`")
async def stream_products(services: ServicesDep, session: SessionDep, params: Annotated[SearchParams, Depends()]):
    query = await _query_for(params, session)
    profile, taste = await load_user_context(session, params.user_id)
    stores = services.search.resolve_stores(params.stores)

    async def events():
        started = time.perf_counter()
        yield f"event: start\ndata: {json.dumps({'query': query, 'stores': stores})}\n\n"
        async for result in services.search.stream(query, stores):
            products = [p for p in result.products if params.in_price_range(p)]
            payload = {
                "store": StoreStatus(store=result.store, count=len(products), cached=result.cached,
                                     elapsed_ms=result.elapsed_ms, error=result.error).model_dump(),
                "products": [p.model_dump() for p in personalize(products, profile, taste,
                                                                  exclude_seen=params.exclude_seen)],
            }
            yield f"event: store\ndata: {json.dumps(payload)}\n\n"
        yield f"event: done\ndata: {json.dumps({'elapsed_ms': int((time.perf_counter() - started) * 1000)})}\n\n"

    return StreamingResponse(events(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


@router.get("/{product_id}", response_model=ProductOut)
async def get_product(product_id: str, session: SessionDep):
    return ProductOut.from_product(await users_repo.get_product(session, product_id))
