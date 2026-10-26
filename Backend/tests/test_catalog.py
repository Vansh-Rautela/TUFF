import math
import threading
import time

import pandas as pd
import pytest

from catalog import (
    ProductSearch, build_search_query, dataframe_to_products, detect_gender, extract_category,
    extract_color, filter_by_gender, filter_by_price, interleave_by_brand, normalize_product,
    parse_price, parse_price_filter,
)


def test_extract_color_prefers_multiword_and_aliases():
    assert extract_color('Navy Blue Slim Shirt') == 'navy'
    assert extract_color('Grey melange tee') == 'grey'
    assert extract_color('Gray Hoodie') == 'grey'
    assert extract_color('Plain kurta') is None


def test_extract_category():
    assert extract_category('Men Slim Fit Jeans') == 'jeans'
    assert extract_category('Graphic Tshirt') == 't-shirt'
    assert extract_category('Cotton Kurti for women') == 'kurta'


def test_detect_gender_uses_whole_words():
    # Regression: the old substring check matched "men" inside "women".
    assert detect_gender("Women's Kurta") == 'women'
    assert detect_gender("Men's Shirt") == 'men'
    assert detect_gender('Unisex Hoodie') == 'unisex'
    assert detect_gender('Slim Fit Shirt') is None


def test_filter_by_gender_drops_only_opposite_gender():
    products = [{'title': "Women's Kurta"}, {'title': "Men's Shirt"}, {'title': 'Plain Tee'}, {'title': 'Unisex Cap'}]
    assert [p['title'] for p in filter_by_gender(products, 'Male')] == ["Men's Shirt", 'Plain Tee', 'Unisex Cap']
    assert [p['title'] for p in filter_by_gender(products, 'Female')] == ["Women's Kurta", 'Plain Tee', 'Unisex Cap']
    assert len(filter_by_gender(products, 'Unisex')) == 4


@pytest.mark.parametrize('raw, expected', [
    ('₹1,299', 1299.0), ('Rs. 899', 899.0), ('1299.50', 1299.5), (499, 499.0),
    ('No price', None), ('', None), (None, None), (float('nan'), None), (0, None),
])
def test_parse_price(raw, expected):
    assert parse_price(raw) == expected


def test_normalize_product_rejects_placeholders_and_nan():
    assert normalize_product({'Title': 'No title', 'Link': 'https://x'}) is None
    assert normalize_product({'Title': 'Shirt', 'Link': '#'}) is None
    product = normalize_product({'Title': 'Olive Shirt', 'Link': 'https://x/1', 'Image': 'No image', 'Price': float('nan')}, 'Myntra')
    assert product['thumbnail'] == ''
    assert product['price'] is None and product['price_value'] is None
    assert product['brand'] == 'Myntra'
    assert product['color'] == 'olive' and product['category'] == 'shirt'


def test_dataframe_to_products_dedupes_links():
    df = pd.DataFrame([
        {'Title': 'A Shirt', 'Link': 'https://x/1', 'Price': '100'},
        {'Title': 'A Shirt again', 'Link': 'https://x/1', 'Price': '100'},
    ])
    assert len(dataframe_to_products(df, 'Amazon')) == 1


def test_build_search_query_basic():
    assert build_search_query('Male', 'red kurta for wedding', ['Ethnic']) == 'men red kurta wedding ethnic'
    assert build_search_query('Female') == 'women clothing'
    assert build_search_query(None, '') == 'clothing'


def test_build_search_query_never_leaks_profile_dump():
    # Older frontends sent a multi-line profile including name and date of birth.
    profile = ("User Profile for Personalized Fashion Product Search:\n- Name: Priya Sharma\n"
               "- Date of Birth: 4/5/2001\n- Username: priya01\n")
    query = build_search_query('Female', profile)
    assert 'priya' not in query.lower() and '2001' not in query
    assert query == 'women clothing'


def test_build_search_query_caps_terms_and_strips_symbols():
    query = build_search_query(None, 'blue <script> shirt; jeans & jacket, shoes boots socks belts')
    assert '<' not in query and ';' not in query
    assert len(query.split()) <= 6


@pytest.mark.parametrize('label, expected', [
    ('Under 500', (0.0, 500.0)), ('500-1000', (500.0, 1000.0)), ('Above 5000', (5000.0, math.inf)), ('cheap', None),
])
def test_parse_price_filter(label, expected):
    assert parse_price_filter(label) == expected


def test_filter_by_price():
    products = [{'price_value': 400}, {'price_value': 1500}, {'price_value': None}]
    assert filter_by_price(products, ['Under 500']) == [{'price_value': 400}]
    assert filter_by_price(products, []) == products


def test_interleave_is_fair_and_bounded():
    by_brand = {
        'A': [{'link': f'a{i}'} for i in range(10)],
        'B': [{'link': 'b0'}, {'link': 'b1'}],
        'C': [],
    }
    result = interleave_by_brand(by_brand, 5)
    assert [p['link'] for p in result] == ['a0', 'b0', 'a1', 'b1', 'a2']
    assert len(interleave_by_brand(by_brand, 100)) == 12


def _search(registry, **kwargs):
    defaults = dict(workers=2, timeout_seconds=5, cache_ttl=60)
    defaults.update(kwargs)
    return ProductSearch(registry_loader=lambda: registry, **defaults)


def test_product_search_caches_results():
    calls = []

    def scraper(query):
        calls.append(query)
        return pd.DataFrame([{'Title': 'Olive Shirt', 'Link': 'https://x/1', 'Price': '100'}])

    search = _search({'Myntra': scraper})
    first, errors = search.search('men shirt', ['Myntra'])
    second, _ = search.search('MEN SHIRT ', ['Myntra'])
    assert errors == {}
    assert first == second and len(first['Myntra']) == 1
    assert calls == ['men shirt']


def test_product_search_cache_expires():
    now = [0.0]
    calls = []

    def scraper(query):
        calls.append(query)
        return pd.DataFrame([{'Title': 'Shirt', 'Link': 'https://x/1'}])

    search = _search({'Myntra': scraper}, cache_ttl=10, clock=lambda: now[0])
    search.search('q', ['Myntra'])
    now[0] = 11
    search.search('q', ['Myntra'])
    assert len(calls) == 2


def test_product_search_isolates_failures_and_timeouts():
    release = threading.Event()

    def broken(query):
        raise RuntimeError('selector changed')

    def slow(query):
        release.wait(5)
        return pd.DataFrame([{'Title': 'Late Shirt', 'Link': 'https://x/late'}])

    def ok(query):
        return pd.DataFrame([{'Title': 'Shirt', 'Link': 'https://x/1'}])

    search = _search({'Amazon': broken, 'Flipkart': slow, 'Myntra': ok}, workers=3, timeout_seconds=0.3)
    results, errors = search.search('q', ['Amazon', 'Flipkart', 'Myntra'])
    assert errors == {'Amazon': 'failed', 'Flipkart': 'timed out'}
    assert list(results) == ['Myntra']

    # The slow scraper keeps running and fills the cache for the next request.
    release.set()
    deadline = time.time() + 5
    while time.time() < deadline:
        results, errors = search.search('q', ['Flipkart'])
        if 'Flipkart' in results:
            break
        time.sleep(0.05)
    assert results['Flipkart'][0]['title'] == 'Late Shirt'


def test_product_search_shares_in_flight_runs():
    calls = []
    gate = threading.Event()

    def scraper(query):
        calls.append(query)
        gate.wait(5)
        return pd.DataFrame([{'Title': 'Shirt', 'Link': 'https://x/1'}])

    search = _search({'Myntra': scraper}, workers=2)
    outputs = []
    threads = [threading.Thread(target=lambda: outputs.append(search.search('q', ['Myntra']))) for _ in range(2)]
    for t in threads:
        t.start()
    time.sleep(0.2)
    gate.set()
    for t in threads:
        t.join(5)
    assert len(calls) == 1
    assert all(out[0]['Myntra'][0]['title'] == 'Shirt' for out in outputs)


def test_resolve_brands_defaults_and_unknowns():
    search = _search({'Myntra': None, 'Amazon': None, 'Zara': None})
    assert search.resolve_brands(['Zara', 'Nope', 'Zara']) == ['Zara']
    assert search.resolve_brands([]) == ['Myntra', 'Amazon']
