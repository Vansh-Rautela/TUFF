"""
User Preferences Storage and Management
Handles swipe preferences, user likes/dislikes, and recommendation generation

Storage is one JSON file per user in config.DATA_DIR. Writes are atomic
(temp file + rename) and serialized with a lock, because Flask serves
requests on multiple threads.
"""
import json
import os
import tempfile
import threading
from datetime import datetime
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict, fields
from collections import defaultdict

import config
from catalog import extract_category, extract_color, filter_by_gender
from recommender import rank_products
from validation import require_user_id

@dataclass
class SwipeAction:
    """Represents a single swipe action on a product"""
    product_id: str
    product_title: str
    product_brand: str
    product_image: str
    product_price: Optional[str]
    product_link: str
    action: str  # 'like' or 'dislike'
    timestamp: str
    product_features: Dict[str, Any]  # color, category, style, etc.

@dataclass
class UserPreferences:
    """User preferences and profile data"""
    user_id: str
    color_analysis: Optional[Dict[str, Any]] = None
    gender: Optional[str] = None
    body_type: Optional[str] = None
    clothing_sizes: Optional[Dict[str, str]] = None  # {'tops': 'M', 'bottoms': 'L', etc.}
    style_preferences: Optional[List[str]] = None  # ['casual', 'formal', etc.]
    occasions: Optional[List[str]] = None  # ['work', 'party', etc.]
    favorite_brands: Optional[List[str]] = None
    budget_range: Optional[Dict[str, float]] = None  # {'min': 500, 'max': 5000}
    swipe_history: List[SwipeAction] = None

    def __post_init__(self):
        if self.swipe_history is None:
            self.swipe_history = []


def _known_fields(cls, data: Dict[str, Any]) -> Dict[str, Any]:
    """Drop keys a dataclass does not define, so old/new files both load."""
    names = {f.name for f in fields(cls)}
    return {k: v for k, v in data.items() if k in names}


EMPTY_ANALYSIS = {
    'favorite_brands': [],
    'favorite_colors': [],
    'favorite_styles': [],
    'favorite_categories': [],
    'total_likes': 0,
    'total_dislikes': 0,
    'like_rate': 0,
}

# Fields update_user_info accepts, with the type each must have.
_UPDATABLE_FIELDS = {
    'color_analysis': dict,
    'gender': str,
    'body_type': str,
    'clothing_sizes': dict,
    'style_preferences': list,
    'occasions': list,
    'favorite_brands': list,
    'budget_range': dict,
}


class UserPreferenceManager:
    """Manages user preferences and swipe history"""

    def __init__(self, storage_path: Optional[str] = None):
        self.storage_path = storage_path or config.DATA_DIR
        os.makedirs(self.storage_path, exist_ok=True)
        self._lock = threading.RLock()

    def _get_user_file(self, user_id: str) -> str:
        """Get the file path for a user's preferences"""
        # Rejects ids like "../../etc/x" so a user id can never escape storage_path.
        return os.path.join(self.storage_path, f"{require_user_id(user_id)}.json")

    def save_user_preferences(self, preferences: UserPreferences) -> bool:
        """Save user preferences to disk"""
        user_file = self._get_user_file(preferences.user_id)
        try:
            with self._lock:
                fd, tmp_path = tempfile.mkstemp(dir=self.storage_path, suffix='.tmp')
                try:
                    with os.fdopen(fd, 'w') as f:
                        json.dump(asdict(preferences), f, indent=2)
                    os.replace(tmp_path, user_file)
                except BaseException:
                    if os.path.exists(tmp_path):
                        os.remove(tmp_path)
                    raise
            return True
        except Exception as e:
            print(f"Error saving user preferences: {e}")
            return False

    def load_user_preferences(self, user_id: str) -> Optional[UserPreferences]:
        """Load user preferences from disk"""
        user_file = self._get_user_file(user_id)
        try:
            with self._lock:
                if not os.path.exists(user_file):
                    return None
                with open(user_file, 'r') as f:
                    data = json.load(f)

            # Convert swipe_history back to SwipeAction objects
            data['swipe_history'] = [
                SwipeAction(**_known_fields(SwipeAction, action))
                for action in data.get('swipe_history') or []
            ]

            return UserPreferences(**_known_fields(UserPreferences, data))
        except Exception as e:
            print(f"Error loading user preferences: {e}")
            return None

    def _load_or_create(self, user_id: str) -> UserPreferences:
        return self.load_user_preferences(user_id) or UserPreferences(user_id=user_id)

    def add_swipe_action(self, user_id: str, product: Dict[str, Any], action: str) -> bool:
        """Add a swipe action to user's history"""
        try:
            title = str(product.get('title') or '')
            swipe = SwipeAction(
                product_id=str(product.get('id') or product.get('link') or ''),
                product_title=title,
                product_brand=str(product.get('brand') or ''),
                product_image=str(product.get('thumbnail') or ''),
                product_price=product.get('price'),
                product_link=str(product.get('link') or ''),
                action=action,
                timestamp=datetime.now().isoformat(),
                product_features={
                    'category': product.get('category') or extract_category(title) or '',
                    'color': product.get('color') or extract_color(title) or '',
                    'style': product.get('style') or '',
                    'tags': product.get('tags') or []
                }
            )
            with self._lock:
                preferences = self._load_or_create(user_id)
                preferences.swipe_history.append(swipe)
                return self.save_user_preferences(preferences)
        except Exception as e:
            print(f"Error adding swipe action: {e}")
            return False

    def remove_like(self, user_id: str, product_link: str) -> bool:
        """Remove a product from the user's liked items. Returns True if anything changed."""
        with self._lock:
            preferences = self.load_user_preferences(user_id)
            if preferences is None:
                return False
            before = len(preferences.swipe_history)
            preferences.swipe_history = [
                s for s in preferences.swipe_history
                if not (s.action == 'like' and s.product_link == product_link)
            ]
            if len(preferences.swipe_history) == before:
                return False
            return self.save_user_preferences(preferences)

    def get_liked_products(self, user_id: str) -> List[SwipeAction]:
        """Get all liked products for a user (one entry per product, most recent like wins)"""
        preferences = self.load_user_preferences(user_id)
        if preferences is None:
            return []
        latest: Dict[str, SwipeAction] = {}
        for swipe in preferences.swipe_history:
            if swipe.action == 'like':
                key = swipe.product_link or swipe.product_id
                latest.pop(key, None)
                latest[key] = swipe
        return list(latest.values())

    def get_disliked_products(self, user_id: str) -> List[SwipeAction]:
        """Get all disliked products for a user"""
        preferences = self.load_user_preferences(user_id)
        if preferences is None:
            return []
        return [s for s in preferences.swipe_history if s.action == 'dislike']

    def analyze_preferences(self, user_id: str) -> Dict[str, Any]:
        """Analyze user's swipe history to extract preferences"""
        return self._analyze(self.load_user_preferences(user_id))

    @staticmethod
    def _analyze(preferences: Optional[UserPreferences]) -> Dict[str, Any]:
        if preferences is None:
            return dict(EMPTY_ANALYSIS)
        if not preferences.swipe_history:
            return {**EMPTY_ANALYSIS, 'favorite_styles': list(preferences.style_preferences or [])[:5]}

        liked = [s for s in preferences.swipe_history if s.action == 'like']
        disliked = [s for s in preferences.swipe_history if s.action == 'dislike']

        # Count frequencies
        brand_counts = defaultdict(int)
        color_counts = defaultdict(int)
        style_counts = defaultdict(int)
        category_counts = defaultdict(int)

        for swipe in liked:
            if swipe.product_brand:
                brand_counts[swipe.product_brand] += 1

            features = swipe.product_features or {}
            color = features.get('color') or extract_color(swipe.product_title)
            category = features.get('category') or extract_category(swipe.product_title)
            if color:
                color_counts[color] += 1
            if features.get('style'):
                style_counts[features['style']] += 1
            if category:
                category_counts[category] += 1

        def top(counts):
            return [k for k, _ in sorted(counts.items(), key=lambda x: x[1], reverse=True)[:5]]

        return {
            'favorite_brands': top(brand_counts),
            'favorite_colors': top(color_counts),
            'favorite_styles': top(style_counts) or list(preferences.style_preferences or [])[:5],
            'favorite_categories': top(category_counts),
            'total_likes': len(liked),
            'total_dislikes': len(disliked),
            'like_rate': len(liked) / len(preferences.swipe_history) if preferences.swipe_history else 0
        }

    def update_user_info(self, user_id: str, updates: Dict[str, Any]) -> bool:
        """Update user information (color analysis, sizes, etc.)"""
        try:
            with self._lock:
                preferences = self._load_or_create(user_id)
                for field_name, expected_type in _UPDATABLE_FIELDS.items():
                    if field_name in updates:
                        value = updates[field_name]
                        if value is not None and not isinstance(value, expected_type):
                            raise ValueError(f"'{field_name}' must be a {expected_type.__name__}")
                        setattr(preferences, field_name, value)
                return self.save_user_preferences(preferences)
        except ValueError:
            raise
        except Exception as e:
            print(f"Error updating user info: {e}")
            return False

    def get_personalized_recommendations(
        self,
        user_id: str,
        available_products: List[Dict[str, Any]],
        exclude_swiped: bool = False,
    ) -> List[Dict[str, Any]]:
        """
        Rank products for a user using color analysis, explicit preferences
        and swipe history (see recommender.py for the scoring).

        Disliked products are always removed; with exclude_swiped=True liked
        ones are removed too (used by the swipe deck so cards are not repeated).
        """
        preferences = self.load_user_preferences(user_id)
        if preferences is None:
            return rank_products(available_products)

        products = filter_by_gender(available_products, preferences.gender)

        swiped_actions = {'like', 'dislike'} if exclude_swiped else {'dislike'}
        hidden_links = {s.product_link for s in preferences.swipe_history if s.action in swiped_actions}
        products = [p for p in products if p.get('link') not in hidden_links]

        disliked_colors = [
            (s.product_features or {}).get('color') or extract_color(s.product_title)
            for s in preferences.swipe_history if s.action == 'dislike'
        ]
        return rank_products(products, preferences, self._analyze(preferences), [c for c in disliked_colors if c])
