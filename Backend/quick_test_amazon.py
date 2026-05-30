"""
Quick test of Real-Time Amazon API with your RapidAPI key
"""
import os
from dotenv import load_dotenv

# Load .env file
load_dotenv()

# Test the API key is loaded
api_key = os.getenv('RAPIDAPI_KEY')
print(f"API Key loaded: {api_key[:20]}..." if api_key else "❌ API Key not found!")

# Test Real-Time Amazon API
from api_integrations_india import RealTimeAmazonAPI

print("\n" + "="*60)
print("Testing Real-Time Amazon Data API")
print("="*60)

try:
    amazon_api = RealTimeAmazonAPI()
    print(f"✓ API initialized with key: {amazon_api.api_key[:20]}...")
    
    print("\nSearching for 'kurta for women' on Amazon India...")
    results = amazon_api.search_products(query="kurta for women", limit=5, country='IN')
    
    if not results.empty:
        print(f"\n✅ SUCCESS! Found {len(results)} products")
        print("\nSample products:")
        print(results[['Title', 'Price', 'Source']].to_string(index=False))
    else:
        print("\n⚠️ No results found")
        
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
