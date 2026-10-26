"""One shared headless Chromium (Playwright) for stores that need JavaScript.

Launching a browser costs ~0.5 s and ~150 MB, so it starts lazily on first
use and is reused; each fetch gets an isolated page. Images, media and fonts
are blocked: we only need the HTML.
"""
import asyncio
import logging

from app.services.search.http_client import BROWSER_HEADERS

logger = logging.getLogger(__name__)
BLOCKED_RESOURCES = {"image", "media", "font"}


class BrowserPool:
    def __init__(self, executable_path: str | None = None, max_pages: int = 4):
        self._executable_path = executable_path
        self._semaphore = asyncio.Semaphore(max_pages)
        self._lock = asyncio.Lock()
        self._playwright = None
        self._browser = None
        self._context = None

    async def _ensure_started(self):
        async with self._lock:
            if self._context is not None:
                return self._context
            from playwright.async_api import async_playwright

            self._playwright = await async_playwright().start()
            self._browser = await self._playwright.chromium.launch(
                headless=True, executable_path=self._executable_path or None)
            self._context = await self._browser.new_context(
                user_agent=BROWSER_HEADERS["User-Agent"], locale="en-IN", viewport={"width": 1366, "height": 900})

            async def block_heavy(route):
                if route.request.resource_type in BLOCKED_RESOURCES:
                    await route.abort()
                else:
                    await route.continue_()

            await self._context.route("**/*", block_heavy)
            logger.info("Headless browser started")
            return self._context

    async def fetch_html(self, url: str, wait_for: str | None = None, timeout_ms: int = 15000) -> str:
        context = await self._ensure_started()
        async with self._semaphore:
            page = await context.new_page()
            try:
                await page.goto(url, wait_until="domcontentloaded", timeout=timeout_ms)
                if wait_for:
                    try:
                        await page.wait_for_selector(wait_for, timeout=timeout_ms / 2)
                    except Exception:
                        logger.debug("Selector %s not found on %s", wait_for, url)
                return await page.content()
            finally:
                await page.close()

    async def close(self) -> None:
        if self._browser is not None:
            await self._browser.close()
        if self._playwright is not None:
            await self._playwright.stop()
        self._browser = self._context = self._playwright = None
