import json
import os

import pytest

from user_preferences import UserPreferenceManager
from validation import ValidationError


@pytest.fixture
def manager(tmp_path):
    return UserPreferenceManager(str(tmp_path / 'data'))


def test_rejects_path_traversal_user_ids(manager, tmp_path):
    with pytest.raises(ValidationError):
        manager.update_user_info('../../escaped', {'gender': 'Male'})
    with pytest.raises(ValidationError):
        manager.load_user_preferences('../x')
    assert not any(p.name.startswith('escaped') for p in tmp_path.rglob('*'))


def test_roundtrip_and_atomic_write_leaves_no_temp_files(manager):
    assert manager.update_user_info('u1', {'gender': 'Female', 'occasions': ['work']})
    prefs = manager.load_user_preferences('u1')
    assert prefs.gender == 'Female' and prefs.occasions == ['work']
    assert sorted(os.listdir(manager.storage_path)) == ['u1.json']


def test_loads_files_with_unknown_or_missing_keys(manager):
    path = os.path.join(manager.storage_path, 'old.json')
    with open(path, 'w') as f:
        json.dump({'user_id': 'old', 'gender': 'Male', 'legacy_field': 1, 'swipe_history': [{
            'product_id': 'p', 'product_title': 'Black Jeans', 'product_brand': 'Myntra', 'product_image': '',
            'product_price': None, 'product_link': 'https://x/1', 'action': 'like', 'timestamp': 't',
            'product_features': {}, 'extra': True}]}, f)
    prefs = manager.load_user_preferences('old')
    assert prefs.gender == 'Male' and len(prefs.swipe_history) == 1
    # Color/category are derived from the title when features are missing.
    analysis = manager.analyze_preferences('old')
    assert analysis['favorite_colors'] == ['black'] and analysis['favorite_categories'] == ['jeans']


def test_update_user_info_validates_types(manager):
    with pytest.raises(ValueError):
        manager.update_user_info('u1', {'style_preferences': 'casual'})
    assert manager.update_user_info('u1', {'ignored_field': 1, 'budget_range': {'min': 0, 'max': 2000}})


def test_likes_dedupe_and_remove(manager):
    product = {'title': 'Olive Shirt', 'link': 'https://x/1', 'brand': 'Myntra'}
    manager.add_swipe_action('u1', product, 'like')
    manager.add_swipe_action('u1', product, 'like')
    assert len(manager.get_liked_products('u1')) == 1
    assert manager.remove_like('u1', 'https://x/1') is True
    assert manager.get_liked_products('u1') == []
    assert manager.remove_like('u1', 'https://x/1') is False


def test_recommendations_hide_disliked_and_optionally_liked(manager):
    manager.update_user_info('u1', {'gender': 'Male'})
    manager.add_swipe_action('u1', {'title': 'Red Shirt', 'link': 'https://x/red'}, 'dislike')
    manager.add_swipe_action('u1', {'title': 'Blue Shirt', 'link': 'https://x/blue'}, 'like')
    products = [
        {'title': 'Red Shirt', 'link': 'https://x/red'},
        {'title': 'Blue Shirt', 'link': 'https://x/blue'},
        {'title': "Women's Top", 'link': 'https://x/w'},
        {'title': 'Green Shirt', 'link': 'https://x/green'},
    ]
    links = [p['link'] for p in manager.get_personalized_recommendations('u1', products)]
    assert links == ['https://x/blue', 'https://x/green']
    links = [p['link'] for p in manager.get_personalized_recommendations('u1', products, exclude_swiped=True)]
    assert links == ['https://x/green']
