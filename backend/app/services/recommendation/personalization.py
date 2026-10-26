"""Turn raw search results into a personal, explained list."""
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import NotFoundError
from app.db.models import Product, Profile
from app.repositories import user_repository as users_repo
from app.schemas.products import ProductOut
from app.services.recommendation.ranker import rank_products
from app.services.recommendation.taste_profile import TasteProfile, build_taste_profile


async def load_user_context(session: AsyncSession, user_id: str | None) -> tuple[Profile | None, TasteProfile | None]:
    if not user_id:
        return None, None
    try:
        profile = await users_repo.get_profile(session, user_id)
    except NotFoundError:
        return None, None
    return profile, build_taste_profile(await users_repo.interactions(session, user_id))


def interleave_stores(products: list[Product]) -> list[Product]:
    """Round-robin across stores so no single store dominates an unranked list."""
    by_store: dict[str, list[Product]] = {}
    for product in products:
        by_store.setdefault(product.store, []).append(product)
    queues = list(by_store.values())
    result = []
    while queues:
        result.extend(q.pop(0) for q in queues)
        queues = [q for q in queues if q]
    return result


def personalize(products: list[Product], profile: Profile | None, taste: TasteProfile | None,
                *, exclude_seen: bool = False) -> list[ProductOut]:
    unique = list({p.id: p for p in products}.values())
    if profile is None:
        return [ProductOut.from_product(p) for p in interleave_stores(unique)]
    ranked = rank_products(interleave_stores(unique), profile, taste, exclude_seen=exclude_seen)
    return [ProductOut.from_product(r.product, r.score, r.reasons) for r in ranked]
