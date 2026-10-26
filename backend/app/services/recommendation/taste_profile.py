"""A user's learned taste, built from swipes.

Every like (+1) and pass (-1) is weighted by recency with a 21-day half-life,
so the profile follows changing taste. Colors are kept as CIELAB points so a
new product can be compared by perceptual distance, not by name.
"""
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import UTC, datetime

import numpy as np

from app.db.models import Interaction
from app.services.color.color_science import hex_to_rgb, rgb_to_lab

HALF_LIFE_DAYS = 21.0


@dataclass
class TasteProfile:
    color_labs: np.ndarray = field(default_factory=lambda: np.zeros((0, 3)))
    color_weights: np.ndarray = field(default_factory=lambda: np.zeros(0))
    categories: dict[str, float] = field(default_factory=dict)
    brands: dict[str, float] = field(default_factory=dict)
    stores: dict[str, float] = field(default_factory=dict)
    liked_prices: list[float] = field(default_factory=list)
    likes: int = 0
    passes: int = 0
    seen_product_ids: set[str] = field(default_factory=set)
    disliked_product_ids: set[str] = field(default_factory=set)

    @property
    def has_signal(self) -> bool:
        return self.likes + self.passes > 0

    def top(self, attribute: str, n: int = 3) -> list[str]:
        values: dict[str, float] = getattr(self, attribute)
        return [k for k, v in sorted(values.items(), key=lambda kv: kv[1], reverse=True) if v > 0][:n]


def _recency_weight(created_at: datetime, now: datetime) -> float:
    created = created_at if created_at.tzinfo else created_at.replace(tzinfo=UTC)
    age_days = max(0.0, (now - created).total_seconds() / 86400)
    return 0.5 ** (age_days / HALF_LIFE_DAYS)


def build_taste_profile(interactions: list[Interaction], now: datetime | None = None) -> TasteProfile:
    now = now or datetime.now(UTC)
    taste = TasteProfile()
    categories: dict[str, float] = defaultdict(float)
    brands: dict[str, float] = defaultdict(float)
    stores: dict[str, float] = defaultdict(float)
    labs, weights = [], []

    for item in interactions:
        product = item.product
        sign = 1.0 if item.action == "like" else -1.0
        weight = sign * _recency_weight(item.created_at, now)
        taste.seen_product_ids.add(product.id)
        if item.action == "like":
            taste.likes += 1
            if product.price:
                taste.liked_prices.append(product.price)
        else:
            taste.passes += 1
            taste.disliked_product_ids.add(product.id)
        if product.color_hex:
            labs.append(rgb_to_lab(np.array(hex_to_rgb(product.color_hex), dtype=np.float64)))
            weights.append(weight)
        if product.category:
            categories[product.category] += weight
        if product.brand:
            brands[product.brand.lower()] += weight
        stores[product.store] += weight

    if labs:
        taste.color_labs = np.array(labs)
        taste.color_weights = np.array(weights)
    taste.categories, taste.brands, taste.stores = dict(categories), dict(brands), dict(stores)
    return taste
