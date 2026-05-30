"""
India-Specific Fashion E-Commerce API Integrations
Supports: Myntra, Flipkart, Amazon India, Ajio, Nykaa Fashion
Currency: INR (₹)
"""

import requests
import os
from typing import List, Dict, Any, Optional
import pandas as pd
from datetime import datetime, timedelta


# ============================================================================
# RAPIDAPI - MYNTRA API (RECOMMENDED FOR INDIA) ⭐
# ============================================================================

class MyntraAPI:
    """
    Myntra Unofficial API via RapidAPI
    - FREE tier: 500 requests/month
    - Currency: INR (₹)
    - Best for: Indian fashion, trending styles
    - Sign up: https://rapidapi.com/
    - API: https://rapidapi.com/apidojo/api/myntra16
    """
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv('RAPIDAPI_KEY')
        self.base_url = 'https://myntra16.p.rapidapi.com'
        
    def search_products(
        self, 
        query: str,
        limit: int = 50
    ) -> pd.DataFrame:
        """Search Myntra products"""
        if not self.api_key:
            raise ValueError("RapidAPI key not found. Set RAPIDAPI_KEY environment variable.")
        
        headers = {
            "X-RapidAPI-Key": self.api_key,
            "X-RapidAPI-Host": "myntra16.p.rapidapi.com"
        }
        
        params = {
            "query": query,
            "page": 1,
            "rows": limit
        }
        
        try:
            response = requests.get(
                f'{self.base_url}/search',
                headers=headers,
                params=params,
                timeout=5
            )
            response.raise_for_status()
            data = response.json()
            
            products = []
            for item in data.get('products', []):
                products.append({
                    'Title': item.get('productName', ''),
                    'Price': f"₹{item.get('price', 0)}",
                    'Image': item.get('searchImage', ''),
                    'Link': f"https://www.myntra.com/{item.get('landingPageUrl', '')}",
                    'Source': 'Myntra',
                    'Brand': item.get('brand', ''),
                    'Color': ', '.join(item.get('colours', [])) if item.get('colours') else '',
                    'Discount': item.get('discountLabel', ''),
                })
            
            return pd.DataFrame(products)
            
        except requests.exceptions.RequestException as e:
            print(f"Myntra API error: {e}")
            return pd.DataFrame()


# ============================================================================
# RAPIDAPI - FLIPKART API
# ============================================================================

class FlipkartAPI:
    """
    Flipkart Unofficial API via RapidAPI
    - FREE tier: 500 requests/month
    - Currency: INR (₹)
    - API: https://rapidapi.com/apidojo/api/flipkart-flipkart
    """
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv('RAPIDAPI_KEY')
        self.base_url = 'https://flipkart-flipkart.p.rapidapi.com'
        
    def search_products(
        self, 
        query: str,
        limit: int = 50
    ) -> pd.DataFrame:
        """Search Flipkart products"""
        if not self.api_key:
            raise ValueError("RapidAPI key not found. Set RAPIDAPI_KEY environment variable.")
        
        headers = {
            "X-RapidAPI-Key": self.api_key,
            "X-RapidAPI-Host": "flipkart-flipkart.p.rapidapi.com"
        }
        
        params = {
            "query": query,
            "page": 1
        }
        
        try:
            response = requests.get(
                f'{self.base_url}/product/search',
                headers=headers,
                params=params,
                timeout=5
            )
            response.raise_for_status()
            data = response.json()
            
            products = []
            for item in data.get('products', [])[:limit]:
                products.append({
                    'Title': item.get('title', ''),
                    'Price': f"₹{item.get('current_price', 0)}",
                    'Image': item.get('thumbnail', ''),
                    'Link': item.get('link', ''),
                    'Source': 'Flipkart',
                    'Brand': item.get('brand', ''),
                    'Rating': item.get('rating', ''),
                })
            
            return pd.DataFrame(products)
            
        except requests.exceptions.RequestException as e:
            print(f"Flipkart API error: {e}")
            return pd.DataFrame()


# ============================================================================
# RAPIDAPI - REAL-TIME AMAZON DATA (RECOMMENDED!) ⭐
# ============================================================================

class RealTimeAmazonAPI:
    """
    Real-Time Amazon Data API via RapidAPI (BEST FOR INDIA!)
    - FREE tier: 100-500 requests/month (depending on plan)
    - Currency: INR (₹) for amazon.in
    - NO APPROVAL NEEDED (unlike official Amazon PA-API)
    - SAME API KEY as Myntra & Flipkart!
    - API: https://rapidapi.com/letscrape-6bRBa3QguO5/api/real-time-amazon-data
    
    Advantages over official Amazon PA-API:
    ✅ No Amazon Associate approval needed
    ✅ Setup in 5 minutes (vs 2-4 weeks)
    ✅ Same RapidAPI key for all platforms
    ✅ Excellent data quality
    """
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv('RAPIDAPI_KEY')
        self.base_url = 'https://real-time-amazon-data.p.rapidapi.com'
        
    def search_products(
        self, 
        query: str,
        limit: int = 20,
        country: str = 'IN'  # India by default
    ) -> pd.DataFrame:
        """
        Search Amazon products (amazon.in for India)
        
        Args:
            query: Search keywords
            limit: Number of results
            country: Country code (IN for India, US, UK, etc.)
        """
        if not self.api_key:
            raise ValueError("RapidAPI key not found. Set RAPIDAPI_KEY environment variable.")
        
        headers = {
            "X-RapidAPI-Key": self.api_key,
            "X-RapidAPI-Host": "real-time-amazon-data.p.rapidapi.com"
        }
        
        params = {
            "query": query,
            "page": "1",
            "country": country,
            "sort_by": "RELEVANCE",
            "product_condition": "ALL"
        }
        
        try:
            response = requests.get(
                f'{self.base_url}/search',
                headers=headers,
                params=params,
                timeout=10
            )
            response.raise_for_status()
            data = response.json()
            
            products = []
            for item in data.get('data', {}).get('products', [])[:limit]:
                # Format price in INR
                price_str = 'N/A'
                if item.get('product_price'):
                    price_str = item.get('product_price')
                elif item.get('product_original_price'):
                    price_str = item.get('product_original_price')
                
                products.append({
                    'Title': item.get('product_title', ''),
                    'Price': price_str,
                    'Image': item.get('product_photo', ''),
                    'Link': f"https://www.amazon.in/dp/{item.get('asin', '')}",
                    'Source': 'Amazon India',
                    'Brand': item.get('product_brand', ''),
                    'Rating': item.get('product_star_rating', ''),
                    'Reviews': item.get('product_num_ratings', ''),
                })
            
            return pd.DataFrame(products)
            
        except requests.exceptions.RequestException as e:
            print(f"Real-Time Amazon API error: {e}")
            return pd.DataFrame()
    
    def get_product_details(self, asin: str, country: str = 'IN') -> Dict[str, Any]:
        """
        Get detailed product information
        
        Args:
            asin: Amazon product ASIN
            country: Country code (IN for India)
        """
        if not self.api_key:
            raise ValueError("RapidAPI key not found")
        
        headers = {
            "X-RapidAPI-Key": self.api_key,
            "X-RapidAPI-Host": "real-time-amazon-data.p.rapidapi.com"
        }
        
        params = {
            "asin": asin,
            "country": country
        }
        
        try:
            response = requests.get(
                f'{self.base_url}/product-details',
                headers=headers,
                params=params,
                timeout=10
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Product details error: {e}")
            return {}


# ============================================================================
# LEGACY: AMAZON INDIA PRODUCT ADVERTISING API (OPTIONAL)
# ============================================================================

class AmazonIndiaAPI:
    """
    Amazon Product Advertising API - India (amazon.in)
    
    NOTE: Use RealTimeAmazonAPI instead! It's easier and doesn't require approval.
    
    This class is kept for backward compatibility if you already have PA-API credentials.
    - FREE (requires Amazon Associate India account)
    - Currency: INR (₹)
    - Apply at: https://affiliate.amazon.in/
    - Requires approval (2-4 weeks) and 3 sales within 180 days
    """
    
    def __init__(
        self, 
        access_key: Optional[str] = None,
        secret_key: Optional[str] = None,
        partner_tag: Optional[str] = None
    ):
        self.access_key = access_key or os.getenv('AMAZON_IN_ACCESS_KEY')
        self.secret_key = secret_key or os.getenv('AMAZON_IN_SECRET_KEY')
        self.partner_tag = partner_tag or os.getenv('AMAZON_IN_PARTNER_TAG')
        
    def search_products(self, keywords: str, limit: int = 10) -> pd.DataFrame:
        """
        Search Amazon India products
        Requires: pip install amazon-paapi
        """
        try:
            from amazon.paapi import AmazonAPI
            
            if not all([self.access_key, self.secret_key, self.partner_tag]):
                raise ValueError("Amazon India API credentials not found")
            
            # Use 'IN' for India
            amazon = AmazonAPI(
                self.access_key,
                self.secret_key,
                self.partner_tag,
                country='IN'  # ← India marketplace
            )
            
            search_result = amazon.search_items(keywords=keywords, item_count=limit)
            
            products = []
            for item in search_result.items:
                price_str = 'N/A'
                if item.offers and item.offers.listings:
                    price = item.offers.listings[0].price.amount
                    price_str = f"₹{price:,.0f}"
                
                products.append({
                    'Title': item.item_info.title.display_value,
                    'Price': price_str,
                    'Image': item.images.primary.large.url if item.images else '',
                    'Link': item.detail_page_url,
                    'Source': 'Amazon India',
                    'Brand': item.item_info.by_line_info.brand.display_value if item.item_info.by_line_info else '',
                })
            
            return pd.DataFrame(products)
            
        except ImportError:
            print("Install amazon-paapi: pip install amazon-paapi")
            return pd.DataFrame()
        except Exception as e:
            print(f"Amazon India API error: {e}")
            return pd.DataFrame()


# ============================================================================
# SERPAPI - GOOGLE SHOPPING (INDIA)
# ============================================================================

class GoogleShoppingIndiaAPI:
    """
    SerpApi - Google Shopping results for India
    - FREE tier: 100 searches/month
    - Currency: INR (₹)
    - Real-time Google Shopping data
    - Sign up: https://serpapi.com/
    """
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv('SERPAPI_KEY')
        self.base_url = 'https://serpapi.com/search'
        
    def search_products(
        self, 
        query: str,
        limit: int = 50
    ) -> pd.DataFrame:
        """Search Google Shopping for Indian products"""
        if not self.api_key:
            raise ValueError("SerpApi key not found. Set SERPAPI_KEY environment variable.")
        
        params = {
            "engine": "google_shopping",
            "q": query,
            "api_key": self.api_key,
            "gl": "in",  # ← India location
            "hl": "en",
            "num": limit
        }
        
        try:
            response = requests.get(self.base_url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            products = []
            for item in data.get('shopping_results', []):
                products.append({
                    'Title': item.get('title', ''),
                    'Price': item.get('price', 'N/A'),
                    'Image': item.get('thumbnail', ''),
                    'Link': item.get('link', ''),
                    'Source': item.get('source', 'Google Shopping'),
                    'Rating': item.get('rating', ''),
                })
            
            return pd.DataFrame(products)
            
        except requests.exceptions.RequestException as e:
            print(f"SerpApi error: {e}")
            return pd.DataFrame()


# ============================================================================
# APIFY - WEB SCRAPING AS A SERVICE (INDIA-SPECIFIC)
# ============================================================================

class ApifyIndiaScrapers:
    """
    Apify - Managed web scraping for Indian e-commerce
    - FREE tier: $5 credit/month (~500-1000 scrapes)
    - Scrapers available for: Myntra, Flipkart, Amazon India, Ajio
    - Sign up: https://apify.com/
    - More reliable than manual scraping
    """
    
    def __init__(self, api_token: Optional[str] = None):
        self.api_token = api_token or os.getenv('APIFY_TOKEN')
        self.base_url = 'https://api.apify.com/v2'
        
    def scrape_myntra(self, query: str, limit: int = 50) -> pd.DataFrame:
        """
        Use Apify's Myntra scraper
        Actor: https://apify.com/curious_coder/myntra-scraper
        """
        if not self.api_token:
            raise ValueError("Apify token not found. Set APIFY_TOKEN environment variable.")
        
        # This is a placeholder - actual implementation would use Apify's actor
        print("Apify Myntra scraper - see documentation for implementation")
        return pd.DataFrame()


# ============================================================================
# UNIFIED INDIA API AGGREGATOR
# ============================================================================

class IndiaFashionAPIAggregator:
    """
    Combines all India-specific fashion APIs
    Priority: Myntra → Flipkart → Amazon India → Google Shopping
    
    ALL USE SAME RAPIDAPI KEY! (except Google Shopping which is optional)
    """
    
    def __init__(self):
        # Initialize all India APIs
        self.myntra = None
        self.flipkart = None
        self.amazon = None  # Real-Time Amazon API
        self.google_shopping = None
        
        # Try to initialize each API
        try:
            self.myntra = MyntraAPI()
            print("✓ Myntra API initialized")
        except:
            pass
        
        try:
            self.flipkart = FlipkartAPI()
            print("✓ Flipkart API initialized")
        except:
            pass
        
        try:
            self.amazon = RealTimeAmazonAPI()  # ← Using new Real-Time Amazon API
            print("✓ Amazon India API initialized (Real-Time)")
        except:
            pass
        
        try:
            self.google_shopping = GoogleShoppingIndiaAPI()
            print("✓ Google Shopping India API initialized")
        except:
            pass
    
    def search(
        self,
        query: str,
        brands: Optional[List[str]] = None,
        limit: int = 50
    ) -> pd.DataFrame:
        """
        Search across all available India APIs
        Combines results from multiple sources
        
        ONE RapidAPI key gets you: Myntra + Flipkart + Amazon!
        """
        all_products = []
        
        # Priority 1: Myntra (best for Indian fashion)
        if self.myntra:
            try:
                df = self.myntra.search_products(query, limit=limit)
                if not df.empty:
                    all_products.append(df)
                    print(f"✓ Myntra: {len(df)} products")
            except Exception as e:
                print(f"Myntra failed: {e}")
        
        # Priority 2: Flipkart
        if self.flipkart and len(all_products) < limit:
            try:
                df = self.flipkart.search_products(query, limit=30)
                if not df.empty:
                    all_products.append(df)
                    print(f"✓ Flipkart: {len(df)} products")
            except Exception as e:
                print(f"Flipkart failed: {e}")
        
        # Priority 3: Amazon India (Real-Time API)
        if self.amazon and len(all_products) < limit:
            try:
                df = self.amazon.search_products(query, limit=20, country='IN')
                if not df.empty:
                    all_products.append(df)
                    print(f"✓ Amazon India: {len(df)} products")
            except Exception as e:
                print(f"Amazon India failed: {e}")
        
        # Priority 4: Google Shopping (covers ALL Indian brands)
        # This includes: Ajio, Nykaa Fashion, Meesho, Tata CLiQ, etc.
        if self.google_shopping and len(all_products) < limit:
            try:
                df = self.google_shopping.search_products(query, limit=30)
                if not df.empty:
                    all_products.append(df)
                    print(f"✓ Google Shopping: {len(df)} products (ALL Indian sites)")
            except Exception as e:
                print(f"Google Shopping failed: {e}")
        
        # Combine all results
        if all_products:
            combined = pd.concat(all_products, ignore_index=True)
            # Remove duplicates
            combined = combined.drop_duplicates(subset=['Title'], keep='first')
            return combined.head(limit)
        
        return pd.DataFrame()


# ============================================================================
# USAGE EXAMPLE
# ============================================================================

if __name__ == '__main__':
    # Example: Using the India aggregator
    aggregator = IndiaFashionAPIAggregator()
    
    # Search for products in INR
    results = aggregator.search(
        query="casual kurta for women",
        limit=50
    )
    
    print(f"\nFound {len(results)} products in INR")
    if not results.empty:
        print(results[['Title', 'Price', 'Source']].head(10))
