# TUFF Fashion App - Quick Start Guide

## 🚀 Installation & Setup

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

---

## Backend Setup

### 1. Navigate to Backend directory
```bash
cd Backend
```

### 2. Create virtual environment (recommended)
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Python dependencies
```bash
pip install -r requirements.txt
pip install pandas  # For user preferences
```

### 4. Verify requirements.txt contains:
```
flask
flask-cors
opencv-python
numpy
mediapipe
colorsys
pandas
```

### 5. Start the backend server
```bash
python main.py
```

Backend will run on: `http://localhost:5000`

---

## Frontend Setup

### 1. Navigate to Frontend directory
```bash
cd Frontend/TUFF-frontend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Install framer-motion for animations
```bash
npm install framer-motion
```

### 4. Start the development server
```bash
npm run dev
```

Frontend will run on: `http://localhost:5173` (Vite default)

---

## 🎯 Testing the Three-Layer System

### Step 1: Color Analysis (Layer 1)
1. Navigate to `http://localhost:5173/color-analysis`
2. Upload a clear photo of your face
3. Wait for analysis to complete
4. View your skin tone, undertone, and complementary colors

### Step 2: User Input Collection (Layer 2)
1. Navigate to `http://localhost:5173/swipe`
2. Complete the onboarding flow:
   - Color analysis (if not done)
   - Size selection modal (tops, bottoms, shoes, dresses)
   - Style preferences modal (styles, occasions, budget)

### Step 3: Swipe Feature (Layer 3)
1. After completing profile, view product recommendations
2. Swipe right (❤️) to like products
3. Swipe left (✕) to pass on products
4. System learns your preferences with each swipe
5. After swiping through products, view personalized homepage

### Step 4: Personalized Homepage
1. Navigate to `http://localhost:5173/home`
2. View your style profile
3. See recommended products with match scores
4. Browse recently liked products
5. Use search and filters

---

## 📊 API Testing (Optional)

### Test Color Analysis
```bash
# Create a test script or use Postman
POST http://localhost:5000/analyze
Content-Type: application/json

{
  "image": "data:image/jpeg;base64,/9j/4AAQ..."
}
```

### Test Swipe Action
```bash
POST http://localhost:5000/swipe_action
Content-Type: application/json

{
  "userId": "user_123",
  "product": {
    "id": "prod_1",
    "title": "Sample Product",
    "brand": "Sample Brand",
    "price": "$50",
    "thumbnail": "https://example.com/image.jpg",
    "link": "https://example.com/product",
    "category": "tops",
    "color": "blue",
    "style": "casual"
  },
  "action": "like"
}
```

### Get User Analysis
```bash
GET http://localhost:5000/user_analysis/user_123
```

### Get Personalized Recommendations
```bash
POST http://localhost:5000/personalized_recommendations
Content-Type: application/json

{
  "userId": "user_123",
  "products": [
    {
      "title": "Product 1",
      "brand": "Brand A",
      "price": "$50",
      "thumbnail": "url",
      "link": "url",
      "category": "tops",
      "color": "blue",
      "style": "casual"
    }
  ]
}
```

---

## 🗂️ File Structure

### New Backend Files
```
Backend/
├── user_preferences.py     # NEW: User preference management
├── main.py                 # UPDATED: Added swipe endpoints
├── facial_color_analyzer.py # EXISTING: Color analysis
└── user_data/              # NEW: User preference storage
    └── user_123.json       # Auto-created per user
```

### New Frontend Files
```
Frontend/TUFF-frontend/src/
├── pages/
│   ├── SwipePage.tsx              # NEW: Main swipe flow
│   └── PersonalizedHomepage.tsx   # NEW: Personalized feed
│
└── components/
    ├── SwipeCard.tsx              # NEW: Product swipe card
    ├── SwipeInterface.tsx         # NEW: Swipe stack interface
    ├── UserSizeModal.tsx          # NEW: Size collection
    └── StylePreferencesModal.tsx  # NEW: Style preferences
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. "Cannot find module 'framer-motion'"
```bash
cd Frontend/TUFF-frontend
npm install framer-motion
```

#### 2. Backend port 5000 already in use
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:5000 | xargs kill -9
```

#### 3. CORS errors in browser
- Ensure `flask-cors` is installed in backend
- Check CORS is enabled in `main.py` (line 77)
- Restart backend server

#### 4. "No face detected" in color analysis
- Ensure photo is well-lit
- Face should be clearly visible
- Try a closer photo (selfie-style)
- Check backend logs for specific error

#### 5. Products not loading
- Verify backend is running
- Check browser console for errors
- Ensure web scrapers are working
- Try with default brands (Amazon, Flipkart)

---

## 📱 Usage Flow

### Complete User Journey

```
1. Landing Page (/)
   ↓
2. Color Analysis (/color-analysis)
   - Upload photo
   - Get skin tone analysis
   ↓
3. Swipe Page (/swipe)
   - Size selection modal
   - Style preferences modal
   - Product loading
   - Swipe through products
   ↓
4. Personalized Homepage (/home)
   - View style profile
   - Browse recommendations
   - Search & filter
   - View liked products
```

---

## 🎨 Features Implemented

### ✅ Layer 1: Computer Vision
- Face detection with MediaPipe
- Skin tone analysis (LAB color space)
- Undertone detection (Warm/Cool/Neutral)
- Seasonal color typing (Spring/Summer/Autumn/Winter)
- Complementary color palette generation

### ✅ Layer 2: User Input Collection
- **UserSizeModal**: 
  - Tops: XS - 3XL
  - Bottoms: 26" - 42"
  - Shoes: US 6-13
  - Dresses: XS - XXL (for female users)

- **StylePreferencesModal**:
  - 10 style options (casual, formal, streetwear, etc.)
  - 8 occasion options (everyday, work, party, etc.)
  - 4 budget ranges (₹0-2K to ₹15K+)

### ✅ Layer 3: Swipe Feature
- Tinder-like swipe interface
- Drag gestures (left/right)
- Action buttons (like/pass/undo)
- Card stack preview (3 cards)
- Real-time statistics
- Backend preference storage
- Preference learning algorithm

### ✅ Personalization System
- Multi-factor recommendation scoring:
  - Brand preference: +10 points
  - Color match: +15 points
  - Style match: +8 points
  - Category match: +5 points
  - Gender match: +5 points
- Match percentage display (0-100%)
- Preference analysis from swipe history

### ✅ Homepage Features
- User style profile card
- Color analysis display
- Recommended products section
- Recently liked products
- Search with personalization
- Advanced filters (brand, color, price)

---

## 🔐 User Data Management

### Data Storage
- **Location**: `Backend/user_data/<user_id>.json`
- **Format**: JSON
- **Auto-created**: On first swipe action
- **Persistent**: Across sessions

### Sample User Data
```json
{
  "user_id": "user_1706001234",
  "color_analysis": { ... },
  "gender": "Female",
  "body_type": "Average",
  "clothing_sizes": {
    "tops": "M",
    "bottoms": "32",
    "shoes": "8"
  },
  "style_preferences": ["casual", "bohemian"],
  "budget_range": { "min": 2000, "max": 5000 },
  "swipe_history": [
    {
      "product_id": "prod_123",
      "action": "like",
      "timestamp": "2026-01-23T10:30:00",
      ...
    }
  ]
}
```

---

## 🎯 Quick Test Checklist

- [ ] Backend server starts without errors
- [ ] Frontend dev server starts
- [ ] Navigate to color analysis page
- [ ] Upload photo and get results
- [ ] Navigate to swipe page
- [ ] Complete size modal
- [ ] Complete style preferences modal
- [ ] Products load successfully
- [ ] Can swipe cards left/right
- [ ] Like/Pass buttons work
- [ ] Navigate to homepage
- [ ] See personalized recommendations
- [ ] Search functionality works
- [ ] Filters apply correctly

---

## 📚 Additional Resources

- **Full Documentation**: See `THREE_LAYER_IMPLEMENTATION.md`
- **Recommendation Notebook**: See `recommendation.ipynb`
- **API Reference**: Check backend `main.py` for all endpoints
- **Component Docs**: See individual component files for props/usage

---

## 🚨 Important Notes

1. **User ID Management**: Currently uses localStorage. For production, implement proper authentication.

2. **Data Persistence**: User data stored in JSON files. For production, migrate to database (PostgreSQL/MongoDB).

3. **Product Images**: Linked, not stored locally. May have loading issues with some retailers.

4. **Web Scraping**: May fail if retailer websites change structure. Check console for errors.

5. **Color Analysis**: Requires good lighting and clear face photo for accurate results.

---

## 🎉 You're Ready!

Start both servers and navigate to `http://localhost:5173` to begin!

For detailed documentation, see: `THREE_LAYER_IMPLEMENTATION.md`

---

**Happy Fashion Shopping! 👗👔🛍️**
