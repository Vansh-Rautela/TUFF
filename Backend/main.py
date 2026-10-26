"""
TUFF backend API (Flask).

Routes are thin: validation lives in validation.py, product search in
catalog.py, ranking in recommender.py, storage in user_preferences.py and the
Gemini stylist in tuffy_advisor.py. Run with `python main.py`.
"""
import threading
from dataclasses import asdict
from typing import Any, Dict, List

from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.exceptions import HTTPException

import config
from catalog import (
    ProductSearch,
    build_search_query,
    filter_by_gender,
    filter_by_price,
    interleave_by_brand,
    normalize_product,
)
from user_preferences import UserPreferenceManager
from validation import ValidationError, decode_image_data_url, require_json_object, require_user_id

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = config.MAX_REQUEST_BYTES
CORS(app, origins=config.CORS_ORIGINS)

pref_manager = UserPreferenceManager()
product_search = ProductSearch()

MAX_CLIENT_PRODUCTS = 200


# -------------------- ERROR HANDLING --------------------

@app.errorhandler(ValidationError)
def handle_validation_error(error):
    return jsonify({'success': False, 'error': str(error)}), 400


@app.errorhandler(HTTPException)
def handle_http_error(error):
    messages = {413: 'Upload is too large. Please use a photo under 8 MB.'}
    return jsonify({'success': False, 'error': messages.get(error.code, error.description)}), error.code


@app.errorhandler(Exception)
def handle_unexpected_error(error):
    # Log details server-side; never send stack traces or internals to clients.
    app.logger.exception('Unhandled error on %s', request.path)
    return jsonify({'success': False, 'error': 'Something went wrong on our side. Please try again.'}), 500


def _json_body() -> Dict[str, Any]:
    return require_json_object(request.get_json(silent=True))


def _string_list(value: Any, limit: int = 20) -> List[str]:
    if not isinstance(value, list):
        return []
    return [str(v) for v in value[:limit] if isinstance(v, (str, int, float))]


@app.route('/health', methods=['GET'])
def health():
    """Liveness plus which optional integrations are configured."""
    return jsonify({
        'status': 'ok',
        'color_analysis': _analyzer_status(),
        'tuffy_configured': bool(config.GEMINI_API_KEY),
        'scrapers': product_search.available_brands(),
    })


# -------------------- COLOR ANALYSIS --------------------

_analyzer = None
_analyzer_error = None
_analyzer_lock = threading.Lock()


def get_analyzer():
    """Get or create the FacialColorAnalyzer (lazy: MediaPipe start-up is slow)."""
    global _analyzer, _analyzer_error
    with _analyzer_lock:
        if _analyzer is None and _analyzer_error is None:
            try:
                from facial_color_analyzer import FacialColorAnalyzer
                _analyzer = FacialColorAnalyzer()
            except Exception as e:
                _analyzer_error = str(e)
                app.logger.error('Failed to initialize FacialColorAnalyzer: %s', e)
        return _analyzer


def _analyzer_status() -> str:
    if _analyzer is not None:
        return _analyzer.detector_name
    return 'unavailable' if _analyzer_error else 'not loaded'


@app.route('/analyze', methods=['POST'])
def analyze():
    data = _json_body()
    # Decoded in memory: the photo is never written to disk.
    image = decode_image_data_url(data.get('image'), max_side=config.MAX_IMAGE_SIDE)

    analyzer = get_analyzer()
    if analyzer is None:
        return jsonify({
            'success': False,
            'error': 'Color analysis is temporarily unavailable on this server. You can skip this step for now.'
        }), 503

    result = analyzer.analyze_image(image)
    if 'error' in result:
        return jsonify({'success': False, **result}), 422
    return jsonify(result)


# -------------------- PRODUCT SEARCH --------------------

def _user_gender(user_data: Dict[str, Any]):
    gender = user_data.get('gender')
    if gender:
        return gender
    user_id = user_data.get('userId')
    if user_id:
        preferences = pref_manager.load_user_preferences(require_user_id(user_id))
        if preferences and preferences.gender:
            return preferences.gender
    return None


@app.route('/scrape_products', methods=['POST'])
def scrape_products():
    """
    Search the selected retailers and return a balanced product list.

    Body: {userData: {userId?, gender?, brands?}, filters: {brands?, prices?, styles?}, prompt?: str}
    """
    payload = _json_body()
    user_data = payload.get('userData') if isinstance(payload.get('userData'), dict) else {}
    filters = payload.get('filters') if isinstance(payload.get('filters'), dict) else {}
    prompt = payload.get('prompt') if isinstance(payload.get('prompt'), str) else ''

    requested = _string_list(filters.get('brands')) or _string_list(user_data.get('brands'))
    brands = product_search.resolve_brands(requested)
    gender = _user_gender(user_data)
    query = build_search_query(gender, prompt, _string_list(filters.get('styles')))
    app.logger.info('Product search on %s: %r', brands, query)

    products_by_brand, errors = product_search.search(query, brands)
    filtered = {
        brand: filter_by_price(filter_by_gender(items, gender), _string_list(filters.get('prices')))
        for brand, items in products_by_brand.items()
    }
    products = interleave_by_brand(filtered, config.MAX_PRODUCTS_PER_RESPONSE)

    return jsonify({
        'success': True,
        'products': products,
        'query': query,
        'brands': brands,
        'errors': errors,
    })


# -------------------- USER PREFERENCES & SWIPE FUNCTIONALITY --------------------

@app.route('/swipe_action', methods=['POST'])
def swipe_action():
    """Handle user swipe action (like/dislike)"""
    data = _json_body()
    user_id = require_user_id(data.get('userId'))
    product = data.get('product')
    action = data.get('action')  # 'like' or 'dislike'

    if not isinstance(product, dict) or not product.get('link'):
        raise ValidationError('Missing product (with a link).')
    if action not in ('like', 'dislike'):
        raise ValidationError('Action must be "like" or "dislike".')

    if not pref_manager.add_swipe_action(user_id, product, action):
        return jsonify({'success': False, 'error': 'Failed to save swipe action'}), 500
    return jsonify({'success': True, 'message': f'Product {action}d successfully'})


@app.route('/user_preferences/<user_id>', methods=['GET'])
def get_user_preferences(user_id):
    """Get user preferences and profile"""
    preferences = pref_manager.load_user_preferences(require_user_id(user_id))
    if preferences is None:
        return jsonify({'exists': False, 'message': 'No preferences found for this user'})
    return jsonify({'exists': True, 'preferences': asdict(preferences)})


@app.route('/update_user_info', methods=['POST'])
def update_user_info():
    """Update user information (color analysis, sizes, gender, etc.)"""
    data = _json_body()
    user_id = require_user_id(data.get('userId'))
    updates = data.get('updates')
    if not isinstance(updates, dict) or not updates:
        raise ValidationError('Missing updates object.')

    try:
        success = pref_manager.update_user_info(user_id, updates)
    except ValueError as error:
        raise ValidationError(str(error))
    if not success:
        return jsonify({'success': False, 'error': 'Failed to update user info'}), 500
    return jsonify({'success': True, 'message': 'User info updated successfully'})


@app.route('/user_analysis/<user_id>', methods=['GET'])
def get_user_analysis(user_id):
    """Get analysis of user's preferences based on swipe history"""
    analysis = pref_manager.analyze_preferences(require_user_id(user_id))
    return jsonify({'success': True, 'analysis': analysis})


@app.route('/liked_products/<user_id>', methods=['GET'])
def get_liked_products(user_id):
    """Get all products liked by the user"""
    liked = pref_manager.get_liked_products(require_user_id(user_id))
    liked_list = [asdict(item) for item in liked]
    return jsonify({'success': True, 'liked_products': liked_list, 'count': len(liked_list)})


@app.route('/liked_products/<user_id>/remove', methods=['POST'])
def remove_liked_product(user_id):
    """Remove one product (by link) from the user's liked list"""
    user_id = require_user_id(user_id)
    link = _json_body().get('link')
    if not isinstance(link, str) or not link:
        raise ValidationError('Missing product link.')
    removed = pref_manager.remove_like(user_id, link)
    return jsonify({'success': True, 'removed': removed})


@app.route('/personalized_recommendations', methods=['POST'])
def get_personalized_recommendations():
    """
    Rank the given products for the user based on:
    - Color analysis
    - Swipe history
    - User preferences
    """
    data = _json_body()
    user_id = require_user_id(data.get('userId'))
    raw_products = data.get('products') if isinstance(data.get('products'), list) else []

    products = []
    for raw in raw_products[:MAX_CLIENT_PRODUCTS]:
        if isinstance(raw, dict):
            normalized = normalize_product(raw)
            if normalized:
                products.append(normalized)

    recommendations = pref_manager.get_personalized_recommendations(
        user_id, products, exclude_swiped=bool(data.get('excludeSwiped'))
    )
    return jsonify({
        'success': True,
        'recommendations': recommendations[:config.MAX_PRODUCTS_PER_RESPONSE],
        'user_analysis': pref_manager.analyze_preferences(user_id),
        'total_products': len(recommendations)
    })


@app.route('/homepage_feed/<user_id>', methods=['GET'])
def get_homepage_feed(user_id):
    """
    Get personalized homepage feed combining:
    1. Recently liked products
    2. Recommended products based on preferences
    """
    user_id = require_user_id(user_id)
    preferences = pref_manager.load_user_preferences(user_id)

    if preferences is None:
        return jsonify({'success': False, 'message': 'Please complete your profile first', 'feed': []})

    analysis = pref_manager.analyze_preferences(user_id)
    liked = pref_manager.get_liked_products(user_id)

    return jsonify({
        'success': True,
        'user_analysis': analysis,
        'recent_likes': [asdict(item) for item in liked[-10:]],
        'color_analysis': preferences.color_analysis,
        'profile': {
            'gender': preferences.gender,
            'body_type': preferences.body_type,
            'style_preferences': preferences.style_preferences or [],
            'budget_range': preferences.budget_range,
        },
        'style_summary': {
            'favorite_brands': analysis['favorite_brands'],
            'favorite_colors': analysis['favorite_colors'],
            'favorite_styles': analysis['favorite_styles']
        }
    })


# -------------------- TUFFY AI STYLE ADVISOR --------------------

from tuffy_advisor import UNAVAILABLE_MESSAGE, TuffyUnavailable, get_tuffy, rule_based_style_tip


def _tuffy_or_503():
    try:
        return get_tuffy(), None
    except TuffyUnavailable as error:
        app.logger.warning('TUFFY unavailable: %s', error)
        return None, (jsonify({'success': False, 'error': 'TUFFY is not configured', 'tuffy_says': UNAVAILABLE_MESSAGE}), 503)


@app.route('/tuffy/chat', methods=['POST'])
def tuffy_chat():
    """
    Chat with TUFFY - The AI Style God
    """
    data = _json_body()
    user_id = require_user_id(data.get('userId'))
    message = data.get('message')
    user_data = data.get('userData') if isinstance(data.get('userData'), dict) else {}

    if not isinstance(message, str) or not message.strip():
        raise ValidationError('Missing message.')
    if len(message) > config.TUFFY_MAX_MESSAGE_CHARS:
        raise ValidationError(f'Message is too long (max {config.TUFFY_MAX_MESSAGE_CHARS} characters).')

    tuffy, unavailable = _tuffy_or_503()
    if unavailable:
        return unavailable

    response = tuffy.get_chat_response(user_id, message.strip(), user_data)
    return jsonify(response), (200 if response.get('success') else 502)


@app.route('/tuffy/style_tip', methods=['POST'])
def tuffy_style_tip():
    """
    Get a quick style tip from TUFFY (falls back to a palette-based tip)
    """
    data = _json_body()
    user_data = data.get('userData') if isinstance(data.get('userData'), dict) else {}
    try:
        tip, source = get_tuffy().get_style_tip(user_data), 'gemini'
    except TuffyUnavailable:
        tip, source = rule_based_style_tip(user_data), 'rules'
    return jsonify({'success': True, 'tip': tip, 'source': source})


@app.route('/tuffy/analyze_outfit', methods=['POST'])
def tuffy_analyze_outfit():
    """
    Get TUFFY's analysis of outfit combination
    """
    data = _json_body()
    items = data.get('items') if isinstance(data.get('items'), list) else []
    user_data = data.get('userData') if isinstance(data.get('userData'), dict) else {}
    if not items:
        raise ValidationError('No items provided.')

    tuffy, unavailable = _tuffy_or_503()
    if unavailable:
        return unavailable
    return jsonify({'success': True, 'analysis': tuffy.analyze_outfit(items, user_data)})


@app.route('/tuffy/show_products', methods=['POST'])
def tuffy_show_products():
    """
    Get products for TUFFY to show in chat
    """
    data = _json_body()
    query = data.get('query') if isinstance(data.get('query'), str) else ''
    brand = data.get('brand') if isinstance(data.get('brand'), str) else ''
    try:
        limit = max(1, min(int(data.get('limit', 5)), 12))
    except (TypeError, ValueError):
        limit = 5

    if not query.strip():
        raise ValidationError('No query provided.')

    brands = product_search.resolve_brands([brand] if brand else [])
    search_query = build_search_query(data.get('gender'), query)
    products_by_brand, errors = product_search.search(search_query, brands)
    products = interleave_by_brand(
        {b: filter_by_gender(items, data.get('gender')) for b, items in products_by_brand.items()}, limit
    )
    return jsonify({'success': True, 'products': products, 'count': len(products), 'errors': errors})


if __name__ == '__main__':
    app.run(host=config.HOST, port=config.PORT, debug=config.DEBUG)
