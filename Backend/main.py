import os
import base64
import uuid
from flask import Flask, request, jsonify
from flask_cors import CORS
from facial_color_analyzer import FacialColorAnalyzer
import sys
import pandas as pd
from typing import List, Dict, Any
from product_cache import product_cache

# Make Webscraping module importable
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
WEB_SCRAPE_DIR = os.path.join(CURRENT_DIR, 'Webscraping')
if WEB_SCRAPE_DIR not in sys.path:
    sys.path.append(WEB_SCRAPE_DIR)

# Try to import scrapers as a module and other site-specific modules
scrapers_mod = None
try:
    import scrapers as scrapers_mod  # noqa: F401
    print("✅ Webscraping module 'scrapers' loaded successfully.")
except Exception as e:
    print(f"❌ Failed to import 'scrapers' module: {e}")
    scrapers_mod = None

def _safe_attr(module, attr_name):
    try:
        return getattr(module, attr_name)
    except Exception:
        return None

def _brand_to_scraper_map():
    mapping = {}
    # Central scrapers.py functions (if available)
    if scrapers_mod:
        mapping.update({
            'Amazon': _safe_attr(scrapers_mod, 'scrape_amazon'),
            'Flipkart': _safe_attr(scrapers_mod, 'scrape_flipkart'),
            'Myntra': _safe_attr(scrapers_mod, 'scrape_myntra'),
            'Nykaa': _safe_attr(scrapers_mod, 'scrape_nykaa'),
            'Zara': _safe_attr(scrapers_mod, 'scrape_zara'),
            'H&M': _safe_attr(scrapers_mod, 'scrape_hnm'),
            'Levis': _safe_attr(scrapers_mod, 'scrape_levis'),
            'Lifestyle': _safe_attr(scrapers_mod, 'scrape_lifestyle'),
            'Ajio': _safe_attr(scrapers_mod, 'scrape_ajio'),
            'Bewakoof': _safe_attr(scrapers_mod, 'scrape_bewakoof'),
        })

    # Site-specific modules in Webscraping
    try:
        from savana import scrape_westside, scrape_urbanic  # type: ignore
        mapping['Westside'] = scrape_westside
        mapping['Urbanic'] = scrape_urbanic
    except Exception:
        pass

    try:
        from libass import scrape_libas  # type: ignore
        mapping['Libas'] = scrape_libas
    except Exception:
        pass

    try:
        from montecarlo import scrape_monte_carlo  # type: ignore
        mapping['Monte Carlo'] = scrape_monte_carlo
    except Exception:
        pass

    try:
        from souledstore import scrape_souled_store  # type: ignore
        mapping['Souled Store'] = scrape_souled_store
    except Exception:
        pass

    # Filter out Nones
    final_mapping = {k: v for k, v in mapping.items() if v is not None}
    print(f"📦 Loaded {len(final_mapping)} scrapers: {list(final_mapping.keys())}")
    return final_mapping

app = Flask(__name__)
CORS(app)  # Allow cross-origin requests

# Ensure an 'uploads' directory exists
if not os.path.exists('uploads'):
    os.makedirs('uploads')

# Lazy initialization to avoid MediaPipe startup errors
_analyzer = None
_analyzer_error = None

def get_analyzer():
    """Get or create FacialColorAnalyzer instance"""
    global _analyzer, _analyzer_error
    
    if _analyzer_error:
        # If previously failed, return None
        return None
    
    if _analyzer is None:
        try:
            _analyzer = FacialColorAnalyzer()
        except Exception as e:
            _analyzer_error = str(e)
            print(f"Failed to initialize FacialColorAnalyzer: {e}")
            return None
    
    return _analyzer

@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.get_json()
    if 'image' not in data:
        return jsonify({'error': 'No image data provided'}), 400
    
    filepath = None # Initialize filepath to ensure it's defined for cleanup
    try:
        # Decode base64 image
        image_data = data['image']
        # The frontend sends a data URL: "data:image/jpeg;base64,..."
        # We need to strip the header
        header, encoded = image_data.split(',', 1)
        image_bytes = base64.b64decode(encoded)
        
        # Save temporarily
        image_format = header.split(';')[0].split('/')[1]
        filename = f"temp_{uuid.uuid4()}.{image_format}"
        filepath = os.path.join('uploads', filename)
        with open(filepath, 'wb') as f:
            f.write(image_bytes)
    except Exception as e:
        return jsonify({'error': f'Invalid image data: {str(e)}'}), 400

    # Analyze the image
    try:
        analyzer = get_analyzer()  # Lazy load analyzer
        
        if analyzer is None:
            # MediaPipe not available
            return jsonify({
                'error': 'Color analysis temporarily unavailable. MediaPipe initialization failed. You can skip this step for now.'
            }), 503
        
        result = analyzer.analyze_face_color(filepath)
        # Clean up the temporary file
        os.remove(filepath)
        
        if 'error' in result:
            return jsonify(result), 400
            
        return jsonify(result)
        
    except Exception as e:
        # Clean up the temporary file in case of an error during analysis
        if filepath and os.path.exists(filepath):
            os.remove(filepath)
        return jsonify({'error': f'Analysis failed: {str(e)}'}), 500

# -------------------- SCRAPE PRODUCTS SUPPORT --------------------

def _build_query_from_user(user_data: Dict[str, Any], prompt: str = '') -> str:
    """
    Build search query from user data, always including gender and cloth type
    """
    parts: List[str] = []
    
    # ALWAYS include gender if available (from user_data or localStorage)
    gender = user_data.get('gender')
    if not gender:
        # Try to get from user preferences if available
        user_id = user_data.get('userId')
        if user_id:
            try:
                preferences = pref_manager.load_user_preferences(user_id)
                if preferences and preferences.gender:
                    gender = preferences.gender
            except:
                pass
    
    if gender:
        parts.append(str(gender))
    
    # Include cloth type/category from prompt if specified
    cloth_types = ['shirt', 'pants', 'dress', 'top', 'bottom', 'jeans', 'kurta', 'saree', 'suit', 'jacket', 'shoes']
    if prompt:
        prompt_lower = prompt.lower()
        for cloth_type in cloth_types:
            if cloth_type in prompt_lower:
                parts.append(cloth_type)
                break
    
    body_type = user_data.get('bodyType')
    if body_type:
        parts.append(str(body_type))
    
    # Color analysis terms
    color_analysis = user_data.get('colorAnalysisResult') or user_data.get('colorAnalysis')
    if isinstance(color_analysis, dict):
        skintone = color_analysis.get('skintone', {})
        season = skintone.get('season')
        undertone = skintone.get('undertone')
        if season:
            parts.append(str(season))
        if undertone:
            parts.append(str(undertone))
        comp = color_analysis.get('complementaryColors')
        if isinstance(comp, list) and comp:
            names = [c.get('name') or c.get('hex') for c in comp[:3] if isinstance(c, dict)]
            parts.extend([n for n in names if n])
    
    # Add prompt terms if provided (ONLY if they look like fashion keywords)
    if prompt:
        # Avoid including the long boilerplate text from frontend
        ignore_words = [
            'user', 'profile', 'personalized', 'fashion', 'product', 'search', 
            'date', 'birth', 'username', 'preferences', 'match', 'selected', 
            'brands', 'websites', 'clothes', 'clothing', 'best', 'that'
        ]
        
        # Extract key terms from prompt (avoid duplicates and boilerplate)
        prompt_words = prompt.replace(':', ' ').replace('-', ' ').replace('\n', ' ').split()
        for word in prompt_words:
            word_clean = word.lower().strip(',.()')
            if (word_clean not in [p.lower() for p in parts] and 
                word_clean not in ignore_words and 
                len(word_clean) > 2):
                parts.append(word)
    
    # Fallback generic (but still include gender if we have it)
    if not parts:
        if gender:
            parts = [gender, 'fashion', 'clothing']
        else:
            parts = ['fashion', 'clothing']
    
    final_query = ' '.join(parts)
    print(f"🔍 Generated Search Query: '{final_query}'")
    return final_query

def _df_to_products(df: pd.DataFrame) -> List[Dict[str, Any]]:
    products = []
    for _, row in df.iterrows():
        products.append({
            'title': row.get('Title') or row.get('title') or 'Product',
            'link': row.get('Link') or row.get('url') or '',
            'thumbnail': row.get('Image') or row.get('thumbnail') or '',
            'price': row.get('Price') or row.get('price') or None,
            'brand': row.get('Source') or row.get('brand') or None,
        })
    return products

def _filter_products_by_gender(products: List[Dict[str, Any]], user_gender: str) -> List[Dict[str, Any]]:
    """
    Filter products to match user's gender preference
    Gender keywords: Male, Female, Men, Women, Boys, Girls, Unisex
    """
    if not user_gender:
        return products
    
    user_gender_lower = user_gender.lower()
    filtered = []
    
    # Gender mapping
    gender_keywords = {
        'male': ['men', 'male', 'man', 'boys', 'boy'],
        'female': ['women', 'female', 'woman', 'girls', 'girl', 'ladies', 'lady'],
        'men': ['men', 'male', 'man', 'boys', 'boy'],
        'women': ['women', 'female', 'woman', 'girls', 'girl', 'ladies', 'lady']
    }
    
    # Get keywords for user's gender
    keywords = gender_keywords.get(user_gender_lower, [user_gender_lower])
    
    for product in products:
        title = (product.get('title') or '').lower()
        # Check if product title contains gender keywords or is unisex
        is_match = False
        
        # Check for unisex (always include)
        if 'unisex' in title:
            is_match = True
        else:
            # Check for user's gender keywords
            for keyword in keywords:
                if keyword in title:
                    is_match = True
                    break
            
            # Also check for opposite gender (exclude those)
            if not is_match:
                opposite_keywords = []
                if 'male' in user_gender_lower or 'men' in user_gender_lower:
                    opposite_keywords = ['women', 'female', 'woman', 'girls', 'girl', 'ladies', 'lady']
                elif 'female' in user_gender_lower or 'women' in user_gender_lower:
                    opposite_keywords = ['men', 'male', 'man', 'boys', 'boy']
                
                # Exclude if contains opposite gender keywords
                for opp_keyword in opposite_keywords:
                    if opp_keyword in title:
                        is_match = False
                        break
        
        if is_match:
            filtered.append(product)
    
    # If no filtered results, return original (to avoid empty results)
    return filtered if filtered else products

@app.route('/scrape_products', methods=['POST'])
def scrape_products():
    """
    Web scraping with balanced product distribution
    Ensures at least 1-2 products from each selected brand
    """
    try:
        payload = request.get_json(force=True) or {}
        user_data = payload.get('userData') or {}
        filters = payload.get('filters') or {}
        prompt = payload.get('prompt') or ''

        # Determine brands/sites to scrape
        selected_brands: List[str] = []
        if isinstance(filters.get('brands'), list):
            selected_brands = [str(b) for b in filters['brands']]
        elif isinstance(user_data.get('brands'), list):
            selected_brands = [str(b) for b in user_data['brands']]

        brand_map = _brand_to_scraper_map()
        active_scrapers = []
        for b in selected_brands:
            func = brand_map.get(b)
            if func:
                active_scrapers.append((b, func))

        # Default to major Indian platforms if nothing selected
        if not active_scrapers:
            default_brands = ['Myntra', 'Flipkart', 'Amazon']
            for b in default_brands:
                func = brand_map.get(b)
                if func:
                    active_scrapers.append((b, func))

        # Build query (always includes gender and cloth type)
        query = _build_query_from_user(user_data, prompt)
        
        if not active_scrapers:
            print("⚠️ No active scrapers found for this request!")

        # Run scrapers with balanced distribution
        all_products_by_brand = {}
        for brand_name, scraper in active_scrapers:
            if scraper is None:
                continue
            try:
                print(f"Scraping {brand_name}...")
                df = scraper(query)
                if isinstance(df, pd.DataFrame) and not df.empty:
                    # Ensure source brand tag
                    if 'Source' not in df.columns:
                        df['Source'] = brand_name
                    all_products_by_brand[brand_name] = _df_to_products(df)
                    print(f"✓ {brand_name}: {len(df)} products")
            except Exception as e:
                print(f"✗ {brand_name} scraping failed: {e}")
                continue

        # Filter products by gender if user has set gender
        user_gender = user_data.get('gender')
        if not user_gender:
            # Try to get from user preferences
            user_id = user_data.get('userId')
            if user_id:
                try:
                    preferences = pref_manager.load_user_preferences(user_id)
                    if preferences and preferences.gender:
                        user_gender = preferences.gender
                except:
                    pass
        
        # Balance products - take at least 2 from each brand, then fill remaining
        balanced_products: List[Dict[str, Any]] = []
        
        # First pass: Get 2 products from each brand (filtered by gender if available)
        for brand_name, products in all_products_by_brand.items():
            if products:
                # Filter by gender if user has set gender
                if user_gender:
                    gender_filtered = _filter_products_by_gender(products, user_gender)
                    balanced_products.extend(gender_filtered[:2])  # Minimum 2 per brand
                else:
                    balanced_products.extend(products[:2])  # Minimum 2 per brand
        
        # Second pass: Fill remaining slots equally (with gender filter)
        remaining_slots = 50 - len(balanced_products)
        if remaining_slots > 0:
            for brand_name, products in all_products_by_brand.items():
                remaining_from_brand = products[2:]  # Skip first 2 already added
                if user_gender:
                    remaining_from_brand = _filter_products_by_gender(remaining_from_brand, user_gender)
                if remaining_from_brand:
                    take_count = min(len(remaining_from_brand), remaining_slots // len(all_products_by_brand))
                    balanced_products.extend(remaining_from_brand[:take_count])

        return jsonify({'products': balanced_products})
        
    except Exception as e:
        return jsonify({'error': f'Failed to scrape products: {str(e)}'}), 500

# -------------------- USER PREFERENCES & SWIPE FUNCTIONALITY --------------------

from user_preferences import UserPreferenceManager, UserPreferences

# Initialize preference manager
pref_manager = UserPreferenceManager()

@app.route('/swipe_action', methods=['POST'])
def swipe_action():
    """Handle user swipe action (like/dislike)"""
    try:
        data = request.get_json(force=True) or {}
        user_id = data.get('userId')
        product = data.get('product')
        action = data.get('action')  # 'like' or 'dislike'
        
        if not user_id or not product or not action:
            return jsonify({'error': 'Missing required fields: userId, product, action'}), 400
        
        if action not in ['like', 'dislike']:
            return jsonify({'error': 'Action must be "like" or "dislike"'}), 400
        
        success = pref_manager.add_swipe_action(user_id, product, action)
        
        if success:
            return jsonify({
                'success': True,
                'message': f'Product {action}d successfully'
            })
        else:
            return jsonify({'error': 'Failed to save swipe action'}), 500
            
    except Exception as e:
        return jsonify({'error': f'Swipe action failed: {str(e)}'}), 500

@app.route('/user_preferences/<user_id>', methods=['GET'])
def get_user_preferences(user_id):
    """Get user preferences and profile"""
    try:
        preferences = pref_manager.load_user_preferences(user_id)
        
        if preferences is None:
            return jsonify({
                'exists': False,
                'message': 'No preferences found for this user'
            })
        
        # Convert to dict for JSON response
        from dataclasses import asdict
        pref_dict = asdict(preferences)
        
        return jsonify({
            'exists': True,
            'preferences': pref_dict
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to get preferences: {str(e)}'}), 500

@app.route('/update_user_info', methods=['POST'])
def update_user_info():
    """Update user information (color analysis, sizes, gender, etc.)"""
    try:
        data = request.get_json(force=True) or {}
        user_id = data.get('userId')
        updates = data.get('updates')
        
        if not user_id or not updates:
            return jsonify({'error': 'Missing userId or updates'}), 400
        
        success = pref_manager.update_user_info(user_id, updates)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'User info updated successfully'
            })
        else:
            return jsonify({'error': 'Failed to update user info'}), 500
            
    except Exception as e:
        return jsonify({'error': f'Update failed: {str(e)}'}), 500

@app.route('/user_analysis/<user_id>', methods=['GET'])
def get_user_analysis(user_id):
    """Get analysis of user's preferences based on swipe history"""
    try:
        analysis = pref_manager.analyze_preferences(user_id)
        return jsonify({
            'success': True,
            'analysis': analysis
        })
    except Exception as e:
        return jsonify({'error': f'Analysis failed: {str(e)}'}), 500

@app.route('/liked_products/<user_id>', methods=['GET'])
def get_liked_products(user_id):
    """Get all products liked by the user"""
    try:
        liked = pref_manager.get_liked_products(user_id)
        from dataclasses import asdict
        liked_list = [asdict(item) for item in liked]
        
        return jsonify({
            'success': True,
            'liked_products': liked_list,
            'count': len(liked_list)
        })
    except Exception as e:
        return jsonify({'error': f'Failed to get liked products: {str(e)}'}), 500

@app.route('/personalized_recommendations', methods=['POST'])
def get_personalized_recommendations():
    """
    Get personalized product recommendations based on:
    - Color analysis
    - Swipe history
    - User preferences
    """
    try:
        data = request.get_json(force=True) or {}
        user_id = data.get('userId')
        products = data.get('products', [])
        
        if not user_id:
            return jsonify({'error': 'Missing userId'}), 400
        
        # Get personalized recommendations
        recommendations = pref_manager.get_personalized_recommendations(user_id, products)
        
        # Get user analysis for context
        analysis = pref_manager.analyze_preferences(user_id)
        
        return jsonify({
            'success': True,
            'recommendations': recommendations[:50],  # Top 50 recommendations
            'user_analysis': analysis,
            'total_products': len(recommendations)
        })
        
    except Exception as e:
        return jsonify({'error': f'Recommendation failed: {str(e)}'}), 500

@app.route('/homepage_feed/<user_id>', methods=['GET'])
def get_homepage_feed(user_id):
    """
    Get personalized homepage feed combining:
    1. Recently liked products
    2. Recommended products based on preferences
    """
    try:
        # Get user preferences
        preferences = pref_manager.load_user_preferences(user_id)
        
        if preferences is None:
            return jsonify({
                'success': False,
                'message': 'Please complete your profile first',
                'feed': []
            })
        
        # Get user analysis
        analysis = pref_manager.analyze_preferences(user_id)
        
        # Get recently liked products
        liked = pref_manager.get_liked_products(user_id)
        from dataclasses import asdict
        recent_likes = [asdict(item) for item in liked[-10:]]  # Last 10 likes
        
        return jsonify({
            'success': True,
            'user_analysis': analysis,
            'recent_likes': recent_likes,
            'color_analysis': preferences.color_analysis,
            'style_summary': {
                'favorite_brands': analysis['favorite_brands'],
                'favorite_colors': analysis['favorite_colors'],
                'favorite_styles': analysis['favorite_styles']
            }
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to get homepage feed: {str(e)}'}), 500


# -------------------- TUFFY AI STYLE ADVISOR --------------------

from tuffy_advisor import get_tuffy

@app.route('/tuffy/chat', methods=['POST'])
def tuffy_chat():
    """
    Chat with TUFFY - The AI Style God
    """
    try:
        data = request.get_json(force=True) or {}
        user_id = data.get('userId')
        message = data.get('message')
        user_data = data.get('userData', {})
        
        if not user_id or not message:
            return jsonify({'error': 'Missing userId or message'}), 400
        
        tuffy = get_tuffy()
        response = tuffy.get_chat_response(user_id, message, user_data)
        
        return jsonify(response)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'tuffy_says': '✨ My divine powers are temporarily unavailable!'
        }), 500


@app.route('/tuffy/style_tip', methods=['POST'])
def tuffy_style_tip():
    """
    Get a quick style tip from TUFFY
    """
    try:
        data = request.get_json(force=True) or {}
        user_data = data.get('userData', {})
        
        tuffy = get_tuffy()
        tip = tuffy.get_style_tip(user_data)
        
        return jsonify({
            'success': True,
            'tip': tip
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'tip': '✨ Trust your style instincts!'
        }), 500


@app.route('/tuffy/analyze_outfit', methods=['POST'])
def tuffy_analyze_outfit():
    """
    Get TUFFY's analysis of outfit combination
    """
    try:
        data = request.get_json(force=True) or {}
        items = data.get('items', [])
        user_data = data.get('userData', {})
        
        if not items:
            return jsonify({'error': 'No items provided'}), 400
        
        tuffy = get_tuffy()
        analysis = tuffy.analyze_outfit(items, user_data)
        
        return jsonify({
            'success': True,
            'analysis': analysis
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'analysis': '✨ Each piece has its own divine charm!'
        }), 500


@app.route('/tuffy/show_products', methods=['POST'])
def tuffy_show_products():
    """
    Get products for TUFFY to show in chat
    """
    try:
        data = request.get_json(force=True) or {}
        query = data.get('query', '')
        brand = data.get('brand', '')
        limit = data.get('limit', 5)
        
        if not query:
            return jsonify({'error': 'No query provided'}), 400
        
        # Build scraper list
        brand_map = _brand_to_scraper_map()
        scrapers_to_use = []
        
        if brand and brand in brand_map:
            # Specific brand requested
            scrapers_to_use = [(brand, brand_map[brand])]
        else:
            # Use popular brands
            for b in ['Myntra', 'Flipkart', 'Amazon']:
                if b in brand_map:
                    scrapers_to_use.append((b, brand_map[b]))
        
        # Scrape products
        all_products = []
        for brand_name, scraper in scrapers_to_use:
            if scraper is None:
                continue
            try:
                print(f"TUFFY: Scraping {brand_name} for '{query}'...")
                df = scraper(query)
                if isinstance(df, pd.DataFrame) and not df.empty:
                    products = _df_to_products(df)
                    all_products.extend(products[:limit])  # Take first N per brand
                    if len(all_products) >= limit:
                        break
            except Exception as e:
                print(f"TUFFY: Failed to scrape {brand_name}: {e}")
                continue
        
        # Return top N products
        return jsonify({
            'success': True,
            'products': all_products[:limit],
            'count': len(all_products[:limit])
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'products': []
        }), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)
