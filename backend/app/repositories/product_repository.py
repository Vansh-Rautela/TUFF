"""Product catalog and cached store searches."""
import hashlib
from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Product, SearchResult, utcnow
from app.services.search.providers.base import ProductCandidate


def product_id_for(url: str) -> str:
    return hashlib.sha1(url.encode()).hexdigest()


async def upsert_products(session: AsyncSession, candidates: list[ProductCandidate]) -> list[Product]:
    """Insert new products and refresh existing ones; returns them in input order."""
    by_id = {product_id_for(c.url): c for c in candidates}
    existing = {p.id: p for p in (await session.scalars(select(Product).where(Product.id.in_(by_id)))).all()}
    now = utcnow()
    ordered = []
    for product_id, c in by_id.items():
        product = existing.get(product_id)
        if product is None:
            product = Product(id=product_id, store=c.store, url=c.url, first_seen_at=now)
            session.add(product)
        product.title = c.title
        product.brand = c.brand
        product.price = c.price
        product.mrp = c.mrp
        product.image_url = c.image_url or product.image_url
        product.rating = c.rating or product.rating
        product.category = c.category or product.category
        product.gender = c.gender or product.gender
        if c.color_name and (c.color_source == "image" or product.color_source != "image"):
            product.color_name, product.color_source = c.color_name, c.color_source
        if c.color_hex:
            product.color_hex = c.color_hex
        product.last_seen_at = now
        ordered.append(product)
    await session.flush()
    return ordered


async def measured_colors(session: AsyncSession, urls: list[str]) -> dict[str, str]:
    """product id -> color hex for products whose photo was already measured."""
    ids = [product_id_for(u) for u in urls]
    rows = await session.execute(select(Product.id, Product.color_hex).where(
        Product.id.in_(ids), Product.color_hex.is_not(None)))
    return dict(rows.all())


async def get_products(session: AsyncSession, ids: list[str]) -> list[Product]:
    found = {p.id: p for p in (await session.scalars(select(Product).where(Product.id.in_(ids)))).all()}
    return [found[i] for i in ids if i in found]


async def get_cached_search(session: AsyncSession, store: str, query: str, ttl_seconds: int) -> list[Product] | None:
    row = await session.scalar(select(SearchResult).where(SearchResult.store == store, SearchResult.query == query))
    if row is None:
        return None
    fetched = row.fetched_at if row.fetched_at.tzinfo else row.fetched_at.replace(tzinfo=UTC)
    if datetime.now(UTC) - fetched > timedelta(seconds=ttl_seconds):
        return None
    return await get_products(session, row.product_ids)


async def save_search(session: AsyncSession, store: str, query: str, products: list[Product]) -> None:
    row = await session.scalar(select(SearchResult).where(SearchResult.store == store, SearchResult.query == query))
    if row is None:
        row = SearchResult(store=store, query=query, product_ids=[])
        session.add(row)
    row.product_ids = [p.id for p in products]
    row.fetched_at = utcnow()
