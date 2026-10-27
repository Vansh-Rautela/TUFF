import io
from pathlib import Path

import cv2
import httpx
import numpy as np
import pytest
import pytest_asyncio

from app.core.config import Settings
from app.core.rate_limit import rate_limiter
from app.main import create_app
from app.services.container import build_services
from app.services.search.providers.base import ProductCandidate, StoreProvider, make_candidate

FIXTURES = Path(__file__).parent / "fixtures"
FACES = FIXTURES / "faces"  # stock photos: one close portrait, one full-length shot with a small face


def solid_image(color_bgr=(40, 40, 200), size=(160, 120), background=(250, 250, 250)) -> bytes:
    """A 'product photo': colored garment block on a light studio background."""
    image = np.full((size[0], size[1], 3), background, dtype=np.uint8)
    h, w = size
    image[int(h * 0.2):int(h * 0.85), int(w * 0.25):int(w * 0.75)] = color_bgr
    ok, encoded = cv2.imencode(".png", image)
    assert ok
    return encoded.tobytes()


class FakeProvider(StoreProvider):
    """Returns canned products; counts calls; optionally slow or failing."""

    def __init__(self, name: str, items: list[dict], delay: float = 0.0, fail: bool = False):
        self.name = name
        self.base_url = f"https://{name.lower()}.example/"
        self.items = items
        self.delay = delay
        self.fail = fail
        self.calls: list[str] = []

    def search_url(self, query):
        return self.base_url

    def parse(self, html):
        return []

    async def search(self, query, http=None, browser=None, limit=24) -> list[ProductCandidate]:
        import asyncio

        self.calls.append(query)
        if self.delay:
            await asyncio.sleep(self.delay)
        if self.fail:
            raise RuntimeError("store markup changed")
        return [make_candidate(self.name, self.base_url, **item) for item in self.items][:limit]


def catalog_items(store: str) -> list[dict]:
    return {
        "Myntra": [
            dict(url="p/olive-kurta", title="Women Olive Cotton Kurta", brand="Libas", price=899, mrp=1999,
                 image_url="https://img.example/olive.png", gender="Women", color="Olive", category="Kurtas"),
            dict(url="p/navy-shirt", title="Men Navy Slim Shirt", brand="Roadster", price=699,
                 image_url="https://img.example/navy.png", gender="Men", color="Navy Blue"),
        ],
        "Flipkart": [
            dict(url="p/rust-top", title="Women Rust Casual Top", brand="Vero Moda", price=1299,
                 image_url="https://img.example/rust.png", rating=4.5),
            dict(url="p/pink-dress", title="Women Pastel Pink Dress", brand="Zink", price=2999,
                 image_url="https://img.example/pink.png"),
        ],
        "Amazon": [
            dict(url="dp/B000MUSTARD", title="Women's Mustard Linen Kurta", brand="Aurelia", price=1099,
                 image_url="https://img.example/mustard.png", rating=4.1),
        ],
    }[store]


IMAGE_COLORS = {  # what each fake product photo "contains" (BGR)
    "olive.png": (46, 107, 107), "navy.png": (74, 42, 27), "rust.png": (14, 65, 183),
    "pink.png": (212, 200, 248), "mustard.png": (23, 160, 212),
}


def image_transport(request: httpx.Request) -> httpx.Response:
    name = request.url.path.rsplit("/", 1)[-1]
    if name in IMAGE_COLORS:
        return httpx.Response(200, content=solid_image(IMAGE_COLORS[name]), headers={"content-type": "image/png"})
    return httpx.Response(404)


class FakeAnalyzer:
    detector = "fake"

    def __init__(self, season="Warm Autumn"):
        self.season = season
        self.calls = 0

    def close(self):
        pass

    def analyze(self, image):
        from app.services.color.seasonal_palettes import SEASONS
        from app.services.color.skin_tone_analyzer import _season_payload

        self.calls += 1
        return {
            "season": {**_season_payload(SEASONS[self.season]), "confidence": 0.8},
            "alternatives": [{"name": "Deep Autumn", "family": "Autumn", "likelihood": 0.2}],
            "skin": {"hex": "#B5835A", "lab": [60.0, 14.0, 28.0], "ita": 20.0, "depth": "Tan", "undertone": "Warm",
                     "hue_angle": 63.0, "chroma": 31.0, "pixels_measured": 9000, "lightness": 58.0, "clusters_used": 3},
            "features": {"eyes_hex": "#3B2A20", "brows_hex": "#2A1E18", "contrast": "Medium", "contrast_value": 40.0},
            "axes": {"warmth": 80, "lightness": 40, "clarity": 45},
            "quality": {"score": 1.0, "issues": [], "white_balance": "sclera", "detector": "fake", "faces_found": 1},
            "face_box": [10, 10, 100, 100],
            "disclaimer": "test",
        }


@pytest.fixture(autouse=True)
def _reset_rate_limits():
    rate_limiter._hits.clear()
    yield
    rate_limiter._hits.clear()


@pytest.fixture
def settings(tmp_path) -> Settings:
    return Settings(database_url=f"sqlite+aiosqlite:///{tmp_path / 'test.db'}", browser_fallback=False,
                    legacy_scrapers=False, search_timeout_seconds=2.0, garment_color_budget_seconds=2.0,
                    _env_file=None)


@pytest.fixture
def providers():
    return [FakeProvider(s, catalog_items(s)) for s in ("Myntra", "Flipkart", "Amazon")]


@pytest_asyncio.fixture
async def services(settings, providers):
    http = httpx.AsyncClient(transport=httpx.MockTransport(image_transport))
    built = await build_services(settings, http=http, providers=providers, analyzer=FakeAnalyzer())
    yield built
    await built.close()


@pytest_asyncio.fixture
async def client(settings, services):
    app = create_app(settings)
    app.state.services = services  # ASGITransport doesn't run lifespan; inject directly
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as http:
        yield http


@pytest_asyncio.fixture
async def user_id(client) -> str:
    return (await client.post("/api/v1/users")).json()["id"]


def png_upload(path: Path | None = None) -> tuple[str, io.BytesIO, str]:
    if path is None:
        return ("photo.png", io.BytesIO(solid_image()), "image/png")
    return (path.name, io.BytesIO(path.read_bytes()), "image/webp")
