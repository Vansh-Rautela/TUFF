"""
List all available Gemini models for your API key
"""
import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

api_key = os.getenv('GEMINI_API_KEY')
print(f"API Key found: {api_key[:10]}..." if api_key else "NO API KEY!")

if not api_key:
    print("ERROR: GEMINI_API_KEY not found")
    exit(1)

try:
    genai.configure(api_key=api_key)
    
    print("\n📋 Available Gemini Models:\n")
    print("-" * 60)
    
    for model in genai.list_models():
        if 'generateContent' in model.supported_generation_methods:
            print(f"✅ {model.name}")
            print(f"   Display Name: {model.display_name}")
            print(f"   Methods: {', '.join(model.supported_generation_methods)}")
            print("-" * 60)
    
except Exception as e:
    print(f"\n❌ ERROR: {e}")
