"""
Debug Real-Time Amazon API response
"""
import requests
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv('RAPIDAPI_KEY')

headers = {
    "X-RapidAPI-Key": api_key,
    "X-RapidAPI-Host": "real-time-amazon-data.p.rapidapi.com"
}

params = {
    "query": "women dress",
    "page": "1",
    "country": "IN",
    "sort_by": "RELEVANCE"
}

print("Testing Real-Time Amazon Data API...")
print(f"API Key: {api_key[:20]}...")
print(f"Query: {params['query']}")
print(f"Country: India (IN)")
print("\nSending request...")

try:
    response = requests.get(
        'https://real-time-amazon-data.p.rapidapi.com/search',
        headers=headers,
        params=params,
        timeout=15
    )
    
    print(f"\nStatus Code: {response.status_code}")
    print(f"Response:\n{response.text[:1000]}")  # First 1000 chars
    
    if response.status_code == 200:
        data = response.json()
        print(f"\nJSON Keys: {list(data.keys())}")
        
        if 'data' in data:
            print(f"Data Keys: {list(data['data'].keys())}")
            if 'products' in data['data']:
                products = data['data']['products']
                print(f"\n✅ Found {len(products)} products!")
                if products:
                    print(f"\nFirst product: {products[0].get('product_title', 'No title')}")
            else:
                print("\n⚠️ No 'products' key in data")
        else:
            print("\n⚠️ No 'data' key in response")
    else:
        print(f"\n❌ Error: {response.status_code}")
        
except Exception as e:
    print(f"\n❌ Exception: {e}")
    import traceback
    traceback.print_exc()
