"""Attributes derived from product text: category, gender, price."""
import math
import re

CATEGORY_WORDS = [
    "t-shirt", "tshirt", "shirt", "polo", "kurta", "kurti", "saree", "lehenga", "dress", "gown",
    "top", "blouse", "jeans", "trousers", "pants", "chinos", "joggers", "shorts", "skirt",
    "jacket", "blazer", "coat", "hoodie", "sweatshirt", "sweater", "cardigan", "suit",
    "sneakers", "shoes", "sandals", "heels", "boots", "jumpsuit", "co-ord",
]
_CATEGORY_PATTERNS = [(w, re.compile(r"\b" + re.escape(w) + r"s?\b", re.IGNORECASE)) for w in CATEGORY_WORDS]
_CATEGORY_ALIASES = {"tshirt": "t-shirt", "kurti": "kurta", "pants": "trousers", "gown": "dress"}

_MEN = re.compile(r"\b(men|men's|mens|male|man|boys?|gents)\b", re.IGNORECASE)
_WOMEN = re.compile(r"\b(women|women's|womens|female|woman|girls?|ladies|lady)\b", re.IGNORECASE)
_UNISEX = re.compile(r"\bunisex\b", re.IGNORECASE)
_PRICE = re.compile(r"\d[\d,]*(?:\.\d+)?")


def category_from_text(text: str | None) -> str | None:
    for word, pattern in _CATEGORY_PATTERNS:
        if pattern.search(text or ""):
            return _CATEGORY_ALIASES.get(word, word)
    return None


def gender_from_text(text: str | None) -> str | None:
    """'men', 'women', 'unisex' or None, using whole-word matches ("women" never counts as "men")."""
    text = text or ""
    if _UNISEX.search(text):
        return "unisex"
    is_men, is_women = bool(_MEN.search(text)), bool(_WOMEN.search(text))
    if is_men != is_women:
        return "men" if is_men else "women"
    return None


def normalize_gender(value: str | None) -> str | None:
    key = (value or "").strip().lower()
    if key in {"male", "men", "man", "m", "boys"}:
        return "men"
    if key in {"female", "women", "woman", "f", "girls"}:
        return "women"
    if key == "unisex":
        return "unisex"
    return None


def parse_price(value) -> float | None:
    """'₹1,299' / 'Rs. 899' / 1299 -> 1299.0; ranges take the low end; junk -> None."""
    if isinstance(value, bool):
        return None
    if isinstance(value, int | float):
        return None if (isinstance(value, float) and math.isnan(value)) or value <= 0 else float(value)
    match = _PRICE.search(str(value or ""))
    if not match:
        return None
    number = float(match.group(0).replace(",", ""))
    return number if number > 0 else None
