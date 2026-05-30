"""
Real-time API integrations for fashion product data
Much faster and more reliable than web scraping
"""

import requests
import os
from typing import List, Dict, Any, Optional
import pandas as pd
from datetime import datetime, timedelta

# ============================================================================
# SHOPSTYLE API INTEGRATION (RECOMMENDED - FREE TIER AVAILABLE)
# ============================================================================

class ShopStyleAPI:
    """
    ShopStyle Collective API Integration
    - FREE tier: 5,000 requests/month
    - Covers 1,400+ retailers including Zara, H&M, ASOS, Nordstrom
    - Sign up at: https://www.shopstylecollective.com/api/
    """
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv('SHOPSTYLE_API_KEY')
        self.base_url = 'https://api.shopstyle.com/api/v2'
        
    def search_products(
        self, 
        query: str,
        brands: Optional[List[str]] = None,
        colors: Optional[List[str]] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        limit: int = 50,
        offset: int = 0
    ) -> pd.DataFrame:
        """
        Search for fashion products using ShopStyle API
        
        Args:
            query: Search term (e.g., "black dress", "casual wear")
            brands: List of brand names to filter
            colors: List of colors to filter
            min_price: Minimum price filter
            max_price: Maximum price filter
            limit: Number of results (max 50 per request)
            offset: Pagination offset
            
        Returns:
            DataFrame with product information
        """
        if not self.api_key:
            raise ValueError("ShopStyle API key not found. Set SHOPSTYLE_API_KEY environment variable.")
        
        # Build filter string
        filters = []
        if brands:
            brand_filter = ','.join(brands)
            filters.append(f'Brand[{brand_filter}]')
        if colors:
            color_filter = ','.join(colors)
            filters.append(f'Color[{color_filter}]')
        if min_price:
            filters.append(f'MinPrice[{min_price}]')
        if max_price:
            filters.append(f'MaxPrice[{max_price}]')
        
        # Build API request
        params = {
            'pid': self.api_key,
            'fts': query,
            'offset': offset,
            'limit': limit
        }
        
        if filters:
            params['filters'] = '|'.join(filters)
        
        try:
            response = requests.get(f'{self.base_url}/products', params=params, timeout=5)
            response.raise_for_status()
            data = response.json()
            
            # Parse response into DataFrame
            products = []
            for item in data.get('products', []):
                products.append({
                    'Title': item.get('name', ''),
                    'Price': f"${item.get('price', 0):.2f}",
                    'Image': item.get('image', {}).get('sizes', {}).get('Large', {}).get('url', ''),
                    'Link': item.get('clickUrl', ''),
                    'Source': item.get('brand', {}).get('name', ''),
                    'Category': item.get('categories', [{}])[0].get('name', '') if item.get('categories') else '',
                    'Color': ', '.join([c.get('name', '') for c in item.get('colors', [])]),
                })
            
            return pd.DataFrame(products)
            
        except requests.exceptions.RequestException as e:
            print(f"ShopStyle API error: {e}")
            return pd.DataFrame()


# ============================================================================
# RAPID API INTEGRATION (ASOS, H&M, etc.)
# ============================================================================

class RapidAPIFashion:
    """
    RapidAPI Fashion APIs
    - ASOS API, H&M API, Fashion API
    - Sign up at: https://rapidapi.com/
    - FREE tier: 500-1000 requests/month per API
    """
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv('RAPIDAPI_KEY')
        self.base_url = 'https://asos2.p.rapidapi.com'
        
    def search_asos(self, query: str, limit: int = 50) -> pd.DataFrame:
        """Search ASOS products via RapidAPI"""
        if not self.api_key:
            raise ValueError("RapidAPI key not found. Set RAPIDAPI_KEY environment variable.")
        
        headers = {
            "X-RapidAPI-Key": self.api_key,
            "X-RapidAPI-Host": "asos2.p.rapidapi.com"
        }
        
        params = {
            "q": query,
            "limit": limit,
            "country": "US",
            "currency": "USD"
        }
        
        try:
            response = requests.get(
                f'{self.base_url}/products/v2/list',
                headers=headers,
                params=params,
                timeout=5
            )
            response.raise_for_status()
            data = response.json()
            
            products = []
            for item in data.get('products', []):
                products.append({
                    'Title': item.get('name', ''),
                    'Price': f"${item.get('price', {}).get('current', {}).get('value', 0)}",
                    'Image': f"https://{item.get('imageUrl', '')}",
                    'Link': f"https://www.asos.com/prd/{item.get('id', '')}",
                    'Source': 'ASOS',
                    'Color': item.get('colour', ''),
                })
            
            return pd.DataFrame(products)
            
        except requests.exceptions.RequestException as e:
            print(f"ASOS API error: {e}")
            return pd.DataFrame()


# ============================================================================
# AMAZON PRODUCT ADVERTISING API
# ============================================================================

class AmazonProductAPI:
    """
    Amazon Product Advertising API (PA-API)
    - FREE (requires Amazon Associate account)
    - Official Amazon product data
    - Sign up at: https://affiliate-program.amazon.com/
    """
    
    def __init__(
        self, 
        access_key: Optional[str] = None,
        secret_key: Optional[str] = None,
        partner_tag: Optional[str] = None
    ):
        self.access_key = access_key or os.getenv('AMAZON_ACCESS_KEY')
        self.secret_key = secret_key or os.getenv('AMAZON_SECRET_KEY')
        self.partner_tag = partner_tag or os.getenv('AMAZON_PARTNER_TAG')
        
    def search_products(self, keywords: str, limit: int = 10) -> pd.DataFrame:
        """
        Search Amazon products using PA-API
        Note: Requires amazon-paapi library
        Install: pip install amazon-paapi
        """
        try:
            from amazon.paapi import AmazonAPI
            
            if not all([self.access_key, self.secret_key, self.partner_tag]):
                raise ValueError("Amazon API credentials not found")
            
            amazon = AmazonAPI(
                self.access_key,
                self.secret_key,
                self.partner_tag,
                country='IN'  # Change to your country
            )
            
            search_result = amazon.search_items(keywords=keywords, item_count=limit)
            
            products = []
            for item in search_result.items:
                products.append({
                    'Title': item.item_info.title.display_value,
                    'Price': f"₹{item.offers.listings[0].price.amount}" if item.offers else 'N/A',
                    'Image': item.images.primary.large.url if item.images else '',
                    'Link': item.detail_page_url,
                    'Source': 'Amazon',
                    'Brand': item.item_info.by_line_info.brand.display_value if item.item_info.by_line_info else '',
                })
            
            return pd.DataFrame(products)
            
        except ImportError:
            print("Install amazon-paapi: pip install amazon-paapi")
            return pd.DataFrame()
        except Exception as e:
            print(f"Amazon API error: {e}")
            return pd.DataFrame()


# ============================================================================
# UNIFIED API AGGREGATOR
# ============================================================================

class FashionAPIAggregator:
    """
    Combines multiple APIs for comprehensive product coverage
    Falls back to web scraping if APIs are not available
    """
    
    def __init__(self):
        # Initialize all APIs
        self.shopstyle = None
        self.rapidapi = None
        self.amazon = None
        
        # Try to initialize ShopStyle (primary)
        try:
            self.shopstyle = ShopStyleAPI()
        except:
            pass
        
        # Try to initialize RapidAPI
        try:
            self.rapidapi = RapidAPIFashion()
        except:
            pass
        
        # Try to initialize Amazon
        try:
            self.amazon = AmazonProductAPI()
        except:
            pass
    
    def search(
        self,
        query: str,
        brands: Optional[List[str]] = None,
        limit: int = 50
    ) -> pd.DataFrame:
        """
        Search across all available APIs
        Combines results from multiple sources
        """
        all_products = []
        
        # Try ShopStyle first (best coverage)
        if self.shopstyle:
            try:
                df = self.shopstyle.search_products(query, brands=brands, limit=limit)
                if not df.empty:
                    all_products.append(df)
                    print(f"✓ ShopStyle: {len(df)} products")
            except Exception as e:
                print(f"ShopStyle failed: {e}")
        
        # Try Amazon if fewer results
        if self.amazon and len(all_products) < limit:
            try:
                df = self.amazon.search_products(query, limit=20)
                if not df.empty:
                    all_products.append(df)
                    print(f"✓ Amazon: {len(df)} products")
            except Exception as e:
                print(f"Amazon failed: {e}")
        
        # Try ASOS via RapidAPI
        if self.rapidapi and len(all_products) < limit:
            try:
                df = self.rapidapi.search_asos(query, limit=30)
                if not df.empty:
                    all_products.append(df)
                    print(f"✓ ASOS: {len(df)} products")
            except Exception as e:
                print(f"ASOS failed: {e}")
        
        # Combine all results
        if all_products:
            combined = pd.concat(all_products, ignore_index=True)
            # Remove duplicates based on title
            combined = combined.drop_duplicates(subset=['Title'], keep='first')
            return combined.head(limit)
        
        return pd.DataFrame()


# ============================================================================
# USAGE EXAMPLE
# ============================================================================

if __name__ == '__main__':
    # Example: Using the aggregator
    aggregator = FashionAPIAggregator()
    
    # Search for products
    results = aggregator.search(
        query="black dress",
        brands=["Zara", "H&M"],
        limit=50
    )
    
    print(f"\nFound {len(results)} products")
    print(results.head())
