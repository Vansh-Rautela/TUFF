from pydantic import BaseModel

from app.db.models import Product


class ProductOut(BaseModel):
    id: str
    store: str
    title: str
    brand: str | None = None
    price: float | None = None
    mrp: float | None = None
    discount_percent: int | None = None
    image_url: str | None = None
    url: str
    rating: float | None = None
    category: str | None = None
    gender: str | None = None
    color_name: str | None = None
    color_hex: str | None = None
    match_score: int | None = None
    match_reasons: list[str] = []

    @classmethod
    def from_product(cls, product: Product, score: int | None = None, reasons: list[str] | None = None):
        discount = None
        if product.price and product.mrp and product.mrp > product.price:
            discount = int(round(100 * (1 - product.price / product.mrp)))
        return cls(
            id=product.id, store=product.store, title=product.title, brand=product.brand, price=product.price,
            mrp=product.mrp, discount_percent=discount, image_url=product.image_url, url=product.url,
            rating=product.rating, category=product.category, gender=product.gender,
            color_name=product.color_name, color_hex=product.color_hex,
            match_score=score, match_reasons=reasons or [],
        )


class StoreStatus(BaseModel):
    store: str
    count: int
    cached: bool
    elapsed_ms: int
    error: str | None = None


class SearchResponse(BaseModel):
    query: str
    products: list[ProductOut]
    stores: list[StoreStatus]
    elapsed_ms: int


class StoreInfo(BaseModel):
    name: str
    tier: str
    default: bool
