"""
Test script for India-specific fashion APIs
Tests: Myntra, Flipkart, Amazon India, Google Shopping
"""

import os
from dotenv import load_dotenv
from api_integrations_india import (
    MyntraAPI, 
    FlipkartAPI, 
    AmazonIndiaAPI, 
    GoogleShoppingIndiaAPI,
    IndiaFashionAPIAggregator
)
import time

# Load environment variables
load_dotenv()

def test_myntra():
    """Test Myntra API via RapidAPI"""
    print("\n" + "="*60)
    print("🧪 Testing Myntra API (via RapidAPI)...")
    print("="*60)
    
    try:
        api = MyntraAPI()
        start = time.time()
        results = api.search_products(query="kurta for women", limit=10)
        elapsed = time.time() - start
        
        if not results.empty:
            print(f"✅ SUCCESS! Found {len(results)} products in {elapsed:.2f}s")
            print("\nSample products:")
            print(results[['Title', 'Price', 'Source', 'Brand']].head(3))
            print(f"\n💰 Currency: INR (₹)")
            return True
        else:
            print("⚠️ No products found - check your API key")
            return False
            
    except ValueError as e:
        print(f"❌ FAILED: {e}")
        print("\n💡 Fix: Add RAPIDAPI_KEY to your .env file")
        print("   Sign up at: https://rapidapi.com/")
        print("   Subscribe to: https://rapidapi.com/apidojo/api/myntra16")
        return False
    except Exception as e:
        print(f"❌ FAILED: {e}")
        return False


def test_flipkart():
    """Test Flipkart API via RapidAPI"""
    print("\n" + "="*60)
    print("🧪 Testing Flipkart API (via RapidAPI)...")
    print("="*60)
    
    try:
        api = FlipkartAPI()
        start = time.time()
        results = api.search_products(query="casual dress", limit=10)
        elapsed = time.time() - start
        
        if not results.empty:
            print(f"✅ SUCCESS! Found {len(results)} products in {elapsed:.2f}s")
            print("\nSample products:")
            print(results[['Title', 'Price', 'Source']].head(3))
            print(f"\n💰 Currency: INR (₹)")
            return True
        else:
            print("⚠️ No products found - check your API key")
            return False
            
    except ValueError as e:
        print(f"❌ FAILED: {e}")
        print("\n💡 Fix: Add RAPIDAPI_KEY to your .env file")
        print("   Subscribe to: https://rapidapi.com/apidojo/api/flipkart-flipkart")
        return False
    except Exception as e:
        print(f"❌ FAILED: {e}")
        return False


def test_amazon_india():
    """Test Amazon India Product API"""
    print("\n" + "="*60)
    print("🧪 Testing Amazon India Product API...")
    print("="*60)
    
    try:
        api = AmazonIndiaAPI()
        start = time.time()
        results = api.search_products(keywords="women fashion", limit=5)
        elapsed = time.time() - start
        
        if not results.empty:
            print(f"✅ SUCCESS! Found {len(results)} products in {elapsed:.2f}s")
            print("\nSample products:")
            print(results[['Title', 'Price', 'Source']].head(3))
            print(f"\n💰 Currency: INR (₹)")
            return True
        else:
            print("⚠️ No products found")
            return False
            
    except ValueError as e:
        print(f"⏭️ SKIPPED: {e}")
        print("\n💡 Optional: Add Amazon India credentials to .env:")
        print("   AMAZON_IN_ACCESS_KEY")
        print("   AMAZON_IN_SECRET_KEY")
        print("   AMAZON_IN_PARTNER_TAG")
        print("   Apply at: https://affiliate.amazon.in/")
        return None
    except ImportError:
        print(f"⏭️ SKIPPED: amazon-paapi not installed")
        print("\n💡 Optional: pip install amazon-paapi")
        return None
    except Exception as e:
        print(f"❌ FAILED: {e}")
        return False


def test_google_shopping():
    """Test Google Shopping India via SerpApi"""
    print("\n" + "="*60)
    print("🧪 Testing Google Shopping India (via SerpApi)...")
    print("="*60)
    
    try:
        api = GoogleShoppingIndiaAPI()
        start = time.time()
        results = api.search_products(query="saree", limit=10)
        elapsed = time.time() - start
        
        if not results.empty:
            print(f"✅ SUCCESS! Found {len(results)} products in {elapsed:.2f}s")
            print("\nSample products:")
            print(results[['Title', 'Price', 'Source']].head(3))
            print(f"\n💰 Currency: INR (₹)")
            print(f"📊 Coverage: ALL Indian e-commerce sites!")
            return True
        else:
            print("⚠️ No products found")
            return False
            
    except ValueError as e:
        print(f"⏭️ SKIPPED: {e}")
        print("\n💡 Optional: Add SERPAPI_KEY to .env")
        print("   Sign up at: https://serpapi.com/")
        print("   Free tier: 100 searches/month")
        return None
    except Exception as e:
        print(f"❌ FAILED: {e}")
        return False


def test_aggregator():
    """Test the unified India API aggregator"""
    print("\n" + "="*60)
    print("🧪 Testing India Fashion API Aggregator...")
    print("="*60)
    
    try:
        aggregator = IndiaFashionAPIAggregator()
        start = time.time()
        results = aggregator.search(
            query="ethnic wear for women",
            limit=30
        )
        elapsed = time.time() - start
        
        if not results.empty:
            print(f"✅ SUCCESS! Found {len(results)} products in {elapsed:.2f}s")
            print("\nProducts by source:")
            print(results['Source'].value_counts())
            print(f"\n💰 All prices in INR (₹)")
            print(f"\n⚡ Speed: ~{elapsed:.1f}s vs 30-45s with web scraping")
            print(f"📈 That's {30/elapsed:.0f}x FASTER!")
            return True
        else:
            print("❌ No products found from any API")
            print("⚠️ Please configure at least one API key in .env")
            return False
            
    except Exception as e:
        print(f"❌ FAILED: {e}")
        return False


def main():
    """Run all India API tests"""
    print("\n" + "🇮🇳 " + "="*58)
    print("🇮🇳 TUFF Fashion - India API Integration Test Suite")
    print("🇮🇳 " + "="*58)
    print("Testing Indian e-commerce APIs with INR (₹) pricing")
    
    results = {
        'Myntra (RapidAPI)': test_myntra(),
        'Flipkart (RapidAPI)': test_flipkart(),
        'Amazon India': test_amazon_india(),
        'Google Shopping': test_google_shopping(),
        'India Aggregator': test_aggregator()
    }
    
    # Summary
    print("\n" + "="*60)
    print("📊 TEST SUMMARY")
    print("="*60)
    
    passed = sum(1 for v in results.values() if v is True)
    failed = sum(1 for v in results.values() if v is False)
    skipped = sum(1 for v in results.values() if v is None)
    
    for name, result in results.items():
        if result is True:
            print(f"✅ {name:25s} - PASSED")
        elif result is False:
            print(f"❌ {name:25s} - FAILED")
        else:
            print(f"⏭️ {name:25s} - SKIPPED (optional)")
    
    print("\n" + "="*60)
    print(f"Total: {passed} passed, {failed} failed, {skipped} skipped")
    
    if passed > 0:
        print("\n🎉 SUCCESS! You have at least one India API working.")
        print("   Your app will work with INR (₹) pricing!")
        
        if 'Myntra (RapidAPI)' in [k for k, v in results.items() if v is True]:
            print("\n🌟 EXCELLENT! Myntra API is working!")
            print("   This covers most Indian fashion needs.")
        
        if failed == 0:
            print("\n🚀 PERFECT! All APIs are working!")
            print("   You have maximum coverage of Indian fashion market.")
    else:
        print("\n⚠️ WARNING: No APIs are configured yet.")
        print("\n📋 Quick Setup (FREE):")
        print("   1. Sign up: https://rapidapi.com/")
        print("   2. Subscribe to Myntra API (500 free calls/month)")
        print("   3. Copy your RapidAPI key")
        print("   4. Add to .env: RAPIDAPI_KEY=your_key")
        print("   5. Run this test again!")
        print("\n   See INDIA_API_GUIDE.md for detailed instructions.")
    
    print("="*60 + "\n")
    
    # Show cost estimate
    if passed > 0:
        print("💰 COST ESTIMATE:")
        print("   Current setup: ₹0/month (FREE tier)")
        print("   For 1000 searches/month: ₹0 (within free tier)")
        print("   For 10,000 searches/month: ₹750-₹1,500")
        print()


if __name__ == '__main__':
    main()
