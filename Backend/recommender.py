"""
Deterministic product ranking from a user's profile and swipe history.

Every product gets a 0-100 `match_score` plus human-readable `match_reasons`,
so the UI can explain why something was recommended. Signals and weights:

    palette color (from color analysis)   25   (-15 if the color is one to avoid)
    liked colors (from swipes)            15   (-10 if only ever disliked)
    favorite brand (from swipes)          15
    liked category (from swipes)          15
    within budget                         15
    matches a chosen style                10
    explicitly made for the user's gender  5

Ties keep the retailer's original order, which already reflects search relevance.
"""
from typing import Any, Dict, Iterable, List, Optional

from catalog import detect_gender, extract_category, extract_color, normalize_gender, parse_price
from color_palettes import avoid_color_names, palette_color_names

WEIGHTS = {
    'palette': 25,
    'avoid': -15,
    'liked_color': 15,
    'disliked_color': -10,
    'brand': 15,
    'category': 15,
    'budget': 15,
    'style': 10,
    'gender': 5,
}


def _lower_set(values: Iterable[Any]) -> set:
    return {str(v).strip().lower() for v in values or [] if str(v or '').strip()}


def _color_in(color: Optional[str], names: set) -> bool:
    """'olive' matches palette 'olive'; 'blue' matches 'royal blue' and vice versa."""
    if not color:
        return False
    if color in names:
        return True
    return any(color in name.split() or name in color.split() for name in names)


def _season(preferences: Any) -> Optional[str]:
    color_analysis = getattr(preferences, 'color_analysis', None) or {}
    if not isinstance(color_analysis, dict):
        return None
    skintone = color_analysis.get('skintone') or {}
    return skintone.get('season') if isinstance(skintone, dict) else None


def _budget(preferences: Any):
    budget = getattr(preferences, 'budget_range', None) or {}
    if not isinstance(budget, dict):
        return None
    try:
        low = float(budget.get('min', 0) or 0)
        high = float(budget.get('max', 0) or 0)
    except (TypeError, ValueError):
        return None
    return (low, high) if high > 0 else None


def rank_products(
    products: List[Dict[str, Any]],
    preferences: Any = None,
    analysis: Optional[Dict[str, Any]] = None,
    disliked_colors: Iterable[str] = (),
) -> List[Dict[str, Any]]:
    """
    Score and sort products. `preferences` is a UserPreferences (or None),
    `analysis` is the dict from UserPreferenceManager.analyze_preferences.
    Input dicts are not mutated.
    """
    analysis = analysis or {}
    season = _season(preferences)
    palette = _lower_set(palette_color_names(season)) if season else set()
    avoid = _lower_set(avoid_color_names(season)) if season else set()
    liked_colors = _lower_set(analysis.get('favorite_colors'))
    only_disliked = _lower_set(disliked_colors) - liked_colors
    liked_brands = _lower_set(analysis.get('favorite_brands'))
    liked_categories = _lower_set(analysis.get('favorite_categories'))
    styles = _lower_set(getattr(preferences, 'style_preferences', None))
    budget = _budget(preferences)
    target_gender = normalize_gender(getattr(preferences, 'gender', None))

    ranked = []
    for position, product in enumerate(products):
        title = str(product.get('title') or '')
        title_lower = title.lower()
        color = (product.get('color') or extract_color(title) or '').lower() or None
        category = (product.get('category') or extract_category(title) or '').lower() or None
        brand = str(product.get('brand') or '').strip().lower()
        price = product.get('price_value')
        if price is None:
            price = parse_price(product.get('price'))

        score = 0
        reasons: List[str] = []

        if palette and _color_in(color, palette):
            score += WEIGHTS['palette']
            reasons.append(f"{color.title()} is in your {season} palette")
        elif avoid and _color_in(color, avoid):
            score += WEIGHTS['avoid']

        if _color_in(color, liked_colors):
            score += WEIGHTS['liked_color']
            reasons.append(f"You liked {color} pieces")
        elif _color_in(color, only_disliked):
            score += WEIGHTS['disliked_color']

        if brand and brand in liked_brands:
            score += WEIGHTS['brand']
            reasons.append(f"From {product.get('brand')}, a brand you like")

        if category and category in liked_categories:
            score += WEIGHTS['category']
            reasons.append(f"You've been liking {category}s")

        if budget and price is not None and budget[0] <= price <= budget[1]:
            score += WEIGHTS['budget']
            reasons.append('Within your budget')

        matched_style = next((s for s in styles if s in title_lower), None)
        if matched_style:
            score += WEIGHTS['style']
            reasons.append(f"Matches your {matched_style} style")

        product_gender = product.get('gender') or detect_gender(title)
        if target_gender and product_gender in (target_gender, 'unisex'):
            score += WEIGHTS['gender']

        match_score = max(0, min(100, score))
        # Sort on the raw score so penalties still push items down even though
        # the displayed score is clamped at 0.
        ranked.append((-score, position, {
            **product,
            'color': color,
            'category': category,
            'match_score': match_score,
            'match_reasons': reasons,
            # Kept for older clients that read this key.
            'recommendation_score': match_score,
        }))

    ranked.sort(key=lambda item: (item[0], item[1]))
    return [item[2] for item in ranked]
