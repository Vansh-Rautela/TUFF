import os

import pytest

import main
from test_validation import png_data_url


class FakeAnalyzer:
    detector_name = 'fake'

    def __init__(self, result):
        self.result = result
        self.images = []

    def analyze_image(self, image):
        self.images.append(image.shape)
        return self.result


def test_health(client):
    body = client.get('/health').get_json()
    assert body['status'] == 'ok'
    assert body['tuffy_configured'] is False
    assert body['scrapers'] == ['Amazon', 'Flipkart', 'Myntra']


@pytest.mark.parametrize('payload', [None, [], 'text'])
def test_analyze_rejects_non_object_bodies(client, payload):
    # Regression: a null JSON body used to raise TypeError and return 500.
    response = client.post('/analyze', json=payload)
    assert response.status_code == 400
    assert 'JSON object' in response.get_json()['error']


def test_analyze_rejects_bad_images(client):
    response = client.post('/analyze', json={'image': 'data:image/png;base64,AAAA'})
    assert response.status_code == 400


def test_analyze_success_does_not_touch_disk(client, monkeypatch, tmp_path):
    analyzer = FakeAnalyzer({'success': True, 'skintone': {'season': 'Autumn'}})
    monkeypatch.setattr(main, '_analyzer', analyzer)
    workdir = tmp_path / 'cwd'
    workdir.mkdir()
    monkeypatch.chdir(workdir)
    response = client.post('/analyze', json={'image': png_data_url()})
    assert response.status_code == 200
    assert response.get_json()['skintone']['season'] == 'Autumn'
    assert analyzer.images == [(30, 40, 3)]
    assert os.listdir(workdir) == []  # no temp upload files (old code leaked them on 503)


def test_analyze_reports_no_face_as_422(client, monkeypatch):
    monkeypatch.setattr(main, '_analyzer', FakeAnalyzer({'error': 'No face detected in the image.'}))
    response = client.post('/analyze', json={'image': png_data_url()})
    assert response.status_code == 422
    assert response.get_json()['error'].startswith('No face detected')


def test_analyze_unavailable_returns_503(client, monkeypatch):
    monkeypatch.setattr(main, '_analyzer', None)
    monkeypatch.setattr(main, '_analyzer_error', 'mediapipe missing')
    response = client.post('/analyze', json={'image': png_data_url()})
    assert response.status_code == 503
    assert 'mediapipe' not in response.get_json()['error']


def test_oversized_request_returns_json_413(client, monkeypatch):
    monkeypatch.setitem(main.app.config, 'MAX_CONTENT_LENGTH', 1000)
    response = client.post('/analyze', json={'image': 'data:image/png;base64,' + 'A' * 2000})
    assert response.status_code == 413
    assert 'too large' in response.get_json()['error']


def test_scrape_products_normalizes_balances_and_filters(client, scraper_calls):
    response = client.post('/scrape_products', json={
        'userData': {'userId': 'u1', 'gender': 'Male', 'name': 'Priya'},
        'filters': {'brands': ['Myntra', 'Flipkart']},
        'prompt': 'navy shirt',
    })
    body = response.get_json()
    assert response.status_code == 200
    assert body['query'] == 'men navy shirt'
    assert sorted(c[0] for c in scraper_calls) == ['Flipkart', 'Myntra']
    titles = [p['title'] for p in body['products']]
    # Women's item filtered for a male user; placeholder rows dropped; brands interleaved.
    assert titles == ['Slim Fit Navy Shirt', "Men's Black Jeans", 'Rust Cotton T-Shirt']
    assert body['products'][0]['price'] == '₹899'
    assert body['products'][2]['price'] is None  # NaN price no longer leaks into JSON


def test_scrape_products_price_filter_and_default_brands(client, scraper_calls):
    body = client.post('/scrape_products', json={'filters': {'prices': ['1000-2000']}}).get_json()
    assert sorted(c[0] for c in scraper_calls) == ['Amazon', 'Flipkart', 'Myntra']
    assert [p['title'] for p in body['products']] == ["Women's Olive Kurta", 'Mustard Hoodie']


def test_scrape_products_uses_saved_gender(client):
    client.post('/update_user_info', json={'userId': 'u2', 'updates': {'gender': 'Female'}})
    body = client.post('/scrape_products', json={'userData': {'userId': 'u2'}}).get_json()
    assert body['query'] == 'women clothing'
    assert "Men's Black Jeans" not in [p['title'] for p in body['products']]


@pytest.mark.parametrize('user_id', ['../../escape', 'a/b', '', None])
def test_user_routes_reject_bad_ids(client, user_id):
    response = client.post('/update_user_info', json={'userId': user_id, 'updates': {'gender': 'Male'}})
    assert response.status_code == 400
    response = client.post('/swipe_action', json={'userId': user_id, 'product': {'link': 'https://x'}, 'action': 'like'})
    assert response.status_code == 400


def test_get_routes_reject_bad_ids(client):
    assert client.get('/user_preferences/bad.id').status_code == 400
    assert client.get('/liked_products/bad.id').status_code == 400


def test_swipe_like_list_and_remove_flow(client):
    product = {'title': 'Olive Shirt', 'link': 'https://x/1', 'brand': 'Myntra', 'thumbnail': 'https://img/1'}
    assert client.post('/swipe_action', json={'userId': 'u1', 'product': product, 'action': 'like'}).status_code == 200
    assert client.post('/swipe_action', json={'userId': 'u1', 'product': product, 'action': 'meh'}).status_code == 400

    liked = client.get('/liked_products/u1').get_json()
    assert liked['count'] == 1 and liked['liked_products'][0]['product_features']['color'] == 'olive'

    removed = client.post('/liked_products/u1/remove', json={'link': 'https://x/1'}).get_json()
    assert removed == {'success': True, 'removed': True}
    assert client.get('/liked_products/u1').get_json()['count'] == 0


def test_update_user_info_rejects_wrong_types(client):
    response = client.post('/update_user_info', json={'userId': 'u1', 'updates': {'style_preferences': 'casual'}})
    assert response.status_code == 400


def test_personalized_recommendations_scores_and_explains(client):
    client.post('/update_user_info', json={'userId': 'u1', 'updates': {
        'color_analysis': {'skintone': {'season': 'Autumn'}}, 'gender': 'Female'}})
    body = client.post('/personalized_recommendations', json={'userId': 'u1', 'products': [
        {'title': 'Black Top', 'link': 'https://x/black', 'price': '₹900'},
        {'title': 'Olive Top', 'link': 'https://x/olive', 'price': '₹900'},
        {'title': 'broken'},
        'not a product',
    ]}).get_json()
    recs = body['recommendations']
    assert [r['link'] for r in recs] == ['https://x/olive', 'https://x/black']
    assert recs[0]['match_score'] == 25 and recs[0]['match_reasons']


def test_homepage_feed_requires_profile(client):
    assert client.get('/homepage_feed/nobody').get_json()['success'] is False
    client.post('/update_user_info', json={'userId': 'u1', 'updates': {'gender': 'Male', 'style_preferences': ['casual']}})
    body = client.get('/homepage_feed/u1').get_json()
    assert body['success'] and body['profile']['gender'] == 'Male'
    assert body['user_analysis']['favorite_styles'] == ['casual']


def test_tuffy_chat_without_key_is_503_with_friendly_message(client):
    response = client.post('/tuffy/chat', json={'userId': 'u1', 'message': 'hi'})
    assert response.status_code == 503
    assert 'TUFFY' in response.get_json()['tuffy_says']


def test_tuffy_chat_validates_input(client):
    assert client.post('/tuffy/chat', json={'userId': 'u1', 'message': '  '}).status_code == 400
    assert client.post('/tuffy/chat', json={'userId': 'u1', 'message': 'x' * 5000}).status_code == 400


def test_tuffy_style_tip_falls_back_to_rules(client):
    body = client.post('/tuffy/style_tip', json={'userData': {'colorAnalysis': {'skintone': {'season': 'Spring'}}}}).get_json()
    assert body['source'] == 'rules' and 'Spring' in body['tip']


def test_tuffy_show_products_returns_normalized_products(client):
    body = client.post('/tuffy/show_products', json={'query': 'hoodie', 'brand': 'Amazon', 'limit': 3}).get_json()
    assert body['count'] == 1 and body['products'][0]['thumbnail'] == 'https://img/5.jpg'
    assert client.post('/tuffy/show_products', json={'query': ''}).status_code == 400


def test_unknown_route_is_json_404(client):
    response = client.get('/nope')
    assert response.status_code == 404 and response.get_json()['success'] is False
