"""
Quick test script to verify API integrations are working
Run this before deploying to production
"""

import os
from dotenv import load_dotenv
from api_integrations import ShopStyleAPI, RapidAPIFashion, AmazonProductAPI, FashionAPIAggregator
import time

# Load environment variables
load_dotenv()

def test_shopstyle():
    """Test ShopStyle API"""
    print("\n" + "="*60)
    print("🧪 Testing ShopStyle API...")
    print("="*60)
    
    try:
        api = ShopStyleAPI()
        start = time.time()
        results = api.search_products(
            query="casual dress",
            brands=["Zara", "H&M"],
            limit=10
        )
        elapsed = time.time() - start
        
        if not results.empty:
            print(f"✅ SUCCESS! Found {len(results)} products in {elapsed:.2f}s")
            print("\nSample products:")
            print(results[['Title', 'Price', 'Source']].head(3))
            return True
        else:
            print("⚠️ No products found - check your API key")
            return False
            
    except ValueError as e:
        print(f"❌ FAILED: {e}")
        print("\n💡 Fix: Add SHOPSTYLE_API_KEY to your .env file")
        print("   Get it at: https://www.shopstylecollective.com/api/")
        return False
    except Exception as e:
        print(f"❌ FAILED: {e}")
        return False


def test_rapidapi():
    """Test RapidAPI (ASOS)"""
    print("\n" + "="*60)
    print("🧪 Testing RapidAPI (ASOS)...")
    print("="*60)
    
    try:
        api = RapidAPIFashion()
        start = time.time()
        results = api.search_asos(query="black dress", limit=10)
        elapsed = time.time() - start
        
        if not results.empty:
            print(f"✅ SUCCESS! Found {len(results)} products in {elapsed:.2f}s")
            print("\nSample products:")
            print(results[['Title', 'Price', 'Source']].head(3))
            return True
        else:
            print("⚠️ No products found - check your API key")
            return False
            
    except ValueError as e:
        print(f"⏭️ SKIPPED: {e}")
        print("\n💡 Optional: Add RAPIDAPI_KEY to your .env file")
        print("   Get it at: https://rapidapi.com/")
        return None  # Optional API
    except Exception as e:
        print(f"❌ FAILED: {e}")
        return False


def test_amazon():
    """Test Amazon Product API"""
    print("\n" + "="*60)
    print("🧪 Testing Amazon Product API...")
    print("="*60)
    
    try:
        api = AmazonProductAPI()
        start = time.time()
        results = api.search_products(keywords="fashion dress", limit=5)
        elapsed = time.time() - start
        
        if not results.empty:
            print(f"✅ SUCCESS! Found {len(results)} products in {elapsed:.2f}s")
            print("\nSample products:")
            print(results[['Title', 'Price', 'Source']].head(3))
            return True
        else:
            print("⚠️ No products found - check your API credentials")
            return False
            
    except ValueError as e:
        print(f"⏭️ SKIPPED: {e}")
        print("\n💡 Optional: Add Amazon credentials to your .env file")
        print("   Apply at: https://affiliate-program.amazon.com/")
        return None  # Optional API
    except ImportError:
        print(f"⏭️ SKIPPED: amazon-paapi not installed")
        print("\n💡 Optional: pip install amazon-paapi")
        return None
    except Exception as e:
        print(f"❌ FAILED: {e}")
        return False


def test_aggregator():
    """Test the unified aggregator"""
    print("\n" + "="*60)
    print("🧪 Testing Fashion API Aggregator...")
    print("="*60)
    
    try:
        aggregator = FashionAPIAggregator()
        start = time.time()
        results = aggregator.search(
            query="casual wear",
            brands=["Zara", "H&M", "ASOS"],
            limit=30
        )
        elapsed = time.time() - start
        
        if not results.empty:
            print(f"✅ SUCCESS! Found {len(results)} products in {elapsed:.2f}s")
            print("\nProducts by source:")
            print(results['Source'].value_counts())
            return True
        else:
            print("❌ No products found from any API")
            return False
            
    except Exception as e:
        print(f"❌ FAILED: {e}")
        return False


def main():
    """Run all tests"""
    print("\n" + "🚀 " + "="*58)
    print("🚀 TUFF Fashion - API Integration Test Suite")
    print("🚀 " + "="*58)
    
    results = {
        'ShopStyle': test_shopstyle(),
        'RapidAPI': test_rapidapi(),
        'Amazon': test_amazon(),
        'Aggregator': test_aggregator()
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
            print(f"✅ {name:15s} - PASSED")
        elif result is False:
            print(f"❌ {name:15s} - FAILED")
        else:
            print(f"⏭️ {name:15s} - SKIPPED (optional)")
    
    print("\n" + "="*60)
    print(f"Total: {passed} passed, {failed} failed, {skipped} skipped")
    
    if passed > 0:
        print("\n🎉 SUCCESS! You have at least one API working.")
        print("   You can now use the API aggregator in your app!")
        if failed == 0:
            print("   All APIs are working perfectly! 🚀")
    else:
        print("\n⚠️ WARNING: No APIs are configured.")
        print("   Please add API keys to your .env file.")
        print("   See API_MIGRATION_GUIDE.md for instructions.")
    
    print("="*60 + "\n")


if __name__ == '__main__':
    main()
