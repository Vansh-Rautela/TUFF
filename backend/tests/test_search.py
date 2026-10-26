import asyncio

import httpx
import pytest

from app.services.search.product_attributes import category_from_text, gender_from_text, parse_price
from app.services.search.providers.amazon import AmazonProvider
from app.services.search.providers.flipkart import FlipkartProvider
from app.services.search.providers.myntra import MyntraProvider
from app.services.search.query_builder import build_query
from tests.conftest import FIXTURES, FakeProvider, catalog_items

# ---- parsers against real (trimmed) store pages ---------------------------------


@pytest.mark.parametrize("provider, fixture", [
    (MyntraProvider(), "myntra_search.html"),
    (FlipkartProvider(), "flipkart_search.html"),
    (AmazonProvider(), "amazon_search.html"),
])
def test_store_parsers(provider, fixture):
    products = provider.parse((FIXTURES / "stores" / fixture).read_text())
    assert len(products) == 4
    for p in products:
        assert p.store == provider.name
        assert p.url.startswith(provider.base_url)
        assert p.title and p.price and p.price > 0
        assert p.image_url and p.image_url.startswith("https://")
        assert p.category == "shirt" and p.gender in {"men", None}


def test_amazon_links_are_canonical_and_brand_split():
    products = AmazonProvider().parse((FIXTURES / "stores" / "amazon_search.html").read_text())
    assert all("/dp/" in p.url and "sspa" not in p.url for p in products)
    assert products[0].brand and products[0].brand not in products[0].title


def test_myntra_uses_store_color_labels():
    products = MyntraProvider().parse((FIXTURES / "stores" / "myntra_search.html").read_text())
    assert all(p.color_name == "navy" and p.color_source == "store" for p in products)


@pytest.mark.parametrize("provider", [MyntraProvider(), FlipkartProvider(), AmazonProvider()])
def test_parsers_tolerate_unexpected_markup(provider):
    assert provider.parse("<html><body>Access denied</body></html>") == []
    assert provider.parse("<script>window.__myx = {broken</script>") == []


class FakeBrowser:
    def __init__(self, html):
        self.html, self.calls = html, 0

    async def fetch_html(self, url, wait_for=None):
        self.calls += 1
        return self.html


async def test_browser_fallback_when_http_is_blocked():
    blocked = httpx.AsyncClient(transport=httpx.MockTransport(lambda r: httpx.Response(200, text="captcha")))
    browser = FakeBrowser((FIXTURES / "stores" / "flipkart_search.html").read_text())
    products = await FlipkartProvider().search("men shirt", blocked, browser)
    assert browser.calls == 1 and len(products) == 4


async def test_http_first_skips_browser():
    html = (FIXTURES / "stores" / "myntra_search.html").read_text()
    http = httpx.AsyncClient(transport=httpx.MockTransport(lambda r: httpx.Response(200, text=html)))
    browser = FakeBrowser("")
    assert len(await MyntraProvider().search("men navy shirt", http, browser)) == 4
    assert browser.calls == 0

# ---- text attributes and queries ------------------------------------------------


def test_attributes():
    assert gender_from_text("Women's Kurta") == "women" and gender_from_text("Men Shirt") == "men"
    assert gender_from_text("Slim Shirt") is None and gender_from_text("Unisex Hoodie") == "unisex"
    assert category_from_text("Graphic Tshirt") == "t-shirt" and category_from_text("Silk Gown") == "dress"
    assert parse_price("₹1,299") == 1299 and parse_price("No price") is None and parse_price(float("nan")) is None


def test_query_builder_keeps_profile_private():
    assert build_query("show me an olive kurta for work", "women", ["casual"]) == "women olive kurta work casual"
    assert build_query("", "men") == "men clothing"
    dump = "User Profile:\n- Name: Priya Sharma\n- Date of Birth: 4/5/2001"
    assert build_query(dump, "women") == "women clothing"
    assert len(build_query("a b c red blue green pink teal gold silver navy", None).split()) <= 7

# ---- engine -----------------------------------------------------------------------


async def test_engine_searches_concurrently_and_caches(services, providers):
    first = await services.search.search("women kurta", ["Myntra", "Flipkart", "Amazon"])
    assert [r.store for r in first] == ["Myntra", "Flipkart", "Amazon"]
    assert sum(len(r.products) for r in first) == 5 and not any(r.cached for r in first)
    second = await services.search.search("WOMEN KURTA ", ["Myntra"])
    assert second[0].cached and providers[0].calls == ["women kurta"]


async def test_cache_survives_restart_via_database(services, providers, settings):
    await services.search.search("women kurta", ["Myntra"])
    services.search._memory.clear()
    result = await services.search.search("women kurta", ["Myntra"])
    assert result[0].cached and len(providers[0].calls) == 1


async def test_engine_measures_garment_colors(services):
    results = await services.search.search("women kurta", ["Flipkart", "Amazon"])
    by_title = {p.title: p for r in results for p in r.products}
    rust_top = by_title["Women Rust Casual Top"]
    assert rust_top.color_name == "rust" and rust_top.color_hex  # title label + measured shade
    assert by_title["Women's Mustard Linen Kurta"].color_hex


async def test_slow_or_broken_store_does_not_block_others(services):
    services.search.providers["Flipkart"] = FakeProvider("Flipkart", catalog_items("Flipkart"), delay=5)
    services.search.providers["Amazon"] = FakeProvider("Amazon", [], fail=True)
    services.search.timeout = 0.3
    results = {r.store: r for r in await services.search.search("q", ["Myntra", "Flipkart", "Amazon"])}
    assert results["Myntra"].products and results["Flipkart"].error == "timed out"
    assert results["Amazon"].error == "unavailable"


async def test_identical_inflight_searches_share_one_fetch(services):
    slow = FakeProvider("Myntra", catalog_items("Myntra"), delay=0.2)
    services.search.providers["Myntra"] = slow
    await asyncio.gather(*(services.search.search("same", ["Myntra"]) for _ in range(3)))
    assert slow.calls == ["same"]


async def test_stream_yields_fastest_store_first(services):
    services.search.providers["Myntra"] = FakeProvider("Myntra", catalog_items("Myntra"), delay=0.3)
    order = [r.store async for r in services.search.stream("q", ["Myntra", "Amazon"])]
    assert order == ["Amazon", "Myntra"]


def test_store_resolution(services):
    assert services.search.resolve_stores(["Amazon", "Nope", "Amazon"]) == ["Amazon"]
    assert services.search.resolve_stores([]) == ["Myntra", "Flipkart", "Amazon"]
