"""'Complete the look': pair saved pieces into outfits by colour harmony and palette fit."""
from dataclasses import dataclass, field
from itertools import product as cartesian

from app.db.models import Product
from app.services.color.color_harmony import Harmony, harmony_for_hex, hex_to_lab
from app.services.color.color_names import RETAIL_COLORS
from app.services.color.color_science import delta_e_2000
from app.services.color.seasonal_palettes import Season

TOPS = {"shirt", "t-shirt", "top", "blouse", "polo", "kurta", "sweater", "sweatshirt", "hoodie"}
BOTTOMS = {"jeans", "trousers", "chinos", "joggers", "shorts", "skirt"}
LAYERS = {"jacket", "blazer", "coat", "cardigan"}


def role_of(product: Product) -> str | None:
    if product.category in TOPS:
        return "top"
    if product.category in BOTTOMS:
        return "bottom"
    if product.category in LAYERS:
        return "layer"
    return None


@dataclass
class Outfit:
    items: list[Product]
    harmony: Harmony
    score: float


@dataclass
class Suggestion:
    product: Product
    need: str                       # which role would complete it
    colors: list[dict] = field(default_factory=list)  # [{name, hex, kind}]
    query: str = ""


def _palette_fit(product: Product, season: Season | None) -> float:
    if not season or not product.color_hex:
        return 0.5
    lab = hex_to_lab(product.color_hex)
    distance = min(float(delta_e_2000(lab, hex_to_lab(s.hex))) for s in season.wearable)
    return max(0.0, 1 - distance / 40)


def build_outfits(saved: list[Product], season: Season | None, limit: int = 6) -> list[Outfit]:
    tops = [p for p in saved if role_of(p) == "top" and p.color_hex]
    bottoms = [p for p in saved if role_of(p) == "bottom" and p.color_hex]
    outfits = []
    for top, bottom in cartesian(tops, bottoms):
        harmony = harmony_for_hex(top.color_hex, bottom.color_hex)
        fit = (_palette_fit(top, season) + _palette_fit(bottom, season)) / 2
        outfits.append(Outfit([top, bottom], harmony, round(0.7 * harmony.score + 0.3 * fit, 3)))
    outfits.sort(key=lambda o: o.score, reverse=True)
    used: set[str] = set()
    chosen = []
    for outfit in outfits:  # each piece appears in at most two outfits
        ids = [p.id for p in outfit.items]
        if sum(i in used for i in ids) > 1:
            continue
        used.update(ids)
        chosen.append(outfit)
        if len(chosen) == limit:
            break
    return chosen


def suggest_partners(
    saved: list[Product], season: Season | None, gender: str | None, limit: int = 4
) -> list[Suggestion]:
    """For pieces with no partner yet, propose colours (from the user's palette) that harmonize with them."""
    roles = {role_of(p) for p in saved}
    suggestions = []
    for piece in saved:
        role = role_of(piece)
        need = {"top": "bottom", "bottom": "top"}.get(role or "")
        if not need or need in roles or not piece.color_hex:
            continue
        candidates = ([(s.name, s.hex) for s in season.neutrals + season.signature] if season
                      else [(n, RETAIL_COLORS[n]) for n in ("black", "white", "beige", "navy", "grey", "olive")])
        scored = []
        for name, hex_color in candidates:
            harmony = harmony_for_hex(piece.color_hex, hex_color)
            scored.append((harmony.score, {"name": name, "hex": hex_color, "kind": harmony.kind}))
        scored.sort(key=lambda s: s[0], reverse=True)
        colors = [c for _, c in scored[:3]]
        word = {"bottom": "trousers", "top": "top"}[need]
        prefix = {"men": "men ", "women": "women "}.get(gender or "", "")
        suggestions.append(Suggestion(piece, need, colors, f"{prefix}{colors[0]['name'].lower()} {word}".strip()))
        if len(suggestions) == limit:
            break
    return suggestions

