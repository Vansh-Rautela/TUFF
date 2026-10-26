"""Long-lived services, created once at startup and shared by requests."""
import asyncio
import logging
from dataclasses import dataclass

import httpx

from app.core.config import Settings
from app.db.session import Database
from app.services.color.face_landmarks import FaceLocator
from app.services.color.skin_tone_analyzer import SkinToneAnalyzer
from app.services.search.browser_pool import BrowserPool
from app.services.search.http_client import create_http_client
from app.services.search.providers.amazon import AmazonProvider
from app.services.search.providers.flipkart import FlipkartProvider
from app.services.search.providers.legacy_selenium import legacy_providers
from app.services.search.providers.myntra import MyntraProvider
from app.services.search.search_engine import SearchEngine
from app.services.stylist.stylist_service import GeminiStylist, StylistService

logger = logging.getLogger(__name__)


@dataclass
class Services:
    settings: Settings
    db: Database
    http: httpx.AsyncClient
    browser: BrowserPool | None
    search: SearchEngine
    analyzer: SkinToneAnalyzer | None
    stylist: StylistService

    async def close(self) -> None:
        if self.browser is not None:
            await self.browser.close()
        await self.http.aclose()
        if self.analyzer is not None:
            self.analyzer.close()
        await self.db.dispose()


def _load_analyzer(settings: Settings) -> SkinToneAnalyzer | None:
    try:
        return SkinToneAnalyzer(FaceLocator(settings.face_landmarker_model, settings.face_detector_model))
    except Exception as error:
        logger.error("Color analysis disabled: %s", error)
        return None


async def build_services(settings: Settings, *, create_tables: bool = True, http: httpx.AsyncClient | None = None,
                         providers=None, analyzer: SkinToneAnalyzer | None = None,
                         stylist: StylistService | None = None, load_analyzer: bool = True) -> Services:
    db = Database(settings.database_url)
    if create_tables:
        await db.create_all()
    http = http or create_http_client()
    browser = None
    if settings.browser_fallback:
        browser = BrowserPool(settings.browser_executable, settings.browser_max_pages)
    if providers is None:
        providers = [MyntraProvider(), FlipkartProvider(), AmazonProvider()]
        if settings.legacy_scrapers:
            providers += legacy_providers()
    search = SearchEngine(
        db, http, providers, browser=browser,
        timeout_seconds=settings.search_timeout_seconds,
        cache_ttl_seconds=settings.search_cache_ttl_seconds,
        per_store_limit=settings.max_products_per_store,
        color_budget_seconds=settings.garment_color_budget_seconds,
    )
    if analyzer is None and load_analyzer:
        analyzer = await asyncio.to_thread(_load_analyzer, settings)
    if stylist is None:
        gemini = None
        if settings.gemini_api_key:
            try:
                gemini = GeminiStylist(settings.gemini_api_key, settings.gemini_model,
                                       settings.gemini_timeout_seconds, settings.stylist_max_sessions)
            except Exception as error:
                logger.error("Gemini unavailable (%s); stylist runs in concierge mode.", error)
        stylist = StylistService(gemini)
    return Services(settings, db, http, browser, search, analyzer, stylist)
