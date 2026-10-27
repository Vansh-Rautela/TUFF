"""Tests for the research-derived methods: skin measurement, hierarchy, harmony, bandit deck."""
from datetime import UTC, datetime, timedelta

import numpy as np
import pytest

from app.db.models import Interaction, Product, Profile
from app.services.color.color_harmony import harmony_for_hex
from app.services.color.seasonal_palettes import get_season
from app.services.color.skin_tone_analyzer import _histogram_mode, _measure_skin, _season_scores
from app.services.recommendation.adaptive_deck import build_taste_model, color_family, compose_deck
from app.services.recommendation.outfit_builder import build_outfits, suggest_partners

# ---- skin measurement (Thong & Xiang 2023) ------------------------------------------


def test_histogram_mode_finds_the_peak():
    values = np.concatenate([np.full(200, 62.0), np.random.default_rng(0).uniform(30, 90, 60)])
    assert abs(_histogram_mode(values) - 62) < 4


def test_shadowed_pixels_do_not_darken_the_reading():
    rng = np.random.default_rng(1)
    lit = np.column_stack([rng.normal(65, 1.5, 3000), rng.normal(14, 1, 3000), rng.normal(20, 1, 3000)])
    shadow = np.column_stack([rng.normal(38, 2, 1500), rng.normal(10, 1, 1500), rng.normal(14, 1, 1500)])
    image = np.concatenate([lit, shadow]).reshape(50, 90, 3).astype(np.float32)
    reading = _measure_skin(image, np.full((50, 90), 255, dtype=np.uint8))
    assert reading.lightness > 58          # the lightest clusters win, as in the paper
    assert 50 < reading.hue < 60           # atan2(20, 14) ≈ 55°


def test_warm_axes_only_ever_produce_warm_seasons():
    for lightness in (-1, 0, 1):
        for clarity in (-1, 0, 1):
            scores = _season_scores((0.8, lightness, clarity))
            best = max(scores, key=scores.get)
            assert best.split()[-1] in {"Spring", "Autumn"}

# ---- colour harmony -------------------------------------------------------------------


@pytest.mark.parametrize("a, b, kind", [
    ("#6B6B2E", "#F2EEE3", "neutral"),      # olive + off white
    ("#B7410E", "#D4A017", "analogous"),    # rust + mustard
    ("#1B2A4A", "#8EC5E8", "neutral"),      # navy is a fashion neutral
    ("#1E8A5A", "#A8DDC0", "tonal"),        # emerald + mint
    ("#F28C28", "#8EC5E8", "complementary"),  # ~184° apart in CIELAB
    ("#D6247D", "#B8D430", "clash"),        # fuchsia + lime
])
def test_harmony_kinds(a, b, kind):
    assert harmony_for_hex(a, b).kind == kind


def test_harmony_prefers_neutrals_and_analogous_over_bold_complements():
    neutral = harmony_for_hex("#6B6B2E", "#F2EEE3").score
    analogous = harmony_for_hex("#B7410E", "#D4A017").score
    complement = harmony_for_hex("#F28C28", "#8EC5E8").score
    # Royal blue / orange are "complements" on a paint wheel but ~130° apart in CIELAB:
    # Henry & Westland found CIELAB opposition doesn't predict perceived complements anyway.
    assert harmony_for_hex("#2C4FB8", "#F28C28").kind != "complementary"
    assert neutral > complement and analogous > complement
    assert harmony_for_hex("#B7410E", "#B9420F").score < analogous  # near-identical shades are flagged

# ---- outfits ----------------------------------------------------------------------------------


def item(pid, title, category, hex_color, **kw):
    return Product(id=pid.ljust(40, "0"), store="Myntra", url=f"https://x/{pid}", title=title, category=category,
                   color_hex=hex_color, **kw)


def test_outfits_pair_tops_and_bottoms_by_harmony():
    saved = [item("t1", "Olive Shirt", "shirt", "#6B6B2E"), item("t2", "Fuchsia Top", "top", "#D6247D"),
             item("b1", "Beige Trousers", "trousers", "#D9C7A7"), item("b2", "Lime Skirt", "skirt", "#B8D430")]
    outfits = build_outfits(saved, get_season("Warm Autumn"))
    best = outfits[0]
    assert {p.title for p in best.items} == {"Olive Shirt", "Beige Trousers"}
    assert best.harmony.kind == "neutral"
    assert all(o.harmony.kind != "clash" for o in outfits[:2])


def test_partner_suggestions_for_unpaired_pieces():
    suggestions = suggest_partners([item("t1", "Rust Top", "top", "#B7410E")], get_season("Warm Autumn"), "women")
    assert suggestions[0].need == "bottom" and suggestions[0].query.startswith("women ")
    assert len(suggestions[0].colors) == 3

# ---- Thompson-sampling deck ----------------------------------------------------------------


def test_color_families():
    assert color_family("#1B2A4A") == "blue" and color_family("#111111") == "neutral-dark"
    assert color_family("#D9C7A7") == "earth" and color_family("#B7410E") == "red"
    assert color_family(None) is None


def swipe(product, action, days_ago=0.0):
    record = Interaction(user_id="u", product_id=product.id, action=action,
                         created_at=datetime.now(UTC) - timedelta(days=days_ago))
    record.product = product
    return record


def pool(n=40):
    colors = ["#B7410E", "#CFE6F2", "#1E8A5A", "#D6247D", "#6B6B2E"]
    return [item(f"p{i}", f"Item {i}", ["shirt", "dress", "kurta", "jeans"][i % 4], colors[i % 5], brand=f"B{i}")
            for i in range(n)]


def test_cold_start_deck_leans_towards_the_palette():
    autumn = Profile(user_id="u", season="Warm Autumn", styles=[], occasions=[], favorite_stores=[])
    model = build_taste_model([])
    hits = 0
    for seed in range(20):
        deck = compose_deck(pool(), autumn, model, {}, 10, np.random.default_rng(seed))
        hits += sum(card.product.color_hex in {"#B7410E", "#6B6B2E"} for card in deck)
    assert hits / (20 * 10) > 0.5  # 2 of 5 colours are on-palette; they should fill more than half the decks


def test_deck_learns_from_swipes():
    products = pool()
    greens = [p for p in products if p.color_hex == "#1E8A5A"][:4]
    pinks = [p for p in products if p.color_hex == "#D6247D"][:4]
    history = [swipe(p, "love") for p in greens] + [swipe(p, "dislike") for p in pinks]
    model = build_taste_model(history)
    assert model.colors.mean("green") > 0.8 and model.colors.mean("pink") < 0.25
    assert model.learned(model.colors) == ["green"]
    remaining = [p for p in products if p not in greens + pinks]
    green_share = np.mean([sum(c.product.color_hex == "#1E8A5A" for c in
                               compose_deck(remaining, None, model, {}, 8, np.random.default_rng(s)))
                           for s in range(20)]) / 8
    assert green_share > 0.3  # 4 of 32 remaining products are green (12.5%)


def test_recency_decay_and_brand_cap_and_confidence():
    old = build_taste_model([swipe(pool()[2], "like", days_ago=42)])
    assert old.colors.wins["green"] == pytest.approx(0.25, abs=0.01)
    same_brand = [item(f"s{i}", "x", "shirt", "#B7410E", brand="Solo") for i in range(10)]
    deck = compose_deck(same_brand, None, build_taste_model([]), {}, 10)
    assert len(deck) == 2
    assert build_taste_model([]).confidence == 0
    assert build_taste_model([swipe(p, "like") for p in pool(30)]).confidence > 0.9


def test_new_direction_cards_are_tagged():
    products = pool()
    history = [swipe(p, "like") for p in products[:6] if p.color_hex == "#B7410E"] + \
              [swipe(products[5], "like"), swipe(products[10], "like"), swipe(products[15], "like")]
    model = build_taste_model(history)
    tags = {c.tag for seed in range(30) for c in compose_deck(products[20:], None, model, {}, 10,
                                                                   np.random.default_rng(seed))}
    assert tags == {"for_you", "new_direction"}
