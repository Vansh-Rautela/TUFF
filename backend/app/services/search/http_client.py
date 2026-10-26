"""Shared HTTP client for store pages and product images."""
import asyncio
import logging
import random

import httpx

logger = logging.getLogger(__name__)

BROWSER_HEADERS = {
    "User-Agent": ("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) "
                   "Chrome/130.0.0.0 Safari/537.36"),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-IN,en;q=0.9",
}


def create_http_client(**overrides) -> httpx.AsyncClient:
    options = {
        "headers": BROWSER_HEADERS,
        "follow_redirects": True,
        "timeout": httpx.Timeout(10.0, connect=5.0),
        "limits": httpx.Limits(max_connections=40, max_keepalive_connections=20),
    }
    options.update(overrides)
    return httpx.AsyncClient(**options)


async def fetch_text(client: httpx.AsyncClient, url: str, attempts: int = 2) -> str:
    """GET with a short jittered backoff on transient failures (network, 429, 5xx)."""
    last_error: Exception | None = None
    for attempt in range(attempts):
        try:
            response = await client.get(url)
            if response.status_code in (429, 500, 502, 503, 504):
                raise httpx.HTTPStatusError(f"{response.status_code}", request=response.request, response=response)
            response.raise_for_status()
            return response.text
        except (httpx.TransportError, httpx.HTTPStatusError) as error:
            last_error = error
            if attempt + 1 < attempts:
                await asyncio.sleep(0.3 + random.random() * 0.4)
    raise last_error  # type: ignore[misc]
