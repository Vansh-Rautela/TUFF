# TUFF App - Product Caching & Swipe Update Implementation Guide

## ✅ What Has Been Created

### 1. **Product Cache System** (`product_cache.py`)
- ✅ SQLite database for product storage
- ✅ Automatic caching of scraped products
- ✅ Fast retrieval (no waiting for scraping!)
- ✅ Similar product recommendations
- ✅ Auto-cleanup of old products

---

## 🚀 Implementation Steps

### **Step 1: Update main.py to Use Product Cache**

Add at the top of `main.py` (after imports):

```python
from product_cache import product_cache
import threading
import time
```

Update the `/scrape_products` endpoint to cache results:

```python
@app.route('/scrape_products', methods=['POST'])
def scrape_products():
    try:
        payload = request.get_json(force=True) or {}
        user_data = payload.get('userData') or {}
        filters = payload.get('filters') or {}
        
        # Check if we have cached products first
        cached_count = product_cache.get_product_count(max_age_hours=24)
        
        if cached_count > 50:
            # Return cached products (instant!)
            products = product_cache.get_products(
                limit=100,
                brands=filters.get('brands'),
                gender=user_data.get('gender')
            )
            return jsonify({
                'products': products,
                'from_cache': True,
                'cache_count': cached_count
            })
        
        # If cache is empty or stale, scrape and cache
        # ... existing scraping code ...
        all_products = []  # scraped products
        
        # Cache the scraped products
        if all_products:
            product_cache.add_products(all_products)
        
        return jsonify({
            'products': all_products,
            'from_cache': False
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
```

---

### **Step 2: Add Background Scraper**

Add this function to `main.py`:

```python
def background_scraper():
    """Background task to refresh product cache"""
    while True:
        try:
            print("🔄 Background scraper starting...")
            
            # Scrape from multiple brands
            brands_to_scrape = ['Amazon', 'Flipkart', 'Myntra']
            all_products = []
            
            brand_map = _brand_to_scraper_map()
            
            for brand in brands_to_scrape:
                scraper = brand_map.get(brand)
                if scraper:
                    try:
                        df = scraper("fashion clothing")
                        if isinstance(df, pd.DataFrame) and not df.empty:
                            if 'Source' not in df.columns:
                                df['Source'] = brand
                            products = _df_to_products(df)
                            all_products.extend(products)
                            print(f"✅ Scraped {len(products)} from {brand}")
                    except Exception as e:
                        print(f"❌ Failed to scrape {brand}: {e}")
            
            # Cache all products
            if all_products:
                count = product_cache.add_products(all_products)
                print(f"💾 Cached {count} products total")
            
            # Clean old products
            deleted = product_cache.clear_old_products(max_age_hours=48)
            print(f"🗑️ Deleted {deleted} old products")
            
            print(f"✅ Background scraper complete. Sleeping for 6 hours...")
            
        except Exception as e:
            print(f"❌ Background scraper error: {e}")
        
        # Run every 6 hours
        time.sleep(6 * 60 * 60)

# Start background scraper thread
scraper_thread = threading.Thread(target=background_scraper, daemon=True)
scraper_thread.start()
```

---

### **Step 3: Update SwipeInterface.tsx**

Change to show completion after 10 swipes:

Find the completion check in `SwipeInterface.tsx`:

```typescript
// OLD:
if (currentIndex >= products.length) { ... }

// NEW:
// Show completion after 10 swipes OR all products done
const shouldShowCompletion = currentIndex >= 10 || currentIndex >= products.length;

if (shouldShowCompletion) {
    return (
        <div className="flex flex-col items-center justify-center h-full p-8">
            <motion.div ...>
                <h2>Great Job! 🎉</h2>
                <p>You've swiped through {Math.min(currentIndex, 10)} products.</p>
                <p>Liked: {likeCount} | Passed: {dislikeCount}</p>
                
                <div className="flex gap-4 mt-6">
                    {currentIndex < products.length && (
                        <button
                            onClick={() => setCurrentIndex(currentIndex)}
                            className="px-6 py-3 border-2 border-purple-600..."
                        >
                            Swipe More
                        </button>
                    )}
                    <button
                        onClick={onComplete}
                        className="px-8 py-3 bg-purple-600 text-white..."
                    >
                        Explore More Products
                        <ArrowRight size={20} />
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
```

---

### **Step 4: Update PersonalizedHomepage.tsx**

Show products similar to liked products:

```typescript
const loadPersonalizedFeed = async () => {
  setIsLoading(true);
  
  try:
    // Get user's liked products
    const likedResponse = await fetch(`http://localhost:5000/liked_products/${userId}`);
    const likedData = await likedResponse.json();
    
    if (likedData.success) {
      setLikedProducts(likedData.liked_products.slice(-6));
      
      // Get similar products based on likes
      const similarResponse = await fetch('http://localhost:5000/similar_products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          liked_products: likedData.liked_products,
          limit: 50
        })
      });
      
      if (similarResponse.ok) {
        const similarData = await similarResponse.json();
        setRecommendedProducts(similarData.products || []);
      }
    }
  } catch (error) {
    console.error('Error loading feed:', error);
  } finally {
    setIsLoading(false);
  }
};
```

---

### **Step 5: Add Similar Products Endpoint**

Add to `main.py`:

```python
@app.route('/similar_products', methods=['POST'])
def get_similar_products():
    """Get products similar to user's liked products"""
    try:
        data = request.get_json()
        user_id = data.get('userId')
        liked_products = data.get('liked_products', [])
        limit = data.get('limit', 50)
        
        # Get similar products from cache
        similar = product_cache.get_similar_products(
            liked_products=liked_products,
            limit=limit
        )
        
        # Get personalized scores
        pref_manager = UserPreferenceManager()
        user_prefs = pref_manager.load_preferences(user_id)
        
        if user_prefs:
            # Score the similar products
            scored = pref_manager.get_personalized_recommendations(
                user_prefs,
                similar
            )
            return jsonify({
                'success': True,
                'products': scored
            })
        
        return jsonify({
            'success': True,
            'products': similar
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
```

---

## 🎯 How It Works

### **User Flow**:

```
1. User opens /swipe
   ↓
2. Products load from CACHE (instant!)
   ↓
3. User swipes through products
   ↓
4. After 10 swipes:
   ├─ Option 1: "Swipe More" (continue swiping)
   └─ Option 2: "Explore More Products" (go to homepage)
      ↓
5. Homepage shows:
   ├─ Products similar to what they liked
   ├─ Same brands they liked
   ├─ Same colors/styles they liked
   └─ Personalized recommendations
```

### **Background Process**:

```
Server starts
  ↓
Background scraper thread starts
  ↓
Every 6 hours:
  ├─ Scrape Amazon
  ├─ Scrape Flipkart
  ├─ Scrape Myntra
  ├─ Cache 100-300 products
  └─ Delete products older than 48 hours
```

---

## ⚡ Benefits

### **For Users**:
- ✅ **Instant loading** (no waiting for scraping!)
- ✅ **Fresh products** (updated every 6 hours)
- ✅ **Personalized** (similar to what they like)
- ✅ **Fast exploration** (can swipe 10 then explore)

### **For System**:
- ✅ **Reduced load** (scraping happens in background)
- ✅ **Scalable** (can serve many users from cache)
- ✅ **Reliable** (cached data always available)
- ✅ **Free** (no API costs!)

---

## 📝 Testing Steps

1. **Start backend**:
   ```bash
   python main.py
   ```
   - Background scraper will start
   - Will scrape products in background

2. **Check cache**:
   - File `product_cache.db` will be created
   - Background scraper logs will show progress

3. **Test swipe**:
   - Navigate to `/swipe`
   - Products load instantly from cache
   - Swipe 10 products
   - See "Explore More Products" button

4. **Test homepage**:
   - Click "Explore More Products"
   - See products similar to what you liked
   - Search and filters work

---

## 🔧 Quick Implementation (Copy-Paste Ready)

Due to the extensive changes needed across multiple files, I recommend:

### **Option A**: Manual Implementation (30 min)
Follow the steps above to add:
1. Product cache import in main.py
2. Background scraper function
3. Update SwipeInterface completion
4. Update homepage loading

### **Option B**: I can create updated files
Would you like me to:
1. Create updated `main.py` with all changes?
2. Create updated `SwipeInterface.tsx`?
3. Create updated `PersonalizedHomepage.tsx`?

---

## 💡 Current Status

✅ **Created**: `product_cache.py` (database system)  
⏳ **Pending**: Integration in main.py  
⏳ **Pending**: SwipeInterface update  
⏳ **Pending**: Homepage update  

**Ready to proceed?** Let me know if you want me to create the complete updated files! 🚀
