"""Explainable product ranking.

score = weighted average of the signals we actually have for this user:

    palette    0.30  CIEDE2000 distance from the product color to the user's season swatches
    taste      0.22  similarity to colors liked (minus passed) in swipes, recency-weighted
    category   0.12  learned category preference
    brand      0.08  learned brand preference
    budget     0.14  inside the budget = 1, decaying outside it
    style      0.08  a preferred style word in the title
    rating     0.06  store rating

Signals with no data (no palette yet, no swipes, no budget) are left out of the
average rather than counted as zero, so scores stay meaningful from day one.
The list is then re-ordered with Maximal Marginal Relevance so the top of the
feed isn't ten near-identical shirts from one brand.
"""
import math
from dataclasses import dataclass

import numpy as np

from app.db.models import Product, Profile
from app.services.color.color_science import delta_e_2000, hex_to_rgb, rgb_to_lab
from app.services.color.seasonal_palettes import Season, get_season
from app.services.recommendation.taste_profile import TasteProfile
from app.services.search.product_attributes import normalize_gender

WEIGHTS = {"palette": 0.30, "taste": 0.22, "category": 0.12, "brand": 0.08, "budget": 0.14, "style": 0.08,
           "rating": 0.06}
MMR_LAMBDA = 0.75


@dataclass
class RankedProduct:
    product: Product
    score: int                 # 0-100
    reasons: list[str]
    signals: dict[str, float]  # raw signal values, for debugging and tests


def _lab(hex_color: str | None) -> np.ndarray | None:
    return rgb_to_lab(np.array(hex_to_rgb(hex_color), dtype=np.float64)) if hex_color else None


class _SeasonMatcher:
    def __init__(self, season: Season):
        self.season = season
        self.names = [s.name for s in season.wearable]
        self.labs = np.array([_lab(s.hex) for s in season.wearable])
        self.avoid_labs = np.array([_lab(s.hex) for s in season.avoid])

    def fit(self, lab: np.ndarray) -> tuple[float, str]:
        distances = delta_e_2000(lab[None, :], self.labs)
        best = int(distances.argmin())
        fit = math.exp(-float(distances[best]) / 14.0)
        if float(delta_e_2000(lab[None, :], self.avoid_labs).min()) < 9:
            fit -= 0.6
        return fit, self.names[best]


def _budget_fit(price: float | None, low: float | None, high: float | None) -> float | None:
    if price is None or not high:
        return None
    low = low or 0.0
    if low <= price <= high:
        return 1.0
    span = max(high - low, 500.0)
    distance = (low - price) if price < low else (price - high)
    return math.exp(-distance / (0.35 * span))


def _affinity(values: dict[str, float], key: str | None) -> float | None:
    if not values or not key:
        return None
    total = sum(abs(v) for v in values.values()) or 1.0
    return float(np.tanh(3 * values.get(key, 0.0) / total))


def rank_products(products: list[Product], profile: Profile | None, taste: TasteProfile | None,
                  *, exclude_seen: bool = False, diversify: bool = True) -> list[RankedProduct]:
    taste = taste or TasteProfile()
    season = get_season(profile.season) if profile else None
    matcher = _SeasonMatcher(season) if season else None
    target_gender = normalize_gender(profile.gender) if profile else None
    opposite = {"men": "women", "women": "men"}.get(target_gender or "")
    styles = [s.lower() for s in (profile.styles or [])] if profile else []

    ranked: list[RankedProduct] = []
    for product in products:
        if opposite and product.gender == opposite:
            continue
        if product.id in taste.disliked_product_ids or (exclude_seen and product.id in taste.seen_product_ids):
            continue

        signals: dict[str, float] = {}
        reasons: list[tuple[float, str]] = []
        lab = _lab(product.color_hex)

        if matcher and lab is not None:
            fit, swatch = matcher.fit(lab)
            signals["palette"] = fit
            if fit > 0.45:
                reasons.append((fit * WEIGHTS["palette"], f"{swatch} tones suit your {matcher.season.name} palette"))
        if lab is not None and len(taste.color_weights):
            similarity = np.exp(-delta_e_2000(lab[None, :], taste.color_labs) / 15.0)
            value = float((similarity * taste.color_weights).sum() / (np.abs(taste.color_weights).sum() or 1.0))
            signals["taste"] = float(np.tanh(2.5 * value))
            if signals["taste"] > 0.25:
                reasons.append((signals["taste"] * WEIGHTS["taste"], "Close to colors you've liked"))
        category = _affinity(taste.categories, product.category)
        if category is not None:
            signals["category"] = category
            if category > 0.3:
                reasons.append((category * WEIGHTS["category"], f"You've been saving {product.category}s"))
        brand = _affinity(taste.brands, (product.brand or "").lower() or None)
        if brand is not None and product.brand:
            signals["brand"] = brand
            if brand > 0.3:
                reasons.append((brand * WEIGHTS["brand"], f"{product.brand} is one of your brands"))
        budget = _budget_fit(product.price, profile.budget_min if profile else None,
                             profile.budget_max if profile else None)
        if budget is not None:
            signals["budget"] = budget
            if budget == 1.0:
                reasons.append((0.5 * WEIGHTS["budget"], "Within your budget"))
        if styles:
            title = product.title.lower()
            matched = next((s for s in styles if s in title), None)
            signals["style"] = 1.0 if matched else 0.0
            if matched:
                reasons.append((WEIGHTS["style"], f"Matches your {matched} style"))
        if product.rating:
            signals["rating"] = max(-1.0, min(1.0, (product.rating - 3.6) / 1.2))
            if product.rating >= 4.3:
                reasons.append((0.5 * WEIGHTS["rating"], f"Rated {product.rating:.1f}★"))

        used = {k: v for k, v in signals.items() if k in WEIGHTS}
        weight_total = sum(WEIGHTS[k] for k in used) or 1.0
        raw = sum(WEIGHTS[k] * v for k, v in used.items()) / weight_total if used else 0.0
        score = int(round(100 * max(0.0, min(1.0, raw))))
        ranked.append(RankedProduct(product, score, [text for _, text in sorted(reasons, reverse=True)[:2]], signals))

    ranked.sort(key=lambda r: r.score, reverse=True)
    return _diversify(ranked) if diversify else ranked


def similarity_matrix(products: list[Product]) -> np.ndarray:
    """Pairwise redundancy in [0, 1]: brand 0.4, store 0.15, category 0.15, close color 0.3."""
    n = len(products)
    brands = np.array([(p.brand or f"#{i}").lower() for i, p in enumerate(products)])
    categories = np.array([p.category or f"#{i}" for i, p in enumerate(products)])
    stores = np.array([p.store for p in products])
    labs = np.array([_lab(p.color_hex) if p.color_hex else (np.nan, np.nan, np.nan) for p in products]).reshape(n, 3)
    color = np.exp(-delta_e_2000(labs[:, None, :], labs[None, :, :]) / 10.0)
    color = np.nan_to_num(color, nan=0.0)
    return (0.4 * (brands[:, None] == brands[None, :]) + 0.15 * (stores[:, None] == stores[None, :])
            + 0.15 * (categories[:, None] == categories[None, :]) + 0.3 * color)


def _diversify(ranked: list[RankedProduct], window: int = 60) -> list[RankedProduct]:
    """Maximal Marginal Relevance over the top `window` items (vectorized)."""
    pool, rest = ranked[:window], ranked[window:]
    if len(pool) < 3:
        return ranked
    relevance = np.array([r.score / 100 for r in pool])
    similarity = similarity_matrix([r.product for r in pool])
    redundancy = np.zeros(len(pool))
    remaining = np.ones(len(pool), dtype=bool)
    order: list[int] = []
    for _ in range(len(pool)):
        mmr = np.where(remaining, MMR_LAMBDA * relevance - (1 - MMR_LAMBDA) * redundancy, -np.inf)
        best = int(np.argmax(mmr))
        order.append(best)
        remaining[best] = False
        redundancy = np.maximum(redundancy, similarity[best])
    return [pool[i] for i in order] + rest
