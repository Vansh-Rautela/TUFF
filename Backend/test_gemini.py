"""
Quick test to verify Gemini API is working
Includes comprehensive list of models with rate limits
"""
import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

# Get API key
api_key = os.getenv('GEMINI_API_KEY')
print(f"API Key found: {api_key[:10]}..." if api_key else "NO API KEY!")

if not api_key:
    print("ERROR: GEMINI_API_KEY not found in .env file")
    exit(1)

# Configure and test
genai.configure(api_key=api_key)

# Model information with rate limits (RPM/TPM/RPD)
# Format: (model_name, category, rpm_limit, tpm_limit, rpd_limit)
MODEL_INFO = {
    # Text-out models
    'gemini-2.0-flash-exp': ('Text-out models', '3/10', '1.27K/250K', '9/500'),
    'gemini-2-flash': ('Text-out models', '3/2K', '4.19K/4M', '16/Unlimited'),
    'gemini-2-flash-lite': ('Text-out models', '0/4K', '0/4M', '0/Unlimited'),
    'gemini-2.5-flash-lite': ('Text-out models', '0/4K', '0/4M', '0/Unlimited'),
    'gemini-2.5-flash': ('Text-out models', '0/1K', '0/1M', '0/10K'),
    'gemini-2.5-pro': ('Text-out models', '0/150', '0/2M', '0/10K'),
    'gemini-3-flash': ('Text-out models', '0/1K', '0/1M', '0/10K'),
    'gemini-3-pro': ('Text-out models', '0/25', '0/1M', '0/250'),
    
    # Multi-modal generative models
    'nano-banana': ('Multi-modal generative models', '0/500', '0/500K', '0/2K'),
    'nano-banana-pro': ('Multi-modal generative models', '0/20', '0/100K', '0/250'),
    'gemini-2.5-flash-tts': ('Multi-modal generative models', '0/10', '0/10K', '0/100'),
    'gemini-2.5-pro-tts': ('Multi-modal generative models', '0/10', '0/10K', '0/50'),
    'imagen-4-fast-generate': ('Multi-modal generative models', '0/10', 'N/A', '0/70'),
    'imagen-4-generate': ('Multi-modal generative models', '0/10', 'N/A', '0/70'),
    'imagen-4-ultra-generate': ('Multi-modal generative models', '0/5', 'N/A', '0/30'),
    'veo-3-fast-generate': ('Multi-modal generative models', '0/2', 'N/A', '0/10'),
    'veo-3-generate': ('Multi-modal generative models', '0/2', 'N/A', '0/10'),
    
    # Other models
    'computer-use-preview': ('Other models', '0/150', '0/2M', '0/10K'),
    'deep-research-pro-preview': ('Agents', '0/1', '0/500K', '0/1.44K'),
    'gemini-robotics-er-1.5-preview': ('Other models', '0/1K', '0/2M', '0/14.4K'),
    'gemma-3-1b': ('Other models', '0/30', '0/15K', '0/14.4K'),
    'gemma-3-2b': ('Other models', '0/30', '0/15K', '0/14.4K'),
    'gemma-3-4b': ('Other models', '0/30', '0/15K', '0/14.4K'),
    'gemma-3-12b': ('Other models', '0/30', '0/15K', '0/14.4K'),
    'gemma-3-27b': ('Other models', '0/30', '0/15K', '0/14.4K'),
    'embedding-001': ('Other models', '0/3K', '0/1M', '0/Unlimited'),
    'gemini-embedding-1': ('Other models', '0/3K', '0/1M', '0/Unlimited'),
    
    # Live API
    'gemini-2.5-flash-native-audio-dialog': ('Live API', '0/Unlimited', '0/1M', '0/Unlimited'),
}

# Try different model names - comprehensive list
# Models with rate limits (RPM/TPM/RPD) from Google AI Studio
models_to_try = [
    # Gemini 2 Models
    'gemini-2.0-flash-exp',
    'models/gemini-2.0-flash-exp',
    'gemini-2-flash-exp',
    'models/gemini-2-flash-exp',
    'gemini-2-flash',
    'models/gemini-2-flash',
    'gemini-2-flash-lite',
    'models/gemini-2-flash-lite',
    
    # Gemini 2.5 Models
    'gemini-2.5-flash',
    'models/gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'models/gemini-2.5-flash-lite',
    'gemini-2.5-pro',
    'models/gemini-2.5-pro',
    'gemini-2.5-flash-tts',
    'models/gemini-2.5-flash-tts',
    'gemini-2.5-pro-tts',
    'models/gemini-2.5-pro-tts',
    'gemini-2.5-flash-native-audio-dialog',
    'models/gemini-2.5-flash-native-audio-dialog',
    
    # Gemini 3 Models
    'gemini-3-flash',
    'models/gemini-3-flash',
    'gemini-3-pro',
    'models/gemini-3-pro',
    
    # Gemini 1.5 Models (legacy)
    'gemini-1.5-pro',
    'models/gemini-1.5-pro',
    'gemini-1.5-flash',
    'models/gemini-1.5-flash',
    
    # Gemini 1.0 Models (legacy)
    'gemini-pro',
    'models/gemini-pro',
    'gemini-1.0-pro',
    'models/gemini-1.0-pro',
    
    # Specialized Models
    'computer-use-preview',
    'models/computer-use-preview',
    'deep-research-pro-preview',
    'models/deep-research-pro-preview',
    'gemini-robotics-er-1.5-preview',
    'models/gemini-robotics-er-1.5-preview',
    
    # Multi-modal Models
    'nano-banana',
    'models/nano-banana',
    'nano-banana-pro',
    'models/nano-banana-pro',
    
    # Gemma Models
    'gemma-3-1b',
    'models/gemma-3-1b',
    'gemma-3-2b',
    'models/gemma-3-2b',
    'gemma-3-4b',
    'models/gemma-3-4b',
    'gemma-3-12b',
    'models/gemma-3-12b',
    'gemma-3-27b',
    'models/gemma-3-27b',
    
    # Imagen Models
    'imagen-4-fast-generate',
    'models/imagen-4-fast-generate',
    'imagen-4-generate',
    'models/imagen-4-generate',
    'imagen-4-ultra-generate',
    'models/imagen-4-ultra-generate',
    
    # Veo Models
    'veo-3-fast-generate',
    'models/veo-3-fast-generate',
    'veo-3-generate',
    'models/veo-3-generate',
    
    # Embedding Models
    'embedding-001',
    'models/embedding-001',
    'gemini-embedding-1',
    'models/gemini-embedding-1',
]

print("\n" + "="*80)
print(" Testing Gemini Models with Rate Limits")
print("="*80 + "\n")

working_models = []
failed_models = []

for model_name in models_to_try:
    try:
        # Extract base model name for info lookup
        base_name = model_name.replace('models/', '')
        info = MODEL_INFO.get(base_name, ('Unknown', 'N/A', 'N/A', 'N/A'))
        category, rpm, tpm, rpd = info
        
        print(f"Testing: {model_name}")
        print(f"  Category: {category}")
        print(f"  Limits: RPM={rpm}, TPM={tpm}, RPD={rpd}")
        print("  Status: ", end="")
        
        model = genai.GenerativeModel(model_name)
        response = model.generate_content("Say hello in 3 words")
        
        print("✅ SUCCESS!")
        print(f"  Response: {response.text}")
        working_models.append({
            'name': model_name,
            'category': category,
            'rpm': rpm,
            'tpm': tpm,
            'rpd': rpd
        })
        print()
        
    except Exception as e:
        error_msg = str(e)
        if "404" in error_msg or "not found" in error_msg.lower():
            print("❌ Not found")
        elif "quota" in error_msg.lower() or "rate limit" in error_msg.lower():
            print("⚠️  Rate limit/quota issue")
        else:
            print(f"❌ Error: {error_msg[:50]}...")
        failed_models.append(model_name)
        print()

# Summary
print("\n" + "="*80)
print(" TEST SUMMARY")
print("="*80)
print(f"✅ Working models: {len(working_models)}")
print(f"❌ Failed models: {len(failed_models)}")
print(f"📊 Total tested: {len(models_to_try)}")

if working_models:
    print("\n✅ WORKING MODELS:")
    print("-" * 80)
    for model in working_models:
        print(f"  • {model['name']}")
        print(f"    Category: {model['category']}")
        print(f"    Limits: RPM={model['rpm']}, TPM={model['tpm']}, RPD={model['rpd']}")
        print()
else:
    print("\n⚠️  No working models found. Check your API key and permissions.")

