"""
User Preferences Storage and Management
Handles swipe preferences, user likes/dislikes, and recommendation generation
"""
import json
import os
from datetime import datetime
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
from collections import defaultdict

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
    favorite_brands: Optional[List[str]] = None
    budget_range: Optional[Dict[str, float]] = None  # {'min': 500, 'max': 5000}
    swipe_history: List[SwipeAction] = None
    
    def __post_init__(self):
        if self.swipe_history is None:
            self.swipe_history = []

class UserPreferenceManager:
    """Manages user preferences and swipe history"""
    
    def __init__(self, storage_path: str = 'user_data'):
        self.storage_path = storage_path
        if not os.path.exists(storage_path):
            os.makedirs(storage_path)
    
    def _get_user_file(self, user_id: str) -> str:
        """Get the file path for a user's preferences"""
        return os.path.join(self.storage_path, f"{user_id}.json")
    
    def save_user_preferences(self, preferences: UserPreferences) -> bool:
        """Save user preferences to disk"""
        try:
            user_file = self._get_user_file(preferences.user_id)
            data = asdict(preferences)
            with open(user_file, 'w') as f:
                json.dump(data, f, indent=2)
            return True
        except Exception as e:
            print(f"Error saving user preferences: {e}")
            return False
    
    def load_user_preferences(self, user_id: str) -> Optional[UserPreferences]:
        """Load user preferences from disk"""
        try:
            user_file = self._get_user_file(user_id)
            if not os.path.exists(user_file):
                return None
            
            with open(user_file, 'r') as f:
                data = json.load(f)
            
            # Convert swipe_history back to SwipeAction objects
            if 'swipe_history' in data and data['swipe_history']:
                data['swipe_history'] = [
                    SwipeAction(**action) for action in data['swipe_history']
                ]
            
            return UserPreferences(**data)
        except Exception as e:
            print(f"Error loading user preferences: {e}")
            return None
    
    def add_swipe_action(self, user_id: str, product: Dict[str, Any], action: str) -> bool:
        """Add a swipe action to user's history"""
        try:
            preferences = self.load_user_preferences(user_id)
            if preferences is None:
                preferences = UserPreferences(user_id=user_id)
            
            swipe = SwipeAction(
                product_id=product.get('id', product.get('link', '')),
                product_title=product.get('title', ''),
                product_brand=product.get('brand', ''),
                product_image=product.get('thumbnail', ''),
                product_price=product.get('price'),
                product_link=product.get('link', ''),
                action=action,
                timestamp=datetime.now().isoformat(),
                product_features={
                    'category': product.get('category', ''),
                    'color': product.get('color', ''),
                    'style': product.get('style', ''),
                    'tags': product.get('tags', [])
                }
            )
            
            preferences.swipe_history.append(swipe)
            return self.save_user_preferences(preferences)
        except Exception as e:
            print(f"Error adding swipe action: {e}")
            return False
    
    def get_liked_products(self, user_id: str) -> List[SwipeAction]:
        """Get all liked products for a user"""
        preferences = self.load_user_preferences(user_id)
        if preferences is None:
            return []
        return [s for s in preferences.swipe_history if s.action == 'like']
    
    def get_disliked_products(self, user_id: str) -> List[SwipeAction]:
        """Get all disliked products for a user"""
        preferences = self.load_user_preferences(user_id)
        if preferences is None:
            return []
        return [s for s in preferences.swipe_history if s.action == 'dislike']
    
    def analyze_preferences(self, user_id: str) -> Dict[str, Any]:
        """Analyze user's swipe history to extract preferences"""
        preferences = self.load_user_preferences(user_id)
        if preferences is None or not preferences.swipe_history:
            return {
                'favorite_brands': [],
                'favorite_colors': [],
                'favorite_styles': [],
                'favorite_categories': [],
                'total_likes': 0,
                'total_dislikes': 0
            }
        
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
            
            features = swipe.product_features
            if features.get('color'):
                color_counts[features['color']] += 1
            if features.get('style'):
                style_counts[features['style']] += 1
            if features.get('category'):
                category_counts[features['category']] += 1
        
        # Sort by frequency
        favorite_brands = sorted(brand_counts.items(), key=lambda x: x[1], reverse=True)
        favorite_colors = sorted(color_counts.items(), key=lambda x: x[1], reverse=True)
        favorite_styles = sorted(style_counts.items(), key=lambda x: x[1], reverse=True)
        favorite_categories = sorted(category_counts.items(), key=lambda x: x[1], reverse=True)
        
        return {
            'favorite_brands': [b[0] for b in favorite_brands[:5]],
            'favorite_colors': [c[0] for c in favorite_colors[:5]],
            'favorite_styles': [s[0] for s in favorite_styles[:5]],
            'favorite_categories': [c[0] for c in favorite_categories[:5]],
            'total_likes': len(liked),
            'total_dislikes': len(disliked),
            'like_rate': len(liked) / len(preferences.swipe_history) if preferences.swipe_history else 0
        }
    
    def update_user_info(self, user_id: str, updates: Dict[str, Any]) -> bool:
        """Update user information (color analysis, sizes, etc.)"""
        try:
            preferences = self.load_user_preferences(user_id)
            if preferences is None:
                preferences = UserPreferences(user_id=user_id)
            
            # Update fields
            if 'color_analysis' in updates:
                preferences.color_analysis = updates['color_analysis']
            if 'gender' in updates:
                preferences.gender = updates['gender']
            if 'body_type' in updates:
                preferences.body_type = updates['body_type']
            if 'clothing_sizes' in updates:
                preferences.clothing_sizes = updates['clothing_sizes']
            if 'style_preferences' in updates:
                preferences.style_preferences = updates['style_preferences']
            if 'favorite_brands' in updates:
                preferences.favorite_brands = updates['favorite_brands']
            if 'budget_range' in updates:
                preferences.budget_range = updates['budget_range']
            
            return self.save_user_preferences(preferences)
        except Exception as e:
            print(f"Error updating user info: {e}")
            return False
    
    def get_personalized_recommendations(self, user_id: str, available_products: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Generate personalized product recommendations based on:
        1. Color analysis results
        2. User preferences from swipes
        3. User info (gender, body type, sizes)
        4. Filter by gender (only show user's gender products)
        """
        preferences = self.load_user_preferences(user_id)
        if preferences is None:
            return available_products  # Return unfiltered if no preferences
        
        # FIRST: Filter by gender if user has set gender
        filtered_products = available_products
        if preferences.gender:
            filtered_products = self._filter_by_gender(available_products, preferences.gender)
        
        # Analyze swipe history
        analysis = self.analyze_preferences(user_id)
        
        # Score each product
        scored_products = []
        for product in filtered_products:
            score = 0
            
            # Brand preference
            if product.get('brand') in analysis['favorite_brands']:
                score += 10
            
            # Color matching with color analysis
            if preferences.color_analysis and 'complementaryColors' in preferences.color_analysis:
                comp_colors = preferences.color_analysis['complementaryColors']
                product_color = product.get('color', '').lower()
                for comp in comp_colors:
                    if comp.get('name', '').lower() in product_color:
                        score += 15
                        break
            
            # Style preference
            product_style = product.get('style', '').lower()
            for fav_style in analysis['favorite_styles']:
                if fav_style.lower() in product_style:
                    score += 8
                    break
            
            # Category preference
            product_category = product.get('category', '').lower()
            for fav_category in analysis['favorite_categories']:
                if fav_category.lower() in product_category:
                    score += 5
                    break
            
            # Gender match (already filtered, but boost score)
            if preferences.gender:
                product_title = (product.get('title') or '').lower()
                user_gender_lower = preferences.gender.lower()
                if user_gender_lower in product_title or 'unisex' in product_title:
                    score += 5
            
            scored_products.append({
                **product,
                'recommendation_score': score
            })
        
        # Sort by score (highest first)
        scored_products.sort(key=lambda x: x['recommendation_score'], reverse=True)
        
        return scored_products
    
    def _filter_by_gender(self, products: List[Dict[str, Any]], user_gender: str) -> List[Dict[str, Any]]:
        """Filter products to match user's gender"""
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
        
        keywords = gender_keywords.get(user_gender_lower, [user_gender_lower])
        
        for product in products:
            title = (product.get('title') or '').lower()
            is_match = False
            
            # Unisex always included
            if 'unisex' in title:
                is_match = True
            else:
                # Check for user's gender keywords
                for keyword in keywords:
                    if keyword in title:
                        is_match = True
                        break
                
                # Exclude opposite gender
                if is_match:
                    opposite_keywords = []
                    if 'male' in user_gender_lower or 'men' in user_gender_lower:
                        opposite_keywords = ['women', 'female', 'woman', 'girls', 'girl', 'ladies', 'lady']
                    elif 'female' in user_gender_lower or 'women' in user_gender_lower:
                        opposite_keywords = ['men', 'male', 'man', 'boys', 'boy']
                    
                    for opp_keyword in opposite_keywords:
                        if opp_keyword in title:
                            is_match = False
                            break
            
            if is_match:
                filtered.append(product)
        
        # Return filtered, or original if no matches (to avoid empty results)
        return filtered if filtered else products
