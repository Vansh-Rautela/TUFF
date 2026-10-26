"""Multi-store product search.

    query ──► per store: memory cache ─► SQLite cache ─► provider (HTTP, then browser)
                                             │
                     upsert into catalog ◄───┘──► garment color from photos (time-boxed)

Stores run concurrently, each with its own timeout, so one slow store never
blocks the others. `stream()` yields each store's results as soon as they
arrive. Identical searches already in flight share one fetch.
"""
import asyncio
import logging
import time
from collections import OrderedDict
from collections.abc import AsyncIterator
from dataclasses import dataclass, field

import httpx

from app.db.models import Product
from app.db.session import Database
from app.repositories import product_repository as products_repo
from app.services.color.color_names import RETAIL_COLORS, color_lab
from app.services.color.color_science import delta_e_2000, hex_to_rgb, rgb_to_lab
from app.services.color.garment_color import GarmentColor, dominant_garment_color
from app.services.search.browser_pool import BrowserPool
from app.services.search.providers.base import ProductCandidate, StoreProvider

logger = logging.getLogger(__name__)

DEFAULT_STORES = ("Myntra", "Flipkart", "Amazon")
LABEL_TRUST_DELTA_E = 35  # if the photo disagrees with the store's color label this much, trust the label


@dataclass
class StoreResult:
    store: str
    products: list[Product] = field(default_factory=list)
    error: str | None = None
    cached: bool = False
    elapsed_ms: int = 0


class SearchEngine:
    def __init__(self, db: Database, http: httpx.AsyncClient, providers: list[StoreProvider], *,
                 browser: BrowserPool | None, timeout_seconds: float, cache_ttl_seconds: int,
                 per_store_limit: int, color_budget_seconds: float):
        self.db = db
        self.http = http
        self.browser = browser
        self.providers = {p.name: p for p in providers}
        self.timeout = timeout_seconds
        self.cache_ttl = cache_ttl_seconds
        self.per_store_limit = per_store_limit
        self.color_budget = color_budget_seconds
        self._memory: OrderedDict[tuple[str, str], tuple[float, list[Product]]] = OrderedDict()
        self._in_flight: dict[tuple[str, str], asyncio.Task] = {}
        self._image_semaphore = asyncio.Semaphore(16)
        self._write_lock = asyncio.Lock()

    # ---- store selection -------------------------------------------------
    def stores(self) -> list[dict]:
        return [{"name": p.name, "tier": p.tier, "default": p.name in DEFAULT_STORES} for p in self.providers.values()]

    def resolve_stores(self, requested: list[str] | None) -> list[str]:
        chosen = [s for s in dict.fromkeys(requested or []) if s in self.providers]
        return chosen or [s for s in DEFAULT_STORES if s in self.providers]

    # ---- public API --------------------------------------------------------
    async def search(self, query: str, stores: list[str]) -> list[StoreResult]:
        return list(await asyncio.gather(*(self._store_result(s, query) for s in stores)))

    async def stream(self, query: str, stores: list[str]) -> AsyncIterator[StoreResult]:
        tasks = [asyncio.create_task(self._store_result(s, query)) for s in stores]
        try:
            for next_done in asyncio.as_completed(tasks):
                yield await next_done
        finally:
            for task in tasks:
                task.cancel()

    # ---- internals -------------------------------------------------------------
    async def _store_result(self, store: str, query: str) -> StoreResult:
        started = time.perf_counter()
        key = (store, query.strip().lower())
        result = StoreResult(store=store)
        try:
            cached = await self._cached(key)
            if cached is not None:
                result.products, result.cached = cached, True
            else:
                task = self._in_flight.get(key)
                if task is None:
                    task = asyncio.create_task(self._fetch_and_store(key))
                    self._in_flight[key] = task
                    task.add_done_callback(lambda _t, key=key: self._in_flight.pop(key, None))
                timeout = self.timeout * (3 if self.providers[store].tier == "legacy" else 1)
                result.products = await asyncio.wait_for(asyncio.shield(task), timeout)
        except TimeoutError:
            result.error = "timed out"
        except Exception as error:
            logger.warning("Search on %s failed: %s", store, error)
            result.error = "unavailable"
        result.elapsed_ms = int((time.perf_counter() - started) * 1000)
        return result

    async def _cached(self, key: tuple[str, str]) -> list[Product] | None:
        hit = self._memory.get(key)
        if hit and time.monotonic() - hit[0] < self.cache_ttl:
            self._memory.move_to_end(key)
            return hit[1]
        async with self.db.sessionmaker() as session:
            products = await products_repo.get_cached_search(session, key[0], key[1], self.cache_ttl)
        if products is not None:
            self._remember(key, products)
        return products

    def _remember(self, key: tuple[str, str], products: list[Product]) -> None:
        self._memory[key] = (time.monotonic(), products)
        self._memory.move_to_end(key)
        while len(self._memory) > 256:
            self._memory.popitem(last=False)

    async def _fetch_and_store(self, key: tuple[str, str]) -> list[Product]:
        store, query = key
        candidates = await self.providers[store].search(query, self.http, self.browser, self.per_store_limit)
        await self._add_garment_colors(candidates)
        # Writes are short and serialized: concurrent searches often return the same products.
        async with self._write_lock, self.db.sessionmaker() as session:
            products = await products_repo.upsert_products(session, candidates)
            await products_repo.save_search(session, store, query, products)
            await session.commit()
        self._remember(key, products)
        logger.info("%s returned %d products for %r", store, len(products), query)
        return products

    # ---- garment colors --------------------------------------------------------
    async def _measure(self, candidate: ProductCandidate) -> GarmentColor | None:
        async with self._image_semaphore:
            response = await self.http.get(candidate.image_url, timeout=6.0)
            response.raise_for_status()
        return await asyncio.to_thread(dominant_garment_color, response.content, candidate.category)

    async def _add_garment_colors(self, candidates: list[ProductCandidate]) -> None:
        """Measure colors from product photos within the time budget.

        The photo sets the exact shade (color_hex). The store's own color label
        wins for the name, and also for the shade when the photo strongly
        disagrees with it (prints, multi-color shots).
        """
        async with self.db.sessionmaker() as session:
            known = await products_repo.measured_colors(session, [c.url for c in candidates])
        todo = [c for c in candidates if c.image_url and products_repo.product_id_for(c.url) not in known]
        measured: dict[str, GarmentColor] = {}
        if todo:
            tasks = {asyncio.create_task(self._measure(c)): c for c in todo}
            done, pending = await asyncio.wait(tasks, timeout=self.color_budget)
            for task in pending:
                task.cancel()
            for task in done:
                if not task.cancelled() and task.exception() is None and task.result() is not None:
                    measured[tasks[task].url] = task.result()
        for candidate in candidates:
            color = measured.get(candidate.url)
            if color is not None:
                agrees = not candidate.color_name or float(delta_e_2000(
                    color_lab(candidate.color_name), rgb_to_lab(hex_to_rgb(color.hex)))) < LABEL_TRUST_DELTA_E
                if agrees:
                    candidate.color_hex = color.hex
                    if not candidate.color_name:
                        candidate.color_name, candidate.color_source = color.name, "image"
                    continue
            if candidate.color_name and products_repo.product_id_for(candidate.url) not in known:
                candidate.color_hex = RETAIL_COLORS.get(candidate.color_name)
