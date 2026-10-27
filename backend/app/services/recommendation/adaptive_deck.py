"""Adaptive swipe deck: Thompson sampling over colour-family and category arms.

Each swipe is a cheap, explicit label, so the deck should *learn* from it, not
just replay search results. Following the bandit view of cold-start preference
elicitation (e.g. ConTS, Li et al. 2021: attributes as arms, Thompson sampling
for the explore/exploit trade-off):

  * arms: the product's colour family (30° hue bins in LCh, or "neutral") and
    its category;
  * posterior per arm: Beta(1 + likes, 1 + passes), recency-weighted (21-day
    half-life) with "love" counting double;
  * prior: before any swipes, palette fit (CIEDE2000 to the user's season)
    gives the colour arm a head start, so a cold deck already leans towards
    flattering colours (a "dynamic prior");
  * each card samples θ_colour, θ_category; score mixes that sample with the
    deterministic match score; cards picked because an *uncertain* arm sampled
    high are tagged "new_direction", the rest "for_you".
"""
import math
from collections import Counter, defaultdict
from dataclasses import dataclass, field
from datetime import UTC, datetime

import numpy as np

from app.db.models import Interaction, Product, Profile
from app.services.color.color_harmony import NEUTRAL_CHROMA, hex_to_lab
from app.services.color.color_science import delta_e_2000, lab_to_lch
from app.services.color.seasonal_palettes import get_season
from app.services.recommendation.taste_profile import HALF_LIFE_DAYS

ACTION_WEIGHT = {"like": 1.0, "love": 2.0, "dislike": -1.0}
# Upper bounds of CIELAB hue-angle bins (CIELAB hues differ from HSV: red ~40°, yellow ~90°, blue ~270°).
HUE_FAMILIES = [(20, "pink"), (50, "red"), (72, "orange"), (100, "yellow"), (135, "olive"), (175, "green"),
                (225, "teal"), (310, "blue"), (340, "purple"), (360, "pink")]
EARTH_CHROMA = 28.0  # warm hues below this chroma read as earth tones (beige, camel, khaki, taupe)
EXPLORATION_OBSERVATIONS = 1.5  # recency-weighted swipes; two fresh swipes (~1.99) count as explored
MAX_NEW_DIRECTION = 3            # exploration cards per deck, so the deck still feels personal
# Retail words for searching a colour family when the catalog runs short of it.
FAMILY_QUERY_WORD = {
    "neutral-dark": "black", "neutral-light": "white", "earth": "beige", "yellow": "mustard", "orange": "orange",
    "red": "red", "pink": "pink", "purple": "purple", "blue": "blue", "teal": "teal", "green": "green",
    "olive": "olive",
}
DEFAULT_GARMENT = {"women": "kurta", "men": "shirt"}
MATCH_WEIGHT = 0.4
PER_BRAND = 2


def color_family(hex_color: str | None) -> str | None:
    if not hex_color:
        return None
    L, C, h = lab_to_lch(hex_to_lab(hex_color))
    if C < NEUTRAL_CHROMA:
        return "neutral-dark" if L < 45 else "neutral-light"
    if C < EARTH_CHROMA and 40 <= float(h) <= 100:
        return "earth"
    return next(name for upper, name in HUE_FAMILIES if float(h) % 360 < upper)


@dataclass
class ArmStats:
    wins: dict[str, float] = field(default_factory=lambda: defaultdict(float))
    losses: dict[str, float] = field(default_factory=lambda: defaultdict(float))

    def observe(self, arm: str | None, reward: float, weight: float) -> None:
        if arm is None:
            return
        if reward > 0:
            self.wins[arm] += reward * weight
        else:
            self.losses[arm] += -reward * weight

    def evidence(self, arm: str) -> float:
        return self.wins.get(arm, 0.0) + self.losses.get(arm, 0.0)

    def mean(self, arm: str) -> float:
        return (1 + self.wins.get(arm, 0.0)) / (2 + self.evidence(arm))


@dataclass
class DeckCard:
    product: Product
    tag: str        # for_you | new_direction
    score: float


@dataclass
class TasteModel:
    colors: ArmStats
    categories: ArmStats
    swipes: int

    def learned(self, stats: ArmStats, n: int = 3) -> list[str]:
        arms = [a for a in set(stats.wins) | set(stats.losses) if stats.evidence(a) >= EXPLORATION_OBSERVATIONS]
        return sorted((a for a in arms if stats.mean(a) > 0.55), key=stats.mean, reverse=True)[:n]

    @property
    def confidence(self) -> float:
        """How formed the taste profile is: 0 (no swipes) to 1 (~30 recent swipes)."""
        return round(1 - math.exp(-self.swipes / 12), 2)


def build_taste_model(history: list[Interaction], now: datetime | None = None) -> TasteModel:
    now = now or datetime.now(UTC)
    colors, categories = ArmStats(), ArmStats()
    for item in history:
        created = item.created_at if item.created_at.tzinfo else item.created_at.replace(tzinfo=UTC)
        weight = 0.5 ** (max(0.0, (now - created).total_seconds()) / 86400 / HALF_LIFE_DAYS)
        reward = ACTION_WEIGHT.get(item.action, 0.0)
        colors.observe(color_family(item.product.color_hex), reward, weight)
        categories.observe(item.product.category, reward, weight)
    return TasteModel(colors, categories, len(history))


def _palette_fit(product: Product, season_labs: np.ndarray | None) -> float:
    if season_labs is None or not product.color_hex:
        return 0.5
    distance = float(delta_e_2000(hex_to_lab(product.color_hex)[None, :], season_labs).min())
    return math.exp(-distance / 14.0)


def compose_deck(candidates: list[Product], profile: Profile | None, model: TasteModel, match_scores: dict[str, int],
                 size: int, rng: np.random.Generator | None = None) -> list[DeckCard]:
    rng = rng or np.random.default_rng()
    season = get_season(profile.season) if profile else None
    season_labs = np.array([hex_to_lab(s.hex) for s in season.wearable]) if season else None

    scored: list[DeckCard] = []
    for product in candidates:
        family = color_family(product.color_hex) or "unknown"
        category = product.category or "unknown"
        fit = _palette_fit(product, season_labs)
        # Colour arm: palette fit is the prior (worth two pseudo-swipes), then evidence.
        a_color = 1 + 2 * fit + model.colors.wins.get(family, 0.0)
        b_color = 1 + 2 * (1 - fit) + model.colors.losses.get(family, 0.0)
        a_cat = 1 + model.categories.wins.get(category, 0.0)
        b_cat = 1 + model.categories.losses.get(category, 0.0)
        sample = math.sqrt(rng.beta(a_color, b_color) * rng.beta(a_cat, b_cat))
        match = match_scores.get(product.id, 50) / 100
        score = (1 - MATCH_WEIGHT) * sample + MATCH_WEIGHT * match

        # "New direction": an unexplored colour family that won on an optimistic draw.
        expected = math.sqrt(a_color / (a_color + b_color) * a_cat / (a_cat + b_cat))
        exploring = (model.swipes >= 4 and model.colors.evidence(family) < EXPLORATION_OBSERVATIONS
                     and sample > expected + 0.15)
        tag = "new_direction" if exploring else "for_you"
        scored.append(DeckCard(product, tag, score))

    scored.sort(key=lambda card: card.score, reverse=True)
    deck: list[DeckCard] = []
    per_brand: dict[str, int] = defaultdict(int)
    explorations = 0
    for card in scored:
        brand = (card.product.brand or card.product.store).lower()
        if per_brand[brand] >= PER_BRAND:
            continue
        if card.tag == "new_direction":
            if explorations >= MAX_NEW_DIRECTION:
                continue
            explorations += 1
        per_brand[brand] += 1
        deck.append(card)
        if len(deck) == size:
            break
    return deck


def top_up_queries(profile: Profile, model: TasteModel, pool: list[Product], size: int) -> list[str]:
    """Searches that refill the catalog when it can't serve the user's taste.

    Each query names a garment so retailers return clothing, not cosmetics."""
    garment = (model.learned(model.categories, 1) or [DEFAULT_GARMENT.get(profile.gender or "", "top")])[0]
    queries = []
    families = model.learned(model.colors, 2)
    if not families:
        season = get_season(profile.season)
        if season:
            families = [color_family(season.signature[model.swipes % len(season.signature)].hex) or "neutral-dark"]
    for family in families:
        have = sum(color_family(p.color_hex) == family for p in pool)
        if have < size // 2 and family in FAMILY_QUERY_WORD:
            queries.append(f"{FAMILY_QUERY_WORD[family]} {garment}")
    # Explore: bring in one colour family the user hasn't been shown yet, so the deck can
    # discover tastes the palette prior would never have surfaced.
    shown = {f for f in FAMILY_QUERY_WORD if model.colors.evidence(f) >= EXPLORATION_OBSERVATIONS}
    in_pool = Counter(color_family(p.color_hex) for p in pool)
    unexplored = [f for f in FAMILY_QUERY_WORD if f not in shown and in_pool[f] < 2]
    if unexplored and model.swipes >= 4:
        queries.append(f"{FAMILY_QUERY_WORD[unexplored[model.swipes % len(unexplored)]]} {garment}")
    if len(pool) < size * 3:
        queries.insert(0, garment)
    return queries
