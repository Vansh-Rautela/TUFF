"""Adapter for the original Selenium scrapers (12 more stores).

These are slow (a Chrome per search) and fragile, so they only run when the
optional `legacy-scrapers` extra is installed and a store is explicitly chosen.
"""
import asyncio
import importlib
import logging
import math

from app.services.search.product_attributes import parse_price
from app.services.search.providers.base import ProductCandidate, StoreProvider, make_candidate

logger = logging.getLogger(__name__)
LEGACY_PACKAGE = "app.services.search.legacy"

LEGACY_STORES: dict[str, tuple[str, str, str]] = {  # store -> (module, function, base url)
    "Ajio": ("retail_scrapers", "scrape_ajio", "https://www.ajio.com/"),
    "Nykaa Fashion": ("retail_scrapers", "scrape_nykaa", "https://www.nykaafashion.com/"),
    "Zara": ("retail_scrapers", "scrape_zara", "https://www.zara.com/in/"),
    "H&M": ("retail_scrapers", "scrape_hnm", "https://www2.hm.com/en_in/"),
    "Levi's": ("retail_scrapers", "scrape_levis", "https://levi.in/"),
    "Lifestyle": ("retail_scrapers", "scrape_lifestyle", "https://www.lifestylestores.com/"),
    "Bewakoof": ("retail_scrapers", "scrape_bewakoof", "https://www.bewakoof.com/"),
    "Westside": ("westside_urbanic_scrapers", "scrape_westside", "https://www.westside.com/"),
    "Urbanic": ("westside_urbanic_scrapers", "scrape_urbanic", "https://in.urbanic.com/"),
    "Libas": ("libas_scraper", "scrape_libas", "https://www.libas.in/"),
    "Monte Carlo": ("monte_carlo_scraper", "scrape_monte_carlo", "https://www.montecarlo.in/"),
    "The Souled Store": ("souled_store_scraper", "scrape_souled_store", "https://www.thesouledstore.com/"),
}


def _value(row: dict, *keys):
    for key in keys:
        value = row.get(key)
        if value is not None and not (isinstance(value, float) and math.isnan(value)):
            text = str(value).strip()
            if text and text.lower() not in {"no title", "no image", "no price", "#", "nan"}:
                return text
    return None


class LegacySeleniumProvider(StoreProvider):
    tier = "legacy"

    def __init__(self, name: str, module: str, function: str, base_url: str):
        self.name = name
        self.base_url = base_url
        self._module = module
        self._function = function

    def search_url(self, query: str) -> str:  # the legacy function builds its own URL
        return self.base_url

    def parse(self, html: str) -> list[ProductCandidate]:
        return []

    def _rows(self, query: str) -> list[dict]:
        scraper = getattr(importlib.import_module(f"{LEGACY_PACKAGE}.{self._module}"), self._function)
        frame = scraper(query)
        return frame.to_dict(orient="records") if frame is not None and not frame.empty else []

    async def search(self, query: str, http=None, browser=None, limit: int = 24) -> list[ProductCandidate]:
        rows = await asyncio.to_thread(self._rows, query)
        results = []
        for row in rows:
            candidate = make_candidate(
                self.name, self.base_url,
                url=_value(row, "Link", "link", "url"),
                title=_value(row, "Title", "title"),
                price=parse_price(_value(row, "Price", "price")),
                image_url=_value(row, "Image", "image", "thumbnail"),
            )
            if candidate:
                results.append(candidate)
        return results[:limit]


def legacy_providers() -> list[LegacySeleniumProvider]:
    try:
        importlib.import_module("selenium")
        importlib.import_module("pandas")
    except ImportError:
        logger.info("Legacy Selenium scrapers disabled (install the 'legacy-scrapers' extra to enable).")
        return []
    return [LegacySeleniumProvider(name, *spec) for name, spec in LEGACY_STORES.items()]
