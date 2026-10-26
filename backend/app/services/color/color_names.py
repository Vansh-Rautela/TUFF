"""Retail color vocabulary with reference swatches.

Used to (1) name colors measured from photos and (2) read colors from product
titles. Names are the words Indian fashion stores actually use.
"""
import re
from functools import lru_cache

import numpy as np

from app.services.color.color_science import delta_e_2000, hex_to_rgb, rgb_to_lab

# name -> reference hex
RETAIL_COLORS: dict[str, str] = {
    "black": "#111111", "charcoal": "#36454F", "grey": "#8A8D91", "light grey": "#C8C9CC",
    "white": "#F7F7F5", "off white": "#F2EEE3", "ivory": "#FFFCEB", "cream": "#F3E5C3",
    "beige": "#D9C7A7", "camel": "#C19A6B", "khaki": "#B5A07A", "taupe": "#8B7D6B",
    "tan": "#C49A6C", "brown": "#6F4E37", "chocolate": "#4E2A1E", "coffee": "#5B3A29",
    "rust": "#B7410E", "terracotta": "#C8603F", "burnt orange": "#CC5500", "orange": "#F28C28",
    "mustard": "#D4A017", "yellow": "#F2D13C", "lemon": "#FFF06A", "gold": "#C9A227",
    "peach": "#F7B994", "coral": "#F07763", "salmon": "#F2917A", "red": "#C8102E",
    "scarlet": "#E8251E", "maroon": "#6E1423", "burgundy": "#7B1E35", "wine": "#6B1F3A",
    "pink": "#F4A7B9", "baby pink": "#F8C8D4", "dusty rose": "#C9909A", "fuchsia": "#D6247D",
    "magenta": "#C2187F", "mauve": "#B784A7", "lavender": "#C8B6E2", "lilac": "#B9A0D0",
    "purple": "#6A3D9A", "plum": "#6E2C5E", "violet": "#7F4FC9", "navy": "#1B2A4A",
    "royal blue": "#2C4FB8", "blue": "#2F6FBF", "cobalt": "#1F4FA8", "sky blue": "#8EC5E8",
    "powder blue": "#B6D0E2", "denim": "#4A6A8A", "teal": "#137C7C", "turquoise": "#3FBFB4",
    "aqua": "#7FD8D4", "mint": "#A8DDC0", "sea green": "#3C9D73", "emerald": "#1E8A5A",
    "green": "#2E8B3E", "bottle green": "#0F4D32", "olive": "#6B6B2E", "sage": "#9CAF88",
    "lime": "#B8D430", "silver": "#BFC1C2", "rose gold": "#B76E79",
}

# Store/title synonyms -> canonical vocabulary names.
COLOR_SYNONYMS = {
    "gray": "grey", "navy blue": "navy", "dark blue": "navy", "light blue": "sky blue",
    "off-white": "off white", "offwhite": "off white", "multi": None, "multicolor": None,
    "multicolour": None, "assorted": None, "nude": "beige", "skin": "beige", "camel brown": "camel",
    "dark green": "bottle green", "olive green": "olive", "light pink": "baby pink",
    "rose": "dusty rose", "light green": "mint", "dark grey": "charcoal", "steel blue": "denim",
    "copper": "rust", "brick": "terracotta", "onion": "dusty rose", "peach puff": "peach",
}

_TITLE_TERMS = sorted({*RETAIL_COLORS, *COLOR_SYNONYMS}, key=len, reverse=True)
_TITLE_PATTERN = re.compile(r"\b(" + "|".join(re.escape(t) for t in _TITLE_TERMS) + r")\b", re.IGNORECASE)


def canonical_color(name: str | None) -> str | None:
    """Map a store/title color word to the canonical vocabulary (None if unknown or multi)."""
    if not name:
        return None
    key = name.strip().lower()
    if key in RETAIL_COLORS:
        return key
    return COLOR_SYNONYMS.get(key)


def color_from_text(text: str | None) -> str | None:
    """First color word mentioned in a product title."""
    for match in _TITLE_PATTERN.finditer(text or ""):
        name = canonical_color(match.group(1))
        if name:
            return name
    return None


@lru_cache(maxsize=1)
def _reference_labs() -> tuple[list[str], np.ndarray]:
    names = list(RETAIL_COLORS)
    labs = rgb_to_lab(np.array([hex_to_rgb(RETAIL_COLORS[n]) for n in names], dtype=np.float64))
    return names, labs


def nearest_color_name(lab) -> tuple[str, float]:
    """Closest vocabulary color to a CIELAB value and its ΔE2000 distance."""
    names, labs = _reference_labs()
    distances = delta_e_2000(np.asarray(lab, dtype=np.float64)[None, :], labs)
    index = int(np.argmin(distances))
    return names[index], float(distances[index])


def color_lab(name: str) -> np.ndarray:
    names, labs = _reference_labs()
    return labs[names.index(name)]
