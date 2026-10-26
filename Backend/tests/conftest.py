import os
import sys

import pandas as pd
import pytest

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

# Keep tests away from real data and real API keys.
os.environ['GEMINI_API_KEY'] = ''


def make_df(rows):
    return pd.DataFrame(rows)


def fake_registry(calls=None):
    """Scrapers that return canned DataFrames and record each query."""
    calls = calls if calls is not None else []

    def scraper(brand, rows):
        def run(query):
            calls.append((brand, query))
            return make_df(rows)
        return run

    return {
        'Myntra': scraper('Myntra', [
            {'Title': "Women's Olive Kurta", 'Price': 'Rs. 1299', 'Image': 'https://img/1.jpg', 'Link': 'https://myntra.com/1'},
            {'Title': 'Slim Fit Navy Shirt', 'Price': '899', 'Image': 'https://img/2.jpg', 'Link': 'https://myntra.com/2'},
            {'Title': 'No title', 'Price': 'No price', 'Image': 'No image', 'Link': '#'},
        ]),
        'Flipkart': scraper('Flipkart', [
            {'Title': "Men's Black Jeans", 'Price': '₹2,499', 'Image': 'https://img/3.jpg', 'Link': 'https://flipkart.com/3'},
            {'Title': 'Rust Cotton T-Shirt', 'Price': float('nan'), 'Image': 'https://img/4.jpg', 'Link': 'https://flipkart.com/4'},
        ]),
        'Amazon': scraper('Amazon', [
            {'Title': 'Mustard Hoodie', 'Price': '1,099', 'Image': 'https://img/5.jpg', 'Link': 'https://amazon.in/5'},
        ]),
    }


@pytest.fixture
def scraper_calls():
    return []


@pytest.fixture
def client(tmp_path, monkeypatch, scraper_calls):
    import main
    from catalog import ProductSearch
    from user_preferences import UserPreferenceManager

    monkeypatch.setattr(main, 'pref_manager', UserPreferenceManager(str(tmp_path / 'user_data')))
    monkeypatch.setattr(main, 'product_search', ProductSearch(
        registry_loader=lambda: fake_registry(scraper_calls), workers=2, timeout_seconds=5, cache_ttl=60))
    main.app.config['TESTING'] = True
    return main.app.test_client()
