"""
Product search: scraper registry, query building, normalization and ranking inputs.

Scrapers live in Backend/Webscraping and return pandas DataFrames with columns like
Title / Price / Image / Link. This module turns those into clean product dicts,
runs scrapers concurrently with a time budget, and caches results so repeated
searches do not launch another headless Chrome.
"""
import math
import os
import re
import sys
import threading
import time
from collections import deque
from concurrent.futures import Future, ThreadPoolExecutor, wait
from typing import Any, Callable, Dict, Iterable, List, Optional, Tuple

import config

WEB_SCRAPE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'Webscraping')

DEFAULT_BRANDS = ['Myntra', 'Flipkart', 'Amazon']

# ----------------------------------------------------------------------------
# Scraper registry
# ----------------------------------------------------------------------------

# brand -> (module, function)
_SCRAPER_SPECS = {
    'Amazon': ('scrapers', 'scrape_amazon'),
    'Flipkart': ('scrapers', 'scrape_flipkart'),
    'Myntra': ('scrapers', 'scrape_myntra'),
    'Nykaa': ('scrapers', 'scrape_nykaa'),
    'Zara': ('scrapers', 'scrape_zara'),
    'H&M': ('scrapers', 'scrape_hnm'),
    'Levis': ('scrapers', 'scrape_levis'),
    'Lifestyle': ('scrapers', 'scrape_lifestyle'),
    'Ajio': ('scrapers', 'scrape_ajio'),
    'Bewakoof': ('scrapers', 'scrape_bewakoof'),
    'Westside': ('savana', 'scrape_westside'),
    'Urbanic': ('savana', 'scrape_urbanic'),
    'Libas': ('libass', 'scrape_libas'),
    'Monte Carlo': ('montecarlo', 'scrape_monte_carlo'),
    'Souled Store': ('souledstore', 'scrape_souled_store'),
}


def load_scraper_registry() -> Dict[str, Callable[[str], Any]]:
    """Import every scraper module that loads in this environment."""
    import importlib

    if WEB_SCRAPE_DIR not in sys.path:
        sys.path.append(WEB_SCRAPE_DIR)

    registry = {}
    failed_modules = {}
    for brand, (module_name, func_name) in _SCRAPER_SPECS.items():
        if module_name in failed_modules:
            continue
        try:
            module = importlib.import_module(module_name)
        except Exception as error:
            failed_modules[module_name] = error
            print(f"Scraper module '{module_name}' unavailable: {error}")
            continue
        func = getattr(module, func_name, None)
        if callable(func):
            registry[brand] = func
    print(f"Loaded {len(registry)} scrapers: {sorted(registry)}")
    return registry


# ----------------------------------------------------------------------------
# Attribute extraction from product titles
# ----------------------------------------------------------------------------

# Multi-word colors first so "navy blue" wins over "blue".
COLOR_WORDS = [
    'off white', 'navy blue', 'sky blue', 'royal blue', 'powder blue', 'light blue', 'dark blue',
    'olive green', 'bottle green', 'sea green', 'dusty rose', 'burnt orange', 'rose gold',
    'black', 'white', 'grey', 'gray', 'charcoal', 'navy', 'blue', 'teal', 'turquoise', 'green',
    'olive', 'emerald', 'mint', 'khaki', 'beige', 'cream', 'ivory', 'camel', 'tan', 'brown',
    'rust', 'terracotta', 'mustard', 'yellow', 'orange', 'coral', 'peach', 'salmon', 'red',
    'maroon', 'burgundy', 'wine', 'pink', 'fuchsia', 'magenta', 'mauve', 'lavender', 'lilac',
    'purple', 'plum', 'violet', 'gold', 'silver',
]
_COLOR_PATTERNS = [(color, re.compile(r'\b' + re.escape(color) + r'\b')) for color in COLOR_WORDS]

# Retail synonyms -> palette names used in color_palettes.py
COLOR_ALIASES = {'gray': 'grey', 'navy blue': 'navy', 'wine': 'burgundy', 'magenta': 'fuchsia', 'off white': 'off white'}

CATEGORY_WORDS = [
    't-shirt', 'tshirt', 'shirt', 'polo', 'kurta', 'kurti', 'saree', 'lehenga', 'dress', 'gown',
    'top', 'blouse', 'jeans', 'trousers', 'pants', 'chinos', 'joggers', 'shorts', 'skirt',
    'jacket', 'blazer', 'coat', 'hoodie', 'sweatshirt', 'sweater', 'cardigan', 'suit',
    'sneakers', 'shoes', 'sandals', 'heels', 'boots', 'jumpsuit', 'co-ord',
]
_CATEGORY_PATTERNS = [(word, re.compile(r'\b' + re.escape(word) + r's?\b')) for word in CATEGORY_WORDS]
_CATEGORY_ALIASES = {'tshirt': 't-shirt', 'kurti': 'kurta', 'pants': 'trousers'}

_MEN_WORDS = re.compile(r"\b(men|men's|mens|male|man|boys?|gents)\b")
_WOMEN_WORDS = re.compile(r"\b(women|women's|womens|female|woman|girls?|ladies|lady)\b")
_UNISEX_WORDS = re.compile(r'\bunisex\b')


def extract_color(title: str) -> Optional[str]:
    text = (title or '').lower()
    for color, pattern in _COLOR_PATTERNS:
        if pattern.search(text):
            return COLOR_ALIASES.get(color, color)
    return None


def extract_category(title: str) -> Optional[str]:
    text = (title or '').lower()
    for word, pattern in _CATEGORY_PATTERNS:
        if pattern.search(text):
            return _CATEGORY_ALIASES.get(word, word)
    return None


def detect_gender(title: str) -> Optional[str]:
    """Return 'men', 'women', 'unisex' or None using whole-word matches."""
    text = (title or '').lower()
    if _UNISEX_WORDS.search(text):
        return 'unisex'
    is_men = bool(_MEN_WORDS.search(text))
    is_women = bool(_WOMEN_WORDS.search(text))
    if is_men and not is_women:
        return 'men'
    if is_women and not is_men:
        return 'women'
    return None


def normalize_gender(gender: Any) -> Optional[str]:
    value = str(gender or '').strip().lower()
    if value in ('male', 'men', 'man', 'm'):
        return 'men'
    if value in ('female', 'women', 'woman', 'f'):
        return 'women'
    return None


def filter_by_gender(products: List[Dict[str, Any]], gender: Any) -> List[Dict[str, Any]]:
    """
    Drop products explicitly made for the other gender. Untagged titles are kept
    because the search query already targets the user's gender.
    """
    target = normalize_gender(gender)
    if not target:
        return list(products)
    opposite = 'women' if target == 'men' else 'men'
    return [p for p in products if (p.get('gender') or detect_gender(p.get('title', ''))) != opposite]


# ----------------------------------------------------------------------------
# Normalization
# ----------------------------------------------------------------------------

_PLACEHOLDER_VALUES = {'', 'no title', 'no image', 'no price', 'product', '#', 'nan', 'none'}
_PRICE_NUMBER = re.compile(r'\d[\d,]*(?:\.\d+)?')


def _clean_text(value: Any) -> str:
    if value is None:
        return ''
    if isinstance(value, float) and math.isnan(value):
        return ''
    text = str(value).strip()
    return '' if text.lower() in _PLACEHOLDER_VALUES else text


def parse_price(value: Any) -> Optional[float]:
    """Parse '₹1,299', 'Rs. 1299', '1299.00' or 1299 into a float. Ranges take the low end."""
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        return None if (isinstance(value, float) and math.isnan(value)) or value <= 0 else float(value)
    match = _PRICE_NUMBER.search(_clean_text(value))
    if not match:
        return None
    try:
        number = float(match.group(0).replace(',', ''))
    except ValueError:
        return None
    return number if number > 0 else None


def format_price(value: Optional[float]) -> Optional[str]:
    if value is None:
        return None
    return f"₹{value:,.0f}"


def _is_http_url(value: str) -> bool:
    return value.startswith('http://') or value.startswith('https://')


def normalize_product(raw: Dict[str, Any], default_brand: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """
    Convert a scraper row into the API product shape, or None if the row is
    unusable (no title or no real product link).
    """
    title = _clean_text(raw.get('Title') or raw.get('title'))
    link = _clean_text(raw.get('Link') or raw.get('link') or raw.get('url'))
    if not title or not _is_http_url(link):
        return None

    thumbnail = _clean_text(raw.get('Image') or raw.get('thumbnail') or raw.get('image'))
    if not _is_http_url(thumbnail):
        thumbnail = ''

    price_value = parse_price(raw.get('Price') if 'Price' in raw else raw.get('price'))
    brand = _clean_text(raw.get('Source') or raw.get('brand')) or default_brand or ''

    return {
        'id': link,
        'title': title,
        'link': link,
        'thumbnail': thumbnail,
        'price': format_price(price_value),
        'price_value': price_value,
        'brand': brand,
        'color': extract_color(title),
        'category': extract_category(title),
        'gender': detect_gender(title),
    }


def dataframe_to_products(df: Any, brand: str) -> List[Dict[str, Any]]:
    if df is None or getattr(df, 'empty', True):
        return []
    products = []
    seen = set()
    for row in df.to_dict(orient='records'):
        product = normalize_product(row, default_brand=brand)
        if product and product['link'] not in seen:
            seen.add(product['link'])
            products.append(product)
    return products


# ----------------------------------------------------------------------------
# Query building
# ----------------------------------------------------------------------------

CLOTH_TYPES = ['shirt', 'pants', 'dress', 'top', 'bottom', 'jeans', 'kurta', 'saree', 'suit', 'jacket', 'shoes']

# Words that carry no search meaning for a retailer.
_QUERY_STOPWORDS = {
    'a', 'an', 'the', 'and', 'or', 'for', 'with', 'to', 'of', 'in', 'on', 'me', 'my', 'i', 'show',
    'find', 'want', 'need', 'some', 'please', 'user', 'profile', 'personalized', 'fashion',
    'product', 'products', 'search', 'date', 'birth', 'username', 'name', 'preferences', 'match',
    'selected', 'brands', 'websites', 'clothes', 'clothing', 'best', 'that',
}
MAX_PROMPT_CHARS = 120
MAX_PROMPT_TERMS = 6


def _prompt_terms(prompt: str) -> List[str]:
    """
    Extract search terms from free text typed by the user.

    Multi-line or long text is not a search box entry (older clients sent a
    whole profile dump with name and date of birth); it is ignored so personal
    data never ends up in a third-party search URL.
    """
    prompt = (prompt or '').strip()
    if not prompt or '\n' in prompt or len(prompt) > MAX_PROMPT_CHARS:
        return []
    terms = []
    for token in re.findall(r"[a-zA-Z][a-zA-Z'-]{1,24}", prompt.lower()):
        token = token.strip("'-")
        if len(token) > 1 and token not in _QUERY_STOPWORDS and token not in terms:
            terms.append(token)
    return terms[:MAX_PROMPT_TERMS]


def build_search_query(gender: Any = None, prompt: str = '', styles: Optional[Iterable[str]] = None) -> str:
    """
    Build the retailer search string: "<gender> <user search terms> <style>".

    Profile attributes such as body type, season or palette colors are not
    sent to retailers; they are used for ranking instead (see recommender.py).
    """
    parts: List[str] = []
    target = normalize_gender(gender)
    if target:
        parts.append(target)

    terms = [t for t in _prompt_terms(prompt) if t not in parts]
    parts.extend(terms)

    for style in styles or []:
        style_term = str(style).strip().lower()
        if re.fullmatch(r'[a-z][a-z -]{1,20}', style_term) and style_term not in parts:
            parts.append(style_term)
            break  # one style keeps the query focused

    if not terms:
        parts.append('clothing')
    return ' '.join(parts)


# ----------------------------------------------------------------------------
# Filters and balancing
# ----------------------------------------------------------------------------

def parse_price_filter(label: str) -> Optional[Tuple[float, float]]:
    """Map UI labels ('Under 500', '500-1000', 'Above 5000') to (min, max)."""
    text = str(label or '').strip().lower().replace(',', '')
    numbers = [float(n) for n in re.findall(r'\d+(?:\.\d+)?', text)]
    if not numbers:
        return None
    if text.startswith('under') or text.startswith('below'):
        return (0.0, numbers[0])
    if text.startswith('above') or text.startswith('over'):
        return (numbers[0], float('inf'))
    if len(numbers) >= 2:
        return (min(numbers[:2]), max(numbers[:2]))
    return None


def filter_by_price(products: List[Dict[str, Any]], labels: Iterable[str]) -> List[Dict[str, Any]]:
    ranges = [r for r in (parse_price_filter(label) for label in labels or []) if r]
    if not ranges:
        return list(products)
    return [
        p for p in products
        if p.get('price_value') is not None and any(lo <= p['price_value'] <= hi for lo, hi in ranges)
    ]


def interleave_by_brand(products_by_brand: Dict[str, List[Dict[str, Any]]], limit: int) -> List[Dict[str, Any]]:
    """Round-robin across brands so every brand that returned results is represented."""
    queues = [deque(items) for items in products_by_brand.values() if items]
    result: List[Dict[str, Any]] = []
    seen = set()
    while queues and len(result) < limit:
        for queue in queues:
            product = queue.popleft()
            if product['link'] not in seen:
                seen.add(product['link'])
                result.append(product)
                if len(result) >= limit:
                    break
        queues = [queue for queue in queues if queue]
    return result


# ----------------------------------------------------------------------------
# Concurrent, cached scraping
# ----------------------------------------------------------------------------

class ProductSearch:
    """
    Runs brand scrapers concurrently with an overall time budget.

    - Results are cached per (brand, query) for `cache_ttl` seconds.
    - Identical in-flight searches share one scraper run.
    - A scraper that misses the deadline keeps running in the background and
      still fills the cache, so the next request is fast.
    """

    def __init__(
        self,
        registry_loader: Callable[[], Dict[str, Callable[[str], Any]]] = load_scraper_registry,
        workers: int = config.SCRAPER_WORKERS,
        timeout_seconds: float = config.SCRAPER_TIMEOUT_SECONDS,
        cache_ttl: float = config.SCRAPE_CACHE_TTL_SECONDS,
        clock: Callable[[], float] = time.monotonic,
    ):
        self._registry_loader = registry_loader
        self._registry: Optional[Dict[str, Callable[[str], Any]]] = None
        self._executor = ThreadPoolExecutor(max_workers=max(1, workers), thread_name_prefix='scraper')
        self._timeout = timeout_seconds
        self._cache_ttl = cache_ttl
        self._clock = clock
        self._cache: Dict[Tuple[str, str], Tuple[float, List[Dict[str, Any]]]] = {}
        self._in_flight: Dict[Tuple[str, str], Future] = {}
        self._lock = threading.Lock()

    @property
    def registry(self) -> Dict[str, Callable[[str], Any]]:
        with self._lock:
            if self._registry is None:
                self._registry = self._registry_loader()
            return self._registry

    def available_brands(self) -> List[str]:
        return sorted(self.registry)

    def resolve_brands(self, requested: Iterable[str]) -> List[str]:
        registry = self.registry
        brands = [b for b in dict.fromkeys(str(b) for b in requested or []) if b in registry]
        if not brands:
            brands = [b for b in DEFAULT_BRANDS if b in registry]
        return brands

    def _run_scraper(self, brand: str, query: str) -> List[Dict[str, Any]]:
        df = self.registry[brand](query)
        return dataframe_to_products(df, brand)

    def _store(self, key: Tuple[str, str], future: Future) -> None:
        with self._lock:
            self._in_flight.pop(key, None)
            if not future.cancelled() and future.exception() is None:
                self._cache[key] = (self._clock(), future.result())

    def search(self, query: str, brands: Iterable[str]) -> Tuple[Dict[str, List[Dict[str, Any]]], Dict[str, str]]:
        """
        Returns (products_by_brand, errors_by_brand). Brands that fail or time
        out appear in errors with a short, client-safe reason.
        """
        query_key = query.strip().lower()
        results: Dict[str, List[Dict[str, Any]]] = {}
        errors: Dict[str, str] = {}
        pending: Dict[str, Future] = {}

        for brand in brands:
            key = (brand, query_key)
            with self._lock:
                cached = self._cache.get(key)
                if cached and self._clock() - cached[0] < self._cache_ttl:
                    results[brand] = cached[1]
                    continue
                future = self._in_flight.get(key)
                if future is None:
                    future = self._executor.submit(self._run_scraper, brand, query)
                    self._in_flight[key] = future
                    future.add_done_callback(lambda f, key=key: self._store(key, f))
            pending[brand] = future

        if pending:
            wait(list(pending.values()), timeout=self._timeout)

        for brand, future in pending.items():
            if not future.done():
                errors[brand] = 'timed out'
                continue
            error = future.exception()
            if error is not None:
                print(f"Scraper {brand} failed: {error}")
                errors[brand] = 'failed'
                continue
            results[brand] = future.result()

        return results, errors
