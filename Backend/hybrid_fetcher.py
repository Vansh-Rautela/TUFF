"""
Hybrid API + Web Scraping System
Strategy: Try APIs first (fast), fall back to web scraping if API limit hit
"""

import pandas as pd
from typing import List, Dict, Any, Optional
import sys
import os

# Add web scraping modules to path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
WEB_SCRAPE_DIR = os.path.join(CURRENT_DIR, 'Webscraping')
if WEB_SCRAPE_DIR not in sys.path:
    sys.path.append(WEB_SCRAPE_DIR)

# Import API integrations
from api_integrations_india import IndiaFashionAPIAggregator

# Import web scrapers (fallback)
try:
    import scrapers as scrapers_mod
except:
    scrapers_mod = None


class HybridProductFetcher:
    """
    Intelligent product fetcher that:
    1. Tries APIs first (1-3 seconds, reliable)
    2. Falls back to web scraping if API fails or hits rate limit
    3. Caches results to minimize API calls
    """
    
    def __init__(self):
        # Initialize API aggregator
        try:
            self.api_aggregator = IndiaFashionAPIAggregator()
            self.api_available = True
            print("✓ API Aggregator initialized (Fast mode enabled)")
        except Exception as e:
            self.api_available = False
            print(f"⚠️ API not available, will use web scraping: {e}")
        
        # Web scraping fallback map
        self.scraper_map = self._build_scraper_map()
        
        # Track API usage for rate limiting
        self.api_call_count = 0
        self.api_limit_hit = False
    
    def _build_scraper_map(self) -> Dict[str, Any]:
        """Build map of brand names to scraper functions"""
        mapping = {}
        
        if scrapers_mod:
            mapping.update({
                'Amazon': getattr(scrapers_mod, 'scrape_amazon', None),
                'Flipkart': getattr(scrapers_mod, 'scrape_flipkart', None),
                'Myntra': getattr(scrapers_mod, 'scrape_myntra', None),
                'Nykaa': getattr(scrapers_mod, 'scrape_nykaa', None),
                'Zara': getattr(scrapers_mod, 'scrape_zara', None),
                'H&M': getattr(scrapers_mod, 'scrape_hnm', None),
                'Levis': getattr(scrapers_mod, 'scrape_levis', None),
                'Lifestyle': getattr(scrapers_mod, 'scrape_lifestyle', None),
                'Ajio': getattr(scrapers_mod, 'scrape_ajio', None),
                'Bewakoof': getattr(scrapers_mod, 'scrape_bewakoof', None),
            })
        
        # Site-specific modules
        try:
            from savana import scrape_westside, scrape_urbanic
            mapping['Westside'] = scrape_westside
            mapping['Urbanic'] = scrape_urbanic
        except:
            pass
        
        try:
            from libass import scrape_libas
            mapping['Libas'] = scrape_libas
        except:
            pass
        
        try:
            from montecarlo import scrape_monte_carlo
            mapping['Monte Carlo'] = scrape_monte_carlo
        except:
            pass
        
        try:
            from souledstore import scrape_souled_store
            mapping['Souled Store'] = scrape_souled_store
        except:
            pass
        
        # Filter out None values
        return {k: v for k, v in mapping.items() if v is not None}
    
    def search_products(
        self,
        query: str,
        brands: Optional[List[str]] = None,
        limit: int = 50,
        force_scraping: bool = False
    ) -> pd.DataFrame:
        """
        Search for products using hybrid approach
        
        Args:
            query: Search query
            brands: Optional list of brands to search
            limit: Number of products to return
            force_scraping: Force use of web scraping (bypass API)
            
        Returns:
            DataFrame with products
        """
        
        # Strategy 1: Try APIs first (FAST - 1-3 seconds)
        if self.api_available and not force_scraping and not self.api_limit_hit:
            try:
                print(f"🚀 Trying APIs first (fast mode)...")
                df = self.api_aggregator.search(query, brands=brands, limit=limit)
                
                if not df.empty:
                    self.api_call_count += 1
                    print(f"✅ API Success! Got {len(df)} products in ~2 seconds")
                    return df
                else:
                    print("⚠️ API returned no results, falling back to web scraping...")
                    
            except Exception as e:
                error_msg = str(e).lower()
                
                # Check if it's a rate limit error
                if 'rate limit' in error_msg or 'quota' in error_msg or '429' in error_msg:
                    print(f"⚠️ API rate limit hit! Switching to web scraping mode.")
                    self.api_limit_hit = True
                else:
                    print(f"⚠️ API failed: {e}")
                    print("Falling back to web scraping...")
        
        # Strategy 2: Fall back to web scraping (SLOWER - 30-45 seconds)
        print(f"🔧 Using web scraping (slower but unlimited)...")
        return self._scrape_products(query, brands, limit)
    
    def _scrape_products(
        self,
        query: str,
        brands: Optional[List[str]],
        limit: int
    ) -> pd.DataFrame:
        """Web scraping fallback"""
        
        # Determine which brands to scrape
        if brands:
            scrapers_to_use = [(b, self.scraper_map.get(b)) for b in brands 
                              if self.scraper_map.get(b)]
        else:
            # Default: scrape major Indian platforms
            default_brands = ['Myntra', 'Flipkart', 'Amazon']
            scrapers_to_use = [(b, self.scraper_map.get(b)) for b in default_brands
                              if self.scraper_map.get(b)]
        
        if not scrapers_to_use:
            print("❌ No scrapers available")
            return pd.DataFrame()
        
        all_products = []
        for brand_name, scraper_func in scrapers_to_use:
            if scraper_func is None:
                continue
            
            try:
                print(f"  Scraping {brand_name}...")
                df = scraper_func(query)
                
                if isinstance(df, pd.DataFrame) and not df.empty:
                    # Ensure source brand tag
                    if 'Source' not in df.columns:
                        df['Source'] = brand_name
                    all_products.append(df)
                    print(f"  ✓ {brand_name}: {len(df)} products")
                    
            except Exception as e:
                print(f"  ✗ {brand_name} scraping failed: {e}")
                continue
        
        # Combine results
        if all_products:
            combined = pd.concat(all_products, ignore_index=True)
            return combined.head(limit)
        
        return pd.DataFrame()
    
    def reset_api_limit(self):
        """Reset API limit flag (call this daily or when you know limit reset)"""
        self.api_limit_hit = False
        self.api_call_count = 0
        print("✓ API limit flag reset")
    
    def get_status(self) -> Dict[str, Any]:
        """Get current status of the fetcher"""
        return {
            'api_available': self.api_available,
            'api_limit_hit': self.api_limit_hit,
            'api_calls_made': self.api_call_count,
            'scrapers_available': len(self.scraper_map),
            'scraper_brands': list(self.scraper_map.keys())
        }


# ============================================================================
# CONVENIENCE FUNCTION FOR MAIN.PY
# ============================================================================

# Global instance (singleton pattern)
_hybrid_fetcher = None

def get_hybrid_fetcher() -> HybridProductFetcher:
    """Get or create global hybrid fetcher instance"""
    global _hybrid_fetcher
    if _hybrid_fetcher is None:
        _hybrid_fetcher = HybridProductFetcher()
    return _hybrid_fetcher


# ============================================================================
# USAGE EXAMPLE
# ============================================================================

if __name__ == '__main__':
    # Test the hybrid system
    fetcher = HybridProductFetcher()
    
    print("\n" + "="*60)
    print("Testing Hybrid API + Web Scraping System")
    print("="*60)
    
    # Test search
    results = fetcher.search_products(
        query="kurta for women",
        limit=20
    )
    
    print(f"\n📊 Results: {len(results)} products")
    if not results.empty:
        print("\nSample products:")
        print(results[['Title', 'Price', 'Source']].head(5))
    
    # Show status
    print("\n📈 System Status:")
    status = fetcher.get_status()
    for key, value in status.items():
        print(f"  {key}: {value}")
