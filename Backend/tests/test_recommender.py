from recommender import rank_products
from user_preferences import UserPreferences

AUTUMN = {'skintone': {'season': 'Autumn', 'undertone': 'Warm'}}


def product(title, link, **extra):
    return {'title': title, 'link': link, **extra}


def test_no_preferences_keeps_order_with_zero_scores():
    products = [product('A Shirt', '1'), product('B Shirt', '2')]
    ranked = rank_products(products)
    assert [p['link'] for p in ranked] == ['1', '2']
    assert all(p['match_score'] == 0 and p['match_reasons'] == [] for p in ranked)


def test_palette_colors_rank_above_avoid_colors():
    prefs = UserPreferences(user_id='u', color_analysis=AUTUMN)
    ranked = rank_products([
        product('Pastel Pink Top', 'pink'),     # avoid for Autumn
        product('Plain Top', 'plain'),
        product('Olive Green Top', 'olive'),    # palette
    ], prefs)
    assert [p['link'] for p in ranked] == ['olive', 'plain', 'pink']
    assert ranked[0]['match_reasons'] == ['Olive Green is in your Autumn palette']
    assert ranked[-1]['match_score'] == 0  # clamped, never negative


def test_swipe_history_budget_and_style_signals():
    prefs = UserPreferences(user_id='u', style_preferences=['casual'], budget_range={'min': 0, 'max': 2000}, gender='Male')
    analysis = {'favorite_brands': ['Myntra'], 'favorite_colors': ['black'], 'favorite_categories': ['jeans']}
    ranked = rank_products([
        product('Formal Blazer', 'blazer', brand='Zara', price_value=9000),
        product("Men's Casual Black Jeans", 'jeans', brand='Myntra', price_value=1500),
    ], prefs, analysis)
    top = ranked[0]
    assert top['link'] == 'jeans'
    assert top['match_score'] == 15 + 15 + 15 + 15 + 10 + 5
    assert 'Within your budget' in top['match_reasons']
    assert ranked[1]['match_score'] == 0


def test_disliked_only_colors_are_penalised():
    prefs = UserPreferences(user_id='u', budget_range={'min': 0, 'max': 5000})
    ranked = rank_products([
        product('Red Shirt', 'red', price_value=100),
        product('Blue Shirt', 'blue', price_value=100),
    ], prefs, {}, disliked_colors=['red'])
    assert [p['link'] for p in ranked] == ['blue', 'red']


def test_inputs_are_not_mutated_and_legacy_key_present():
    original = product('Olive Shirt', '1')
    ranked = rank_products([original], UserPreferences(user_id='u', color_analysis=AUTUMN))
    assert 'match_score' not in original
    assert ranked[0]['recommendation_score'] == ranked[0]['match_score']


def test_handles_none_fields_from_old_clients():
    ranked = rank_products([{'title': None, 'link': 'x', 'color': None, 'brand': None, 'price': 'No price'}],
                           UserPreferences(user_id='u', color_analysis=AUTUMN, style_preferences=['casual']))
    assert ranked[0]['match_score'] == 0
