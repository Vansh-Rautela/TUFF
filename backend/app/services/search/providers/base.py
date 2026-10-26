"""Store provider contract and the normalized product candidate."""
import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from urllib.parse import urljoin

import httpx

from app.services.color.color_names import canonical_color, color_from_text
from app.services.search.http_client import fetch_text
from app.services.search.product_attributes import category_from_text, gender_from_text, normalize_gender

logger = logging.getLogger(__name__)


@dataclass
class ProductCandidate:
    store: str
    url: str
    title: str
    brand: str | None = None
    price: float | None = None
    mrp: float | None = None
    image_url: str | None = None
    rating: float | None = None
    category: str | None = None
    gender: str | None = None
    color_name: str | None = None
    color_source: str | None = None
    color_hex: str | None = None
    extra: dict = field(default_factory=dict)


def make_candidate(store: str, base_url: str, *, url: str | None, title: str | None, brand: str | None = None,
                   price: float | None = None, mrp: float | None = None, image_url: str | None = None,
                   rating: float | None = None, category: str | None = None, gender: str | None = None,
                   color: str | None = None) -> ProductCandidate | None:
    """Clean and complete a parsed row; None if it lacks a title or a real link."""
    title = " ".join((title or "").split())
    if not title or not url:
        return None
    url = urljoin(base_url, url)
    if not url.startswith("https://") and not url.startswith("http://"):
        return None
    if image_url and image_url.startswith("http://"):
        image_url = "https://" + image_url[len("http://"):]
    if image_url and not image_url.startswith("https://"):
        image_url = None
    store_color = canonical_color(color)
    title_color = color_from_text(title)
    return ProductCandidate(
        store=store, url=url, title=title, brand=(brand or "").strip() or None,
        price=price, mrp=mrp if (mrp and price and mrp > price) else None, image_url=image_url,
        rating=round(rating, 1) if rating else None,
        category=category_from_text(category) or category_from_text(title),
        gender=normalize_gender(gender) or gender_from_text(title),
        color_name=store_color or title_color,
        color_source="store" if store_color else "title" if title_color else None,
    )


class StoreProvider(ABC):
    """A store we can search. Subclasses provide the URL and a pure parser."""

    name: str
    base_url: str
    wait_selector: str | None = None  # element that proves results rendered (browser fallback)
    tier = "fast"

    @abstractmethod
    def search_url(self, query: str) -> str: ...

    @abstractmethod
    def parse(self, html: str) -> list[ProductCandidate]: ...

    async def search(
        self, query: str, http: httpx.AsyncClient, browser=None, limit: int = 24
    ) -> list[ProductCandidate]:
        url = self.search_url(query)
        products: list[ProductCandidate] = []
        try:
            products = self.parse(await fetch_text(http, url))
        except Exception as error:  # blocked, network, markup change
            logger.info("%s HTTP fetch failed: %s", self.name, error)
        if not products and browser is not None:
            logger.info("%s: falling back to headless browser", self.name)
            products = self.parse(await browser.fetch_html(url, self.wait_selector))
        seen: set[str] = set()
        unique = [p for p in products if not (p.url in seen or seen.add(p.url))]
        return unique[:limit]
