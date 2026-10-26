# TUFF Fashion App - Three-Layer Implementation

## 🎨 System Architecture

This implementation consists of **three integrated layers** that work together to provide personalized fashion recommendations:

### Layer 1: Computer Vision - Color Analysis 🎭
**Location**: `Backend/facial_color_analyzer.py`

**Features**:
- **Face Detection**: Uses MediaPipe for accurate face detection
- **Skin Tone Analysis**: Analyzes facial color to determine:
  - Undertone (Warm, Cool, Neutral)
  - Brightness level (Light, Medium, Deep)
  - Seasonal color type (Spring, Summer, Autumn, Winter)
- **Complementary Colors**: Generates color palettes that suit the user
- **LAB Color Space**: Uses advanced color science for accurate matching

**API Endpoint**: `POST /analyze`
- Input: Base64 encoded image
- Output: Skin tone, undertone, seasonal colors, complementary palette

---

### Layer 2: User Input Collection 📋
**Location**: `Frontend/src/components/`

**Modal Components**:

#### 1. **UserSizeModal.tsx**
Collects clothing size preferences:
- **Tops/Shirts**: XS to 3XL
- **Bottoms/Pants**: Waist sizes 26-42
- **Shoes**: US sizes 6-13
- **Dresses**: For female users

#### 2. **StylePreferencesModal.tsx**
Collects style and shopping preferences:
- **Style Types**: 
  - Casual, Formal, Business, Streetwear
  - Athletic, Bohemian, Minimalist, Vintage
  - Trendy, Elegant
- **Occasions**:
  - Everyday, Work, Party, Date
  - Gym, Formal Events, Vacation, Outdoor
- **Budget Range**:
  - Budget Friendly (₹0-2K)
  - Mid Range (₹2K-5K)
  - Premium (₹5K-15K)
  - Luxury (₹15K+)

**API Endpoint**: `POST /update_user_info`
- Saves all user preferences to backend
- Associates with unique user ID

---

### Layer 3: Swipe Feature (Tinder-like) ❤️👎
**Location**: `Frontend/src/components/SwipeInterface.tsx` & `Backend/user_preferences.py`

**Features**:

#### **Frontend - Swipe Interaction**
- **Drag Gestures**: Swipe right to like, left to dislike
- **Card Stack**: Shows preview of next 3 products
- **Action Buttons**: 
  - ❤️ Like button
  - ✕ Pass button
  - 🔄 Undo button
- **Statistics Tracking**: Shows like/dislike counts
- **Visual Feedback**: Animations for swipe actions

#### **Backend - Preference Learning**
**File**: `user_preferences.py`

**Data Storage**:
```python
@dataclass
class SwipeAction:
    product_id: str
    product_title: str
    product_brand: str
    product_image: str
    product_price: Optional[str]
    product_link: str
    action: str  # 'like' or 'dislike'
    timestamp: str
    product_features: Dict[str, Any]
```

**Analysis Methods**:
- `analyze_preferences()`: Extracts patterns from swipes
  - Favorite brands
  - Favorite colors
  - Favorite styles
  - Favorite categories
  - Like rate statistics

- `get_personalized_recommendations()`: Generates recommendations
  - **Brand matching**: +10 points for favorite brands
  - **Color matching**: +15 points for complementary colors
  - **Style matching**: +8 points for preferred styles
  - **Category matching**: +5 points for favorite categories
  - **Gender matching**: +5 points for gender-appropriate items

**API Endpoints**:
- `POST /swipe_action` - Save like/dislike
- `GET /user_preferences/<user_id>` - Get user profile
- `GET /user_analysis/<user_id>` - Get preference analysis
- `GET /liked_products/<user_id>` - Get liked products
- `POST /personalized_recommendations` - Get ranked products
- `GET /homepage_feed/<user_id>` - Get personalized homepage

---

## 🔄 Complete User Flow

### 1. **Onboarding Flow**
```
Color Analysis → Size Input → Style Preferences → Product Loading → Swipe Interface
```

**Page**: `SwipePage.tsx`

**Steps**:
1. User uploads photo for color analysis
2. System analyzes skin tone and generates color palette
3. Modal pops up to collect clothing sizes
4. Modal collects style and budget preferences
5. System loads products from fashion sites
6. Products are ranked by recommendation algorithm
7. User swipes through products

### 2. **Swiping Experience**
- User sees product card with image, title, brand, price
- Can view full details by clicking info button
- Swipe right (or click ❤️) to like
- Swipe left (or click ✕) to dislike
- Each action is saved to backend
- Recommendation algorithm learns preferences

### 3. **Homepage Experience**

**Page**: `PersonalizedHomepage.tsx`

**Sections**:

#### a. **Style Profile Card**
Shows personalized summary:
- Color analysis results with color swatches
- Favorite styles (from swipe history)
- Activity stats (total likes, favorite brands)

#### b. **Recommended For You**
Products ranked by:
- Match score (0-100%)
- Combination of:
  - Color analysis compatibility
  - Swipe history preferences
  - Style preferences
  - Budget alignment

#### c. **Recently Liked**
- Last 6 products the user liked
- Quick access to saved items

#### d. **Search & Filter**
- **Search Bar**: Find specific products
- **Filters**: 
  - By brand
  - By color (matches color analysis)
  - By price range
- All results are still personalized

---

## 🎯 Recommendation Algorithm

### Scoring System

```python
score = 0

# Brand preference (10 points)
if product.brand in favorite_brands:
    score += 10

# Color matching with color analysis (15 points)
if product.color matches complementary_colors:
    score += 15

# Style preference (8 points)
if product.style in favorite_styles:
    score += 8

# Category preference (5 points)
if product.category in favorite_categories:
    score += 5

# Gender match (5 points)
if product.gender matches user.gender:
    score += 5

# Total possible: 43 points
# Converted to percentage: (score / 43) * 100
```

### Learning Over Time

The system improves recommendations as the user swipes more:
- **Initial**: Uses color analysis + user inputs
- **After 10 swipes**: Learns brand preferences
- **After 20 swipes**: Learns style preferences
- **After 50+ swipes**: Highly personalized recommendations

---

## 📊 Data Flow

### User Data Structure
```json
{
  "user_id": "user_1234567890",
  "color_analysis": {
    "skintone": {
      "name": "Light Warm",
      "undertone": "Warm",
      "season": "Spring",
      "hex": "#f5d5c3"
    },
    "complementaryColors": [
      { "name": "Peach", "hex": "#FFDAB9" },
      { "name": "Coral", "hex": "#FF7F50" }
    ]
  },
  "gender": "Female",
  "body_type": "Hourglass",
  "clothing_sizes": {
    "tops": "M",
    "bottoms": "32",
    "shoes": "8",
    "dresses": "M"
  },
  "style_preferences": ["casual", "bohemian", "trendy"],
  "favorite_brands": ["Zara", "H&M"],
  "budget_range": { "min": 2000, "max": 5000 },
  "swipe_history": [
    {
      "product_id": "prod_123",
      "product_title": "Floral Summer Dress",
      "product_brand": "Zara",
      "action": "like",
      "timestamp": "2026-01-23T10:30:00",
      "product_features": {
        "color": "coral",
        "style": "bohemian",
        "category": "dresses"
      }
    }
  ]
}
```

---

## 🚀 Setup & Installation

### Backend Setup

```bash
cd Backend

# Install dependencies
pip install -r requirements.txt

# Additional dependencies for new features
pip install pandas

# Run the server
python main.py
```

The backend will run on `http://localhost:5000`

### Frontend Setup

```bash
cd Frontend/TUFF-frontend

# Install dependencies
npm install

# Install additional dependencies
npm install framer-motion

# Run development server
npm run dev
```

The frontend will run on `http://localhost:5173` (Vite default)

---

## 🔌 API Endpoints Reference

### Color Analysis
- **POST** `/analyze` - Upload image for color analysis

### User Management
- **POST** `/update_user_info` - Update user profile
- **GET** `/user_preferences/<user_id>` - Get user data
- **GET** `/user_analysis/<user_id>` - Get preference analysis

### Swipe System
- **POST** `/swipe_action` - Record swipe (like/dislike)
- **GET** `/liked_products/<user_id>` - Get liked products

### Recommendations
- **POST** `/scrape_products` - Scrape fashion products
- **POST** `/personalized_recommendations` - Get ranked recommendations
- **GET** `/homepage_feed/<user_id>` - Get personalized feed

---

## 📁 Project Structure

```
TUFF-app/
├── Backend/
│   ├── facial_color_analyzer.py    # Layer 1: Color Analysis
│   ├── user_preferences.py         # Layer 3: Preference Storage
│   ├── main.py                     # API Server
│   ├── Webscraping/                # Product scrapers
│   └── user_data/                  # User preference storage
│
├── Frontend/TUFF-frontend/src/
│   ├── pages/
│   │   ├── SwipePage.tsx           # Main swipe flow orchestration
│   │   ├── PersonalizedHomepage.tsx # Personalized feed
│   │   └── ColorAnalysis.tsx       # Color analysis page
│   │
│   └── components/
│       ├── SwipeCard.tsx           # Individual product card
│       ├── SwipeInterface.tsx      # Swipe stack interface
│       ├── UserSizeModal.tsx       # Layer 2: Size collection
│       └── StylePreferencesModal.tsx # Layer 2: Style collection
│
└── recommendation.ipynb            # ML-based recommendation (future)
```

---

## 🎨 Color Analysis Integration

### How Color Analysis Affects Recommendations

1. **Color Matching**:
   ```python
   complementary_colors = user.color_analysis.complementaryColors
   
   for product in products:
       product_color = product.color.lower()
       for comp_color in complementary_colors:
           if comp_color.name.lower() in product_color:
               score += 15  # High priority for color match
   ```

2. **Visual Display**:
   - Homepage shows user's complementary colors
   - Products with matching colors get highlighted
   - Match percentage displayed on product cards

3. **Search Enhancement**:
   - When user searches, results prioritize matching colors
   - Filter by "Colors that suit me" option

---

## 🔍 Search & Filter System

### Search Functionality
```typescript
const handleSearch = async (query: string) => {
  // Scrapes products based on query
  const products = await scrapeProducts(query);
  
  // Personalizes results
  const recommended = await getPersonalizedRecommendations(
    userId, 
    products
  );
  
  // Returns ranked by match score
  return recommended;
}
```

### Available Filters
- **Brands**: Filter by specific fashion brands
- **Colors**: Show only complementary colors
- **Price Range**: Filter by budget
- **Style**: Filter by preferred styles
- **Gender**: Male/Female/Unisex

All filters work WITH the recommendation algorithm, not against it.

---

## 📈 Future Enhancements

### ML-Based Recommendation (recommendation.ipynb)
The notebook provides a foundation for:
- **Vector Embeddings**: Product similarity matching
- **Collaborative Filtering**: "Users like you also liked..."
- **Image-based Matching**: Find similar looking products
- **Trend Analysis**: Identify emerging fashion trends

### Integration Plan
1. Train model on swipe history
2. Generate product embeddings
3. Use for "Similar Products" feature
4. Enhance homepage recommendations

---

## 💡 Key Features Summary

### ✅ Completed Features

1. **Three-Layer System**:
   - ✓ Computer Vision (Color Analysis)
   - ✓ User Input Collection (Sizes, Styles)
   - ✓ Swipe Feature (Tinder-like)

2. **Personalization**:
   - ✓ Color-based matching
   - ✓ Preference learning from swipes
   - ✓ Multi-factor recommendation scoring

3. **Homepage**:
   - ✓ Personalized product feed
   - ✓ User style profile display
   - ✓ Recently liked products
   - ✓ Search with personalization
   - ✓ Advanced filters

4. **User Experience**:
   - ✓ Smooth animations (Framer Motion)
   - ✓ Intuitive swipe gestures
   - ✓ Beautiful UI design
   - ✓ Responsive layout

---

## 🛠️ Troubleshooting

### Backend Issues

**Port already in use**:
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9  # macOS/Linux
netstat -ano | findstr :5000   # Windows
```

**Missing dependencies**:
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### Frontend Issues

**Framer Motion errors**:
```bash
npm install framer-motion@latest
```

**CORS errors**:
- Ensure backend CORS is enabled in `main.py`
- Check backend is running on correct port

---

## 👥 User ID Management

The system uses localStorage to persist user identity:
```typescript
const userId = localStorage.getItem('userId') || `user_${Date.now()}`;
localStorage.setItem('userId', userId);
```

For production, integrate with proper authentication system.

---

## 📝 Notes

- **Data Storage**: Currently uses JSON files in `Backend/user_data/`
- **Scalability**: For production, migrate to PostgreSQL/MongoDB
- **Image Storage**: Product images are linked, not stored
- **Real-time**: All updates are immediate (no caching yet)

---

## 🎉 Getting Started

1. **Start Backend**:
   ```bash
   cd Backend
   python main.py
   ```

2. **Start Frontend**:
   ```bash
   cd Frontend/TUFF-frontend
   npm run dev
   ```

3. **Open App**:
   - Navigate to `http://localhost:5173`
   - Start with color analysis
   - Complete profile setup
   - Start swiping!

---

## 📞 Support

For issues or questions about the implementation, check:
- Backend logs in terminal
- Browser console for frontend errors
- Network tab for API call failures

---

**Developed with ❤️ for TUFF Fashion App**
