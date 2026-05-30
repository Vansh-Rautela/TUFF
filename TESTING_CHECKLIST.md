# TUFF Fashion App - Testing Checklist

Use this checklist to verify that all three layers are working correctly!

---

## 🔧 Pre-Flight Checks

### Backend Setup
- [ ] Navigated to `Backend` directory
- [ ] Created virtual environment (optional but recommended)
- [ ] Installed all requirements: `pip install -r requirements.txt`
- [ ] Installed pandas: `pip install pandas`
- [ ] Started backend server: `python main.py`
- [ ] Server running on `http://localhost:5000`
- [ ] No errors in terminal

### Frontend Setup
- [ ] Navigated to `Frontend/TUFF-frontend` directory
- [ ] Installed dependencies: `npm install`
- [ ] Installed Framer Motion: `npm install framer-motion`
- [ ] Started dev server: `npm run dev`
- [ ] Server running on `http://localhost:5173`
- [ ] No errors in terminal
- [ ] Browser opens automatically

---

## 🎨 Layer 1: Computer Vision Testing

### Color Analysis Page
- [ ] Navigate to `http://localhost:5173/color-analysis`
- [ ] Page loads without errors
- [ ] Can see upload interface

### Upload and Analysis
- [ ] Upload a clear face photo
- [ ] Analysis completes successfully
- [ ] Results show:
  - [ ] Skin tone name (e.g., "Light Warm")
  - [ ] Undertone (Warm/Cool/Neutral)
  - [ ] Seasonal type (Spring/Summer/Autumn/Winter)
  - [ ] Complementary color palette with swatches
  - [ ] Description text

### Backend Verification
- [ ] Check backend terminal for `/analyze` API call
- [ ] No errors in backend logs
- [ ] Response status: 200

### Browser Console
- [ ] Open browser DevTools (F12)
- [ ] Check Console tab - no errors
- [ ] Check Network tab - `/analyze` request successful

---

## 📋 Layer 2: User Input Collection Testing

### Navigate to Swipe Page
- [ ] Go to `http://localhost:5173/swipe`
- [ ] Page loads without errors

### If No Color Analysis Yet
- [ ] See "Start Color Analysis" screen
- [ ] Button redirects to color analysis page
- [ ] Can skip if needed

### Size Selection Modal
- [ ] Size modal appears automatically
- [ ] Can see all size categories:
  - [ ] Tops/Shirts (XS to 3XL)
  - [ ] Bottoms/Pants (26-42)
  - [ ] Shoes (6-13)
  - [ ] Dresses (if female user)
- [ ] Can select different sizes
- [ ] Selected size highlights in purple
- [ ] "Save Sizes" button visible
- [ ] "Skip for Now" button visible
- [ ] Modal can be closed

### Save Sizes
- [ ] Click "Save Sizes"
- [ ] Modal closes smoothly
- [ ] Style preferences modal appears

### Style Preferences Modal
- [ ] Modal displays correctly
- [ ] Can see style options (10 total):
  - [ ] Casual, Formal, Business, Streetwear
  - [ ] Athletic, Bohemian, Minimalist, Vintage
  - [ ] Trendy, Elegant
- [ ] Can select multiple styles
- [ ] Selected styles highlight in purple
- [ ] Can see occasion options (8 total)
- [ ] Can select multiple occasions
- [ ] Can see budget ranges (4 options)
- [ ] Can select budget range
- [ ] "Save Preferences" button visible
- [ ] Button disabled until 2+ styles selected

### Save Preferences
- [ ] Select at least 2 styles
- [ ] Click "Save Preferences"
- [ ] Modal closes smoothly
- [ ] Products start loading

### Backend Verification
- [ ] Check backend terminal for `/update_user_info` calls
- [ ] No errors in backend logs
- [ ] Check `Backend/user_data/` folder created
- [ ] User JSON file created (e.g., `user_123.json`)

### Verify Saved Data
- [ ] Open user JSON file
- [ ] Contains `clothing_sizes`
- [ ] Contains `style_preferences`
- [ ] Contains `budget_range`
- [ ] All data matches selections

---

## ❤️ Layer 3: Swipe Feature Testing

### Product Loading
- [ ] "Finding Perfect Matches..." loading screen shows
- [ ] Loading spinner visible
- [ ] Products load successfully
- [ ] No errors in console

### Swipe Interface
- [ ] Product cards visible in stack
- [ ] Can see top card clearly
- [ ] Can see preview of 2-3 cards behind
- [ ] Header shows statistics (likes: 0, dislikes: 0)
- [ ] Progress counter shows (e.g., "1 / 50")

### Product Card Display
- [ ] Product image loads
- [ ] Product title visible
- [ ] Brand name visible (if available)
- [ ] Price visible (if available)
- [ ] Match score badge visible (if available)
- [ ] Info button (i icon) visible
- [ ] Category/color/style tags visible

### Card Info Details
- [ ] Click info button
- [ ] Details panel slides up
- [ ] Shows full product info
- [ ] "View Product" button works
- [ ] Can close details panel
- [ ] Returns to card view

### Swipe Right (Like)
- [ ] Drag card to the right
- [ ] Card follows finger/mouse
- [ ] Release when dragged far enough
- [ ] "❤️ LIKE" indicator appears briefly
- [ ] Card disappears
- [ ] Next card comes to front
- [ ] Like count increases (e.g., "1")

### Swipe Left (Dislike)
- [ ] Drag card to the left
- [ ] Card follows finger/mouse
- [ ] Release when dragged far enough
- [ ] "✕ PASS" indicator appears briefly
- [ ] Card disappears
- [ ] Next card comes to front
- [ ] Dislike count increases

### Action Buttons
- [ ] Click ❤️ (heart) button
- [ ] Card liked successfully
- [ ] Click ✕ (X) button
- [ ] Card passed successfully
- [ ] Click 🔄 (undo) button
- [ ] Previous card returns
- [ ] Count decreases

### Backend Swipe Tracking
- [ ] Check backend terminal
- [ ] See `/swipe_action` API calls
- [ ] One call per swipe
- [ ] No errors in logs

### Verify Swipe History
- [ ] Open user JSON file
- [ ] Contains `swipe_history` array
- [ ] Each swipe has:
  - [ ] product_id
  - [ ] product_title
  - [ ] product_brand
  - [ ] action ("like" or "dislike")
  - [ ] timestamp
  - [ ] product_features

### Complete Swipe Session
- [ ] Swipe through 10-20 products
- [ ] Mix of likes and dislikes
- [ ] No errors or crashes
- [ ] Smooth performance

### End of Products
- [ ] Reached last product
- [ ] "You're All Done! 🎉" message shows
- [ ] Shows statistics (e.g., "Liked: 15 | Passed: 25")
- [ ] "Review Again" button visible
- [ ] Can restart swiping

---

## 🏠 Personalized Homepage Testing

### Navigate to Homepage
- [ ] Go to `http://localhost:5173/home`
- [ ] Page loads without errors

### Style Profile Card
- [ ] Purple gradient card visible
- [ ] Shows "Your Style Profile"
- [ ] Displays color analysis:
  - [ ] Seasonal type
  - [ ] Undertone
  - [ ] Color swatches visible
- [ ] Shows favorite styles (from swipes)
- [ ] Shows activity stats:
  - [ ] Total likes count
  - [ ] Favorite brands count

### Recommended Products Section
- [ ] "Recommended For You" header visible
- [ ] Product grid displays
- [ ] Products have match scores
- [ ] Match percentage badges visible (e.g., "85%")
- [ ] Products ranked by score (highest first)

### Product Cards
- [ ] Click on product card
- [ ] Opens product link in new tab
- [ ] Hover effect works (card lifts)
- [ ] Image loads correctly
- [ ] Title, brand, price visible

### Recently Liked Section
- [ ] "Recently Liked" header visible
- [ ] Shows last 6 liked products
- [ ] Products match swipe history
- [ ] Can click to view products

### Search Functionality
- [ ] Search bar visible at top
- [ ] Can type in search bar
- [ ] Press Enter or click "Search"
- [ ] Products load based on query
- [ ] Results still personalized
- [ ] Match scores still shown

### Filter Functionality
- [ ] Click filter icon (funnel)
- [ ] Filter options appear
- [ ] Can filter by:
  - [ ] Brands
  - [ ] Colors
  - [ ] Price range
- [ ] Apply filters
- [ ] Results update
- [ ] Still personalized

### Backend Verification
- [ ] Check terminal for `/homepage_feed/<user_id>` call
- [ ] Check for `/personalized_recommendations` call
- [ ] No errors in logs
- [ ] Response data includes:
  - [ ] user_analysis
  - [ ] recent_likes
  - [ ] color_analysis
  - [ ] style_summary

---

## 🔄 Integration Testing

### Complete User Journey
- [ ] Start at landing page (`/`)
- [ ] Navigate to color analysis
- [ ] Complete color analysis
- [ ] Navigate to swipe page
- [ ] Complete size modal
- [ ] Complete style preferences
- [ ] Swipe through products
- [ ] Navigate to homepage
- [ ] See personalized feed
- [ ] Use search
- [ ] Apply filters
- [ ] View liked products

### Data Persistence
- [ ] Close browser
- [ ] Reopen browser
- [ ] Navigate to homepage
- [ ] User data still present
- [ ] Swipe history preserved
- [ ] Preferences maintained

### Multiple Sessions
- [ ] Complete swipe session (20 products)
- [ ] Return to homepage
- [ ] See updated recommendations
- [ ] Return to swipe page
- [ ] Get new products
- [ ] Swipe more (20 products)
- [ ] Return to homepage
- [ ] See improved recommendations
- [ ] Match scores higher for preferred items

---

## 🧪 Recommendation Algorithm Testing

### Initial Recommendations (Before Swipes)
- [ ] Products shown based on color analysis
- [ ] Products match user input (gender, style)
- [ ] Budget-appropriate items shown

### After 10 Swipes
- [ ] Return to homepage
- [ ] Check match scores
- [ ] Products from liked brands score higher
- [ ] Products in liked colors score higher

### After 30 Swipes
- [ ] Return to homepage
- [ ] Check match scores
- [ ] Clear personalization visible
- [ ] Top products (90%+ match) are highly relevant
- [ ] Mix of:
  - [ ] Favorite brands
  - [ ] Complementary colors
  - [ ] Preferred styles
  - [ ] Appropriate budget

### Verify Scoring
- [ ] Like a product from "Zara"
- [ ] See more Zara products ranked higher
- [ ] Like products in "coral" color
- [ ] See more coral products ranked higher
- [ ] Like "bohemian" style items
- [ ] See more bohemian items ranked higher

---

## 🐛 Error Handling Testing

### Color Analysis Errors
- [ ] Upload non-face image
- [ ] Get appropriate error message
- [ ] Upload dark/blurry photo
- [ ] Get appropriate error message
- [ ] Upload corrupted file
- [ ] Get appropriate error message

### Product Loading Errors
- [ ] Simulate network failure
- [ ] See error state
- [ ] "Try Again" button visible
- [ ] Can retry successfully

### Backend Down
- [ ] Stop backend server
- [ ] Try color analysis
- [ ] See error message
- [ ] Try swiping
- [ ] See error message
- [ ] Restart backend
- [ ] Functionality restored

---

## 📱 Responsive Design Testing

### Desktop (1920x1080)
- [ ] Layout looks good
- [ ] Cards properly sized
- [ ] Modals centered
- [ ] Text readable
- [ ] Images sharp

### Laptop (1366x768)
- [ ] Layout adapts
- [ ] No horizontal scroll
- [ ] Everything accessible

### Tablet (768x1024)
- [ ] Grid adjusts (fewer columns)
- [ ] Touch swipe works
- [ ] Buttons easy to tap
- [ ] Modals fit screen

### Mobile (375x667)
- [ ] Single column layout
- [ ] Swipe cards fill screen
- [ ] Touch gestures work
- [ ] Text still readable
- [ ] Buttons large enough

---

## ⚡ Performance Testing

### Page Load Times
- [ ] Homepage loads in < 2 seconds
- [ ] Swipe page loads in < 2 seconds
- [ ] Color analysis results in < 3 seconds

### Smooth Animations
- [ ] Swipe gestures smooth (60fps)
- [ ] Card transitions smooth
- [ ] Modal animations smooth
- [ ] No lag or stuttering

### Large Dataset
- [ ] Swipe through 100+ products
- [ ] No memory leaks
- [ ] Performance remains good
- [ ] No crashes

---

## 🔐 Data Privacy Testing

### User ID Management
- [ ] User ID created on first visit
- [ ] Stored in localStorage
- [ ] Persists across sessions
- [ ] Unique per user

### Data Storage
- [ ] User data in `Backend/user_data/`
- [ ] One file per user
- [ ] No duplicate user files
- [ ] Data properly formatted JSON

### No Data Leaks
- [ ] Can't access other users' data
- [ ] Backend validates user_id
- [ ] No sensitive data exposed in URLs

---

## 📊 Analytics Verification

### Swipe Statistics
- [ ] Navigate to swipe page
- [ ] Swipe 20 products (10 likes, 10 dislikes)
- [ ] Check user JSON file
- [ ] Verify counts match:
  - [ ] swipe_history length = 20
  - [ ] 10 items with action="like"
  - [ ] 10 items with action="dislike"

### Preference Analysis
- [ ] Navigate to `http://localhost:5000/user_analysis/<user_id>`
- [ ] API returns:
  - [ ] favorite_brands (top 5)
  - [ ] favorite_colors (top 5)
  - [ ] favorite_styles (top 5)
  - [ ] favorite_categories (top 5)
  - [ ] total_likes = 10
  - [ ] total_dislikes = 10
  - [ ] like_rate = 0.5

---

## ✅ Final Verification

### All Three Layers Working
- [ ] Layer 1 (Color Analysis): ✅ Working
- [ ] Layer 2 (User Input): ✅ Working
- [ ] Layer 3 (Swipe Feature): ✅ Working

### Integration Points
- [ ] Color analysis → Used in recommendations ✅
- [ ] Size input → Saved to backend ✅
- [ ] Style preferences → Used in recommendations ✅
- [ ] Swipe history → Updates recommendations ✅
- [ ] Homepage → Shows personalized feed ✅

### Complete Feature Set
- [ ] Color analysis with complementary palette
- [ ] Size collection modal
- [ ] Style preferences modal
- [ ] Swipe interface with gestures
- [ ] Preference learning system
- [ ] Personalized recommendations
- [ ] Homepage with style profile
- [ ] Search functionality
- [ ] Filter system
- [ ] Liked products display

---

## 🎉 Success Criteria

**You can consider the implementation successful if:**

✅ All three layers work independently  
✅ All three layers integrate seamlessly  
✅ Data flows correctly from frontend to backend  
✅ User preferences are learned and applied  
✅ Recommendations improve with usage  
✅ Homepage shows personalized content  
✅ Search and filters work with personalization  
✅ No critical errors in console or terminal  
✅ Performance is smooth and responsive  
✅ User experience is intuitive and delightful  

---

## 📝 Notes

**If any item fails:**
1. Check browser console for errors
2. Check backend terminal for errors
3. Verify API endpoints are responding
4. Check network tab in DevTools
5. Review user JSON file for correct data
6. Refer to QUICK_START.md for troubleshooting
7. Refer to THREE_LAYER_IMPLEMENTATION.md for technical details

**Common Issues:**
- framer-motion not installed → `npm install framer-motion`
- Backend not running → `python main.py`
- CORS errors → Verify flask-cors is installed
- No products loading → Check web scrapers working

---

**Testing completed on**: _______________  
**Tested by**: _______________  
**Overall status**: ⬜ All Green ⬜ Some Issues ⬜ Needs Work  

**Notes:**
________________________________
________________________________
________________________________
