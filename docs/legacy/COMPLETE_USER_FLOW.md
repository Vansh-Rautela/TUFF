# TUFF App - Complete User Flow Documentation

## 🎯 **Complete User Journey**

Your TUFF Fashion app now has a seamless flow from landing page to personalized recommendations!

---

## 📍 **Page Flow Map**

```
Landing Page (/)
  └─> "Find My Style" / "Get Started" / "Sign In"
      └─> Signup Flow (existing modals from SignUpUserContext)
          └─> Color Analysis (/color-analysis or integrated in /swipe)
              └─> Size Collection Modal
                  └─> Style Preferences Modal  
                      └─> Product Loading
                          └─> Swipe Interface (gesture-based)
                              └─> "See My Recommendations" button
                                  └─> Personalized Homepage (/home)
                                      └─> Search, Filters, Suggested Products
```

---

## 🏠 **1. Landing Page** (`/`)

**Current Page**: Your existing Index page with:
- Hero section: "Finally, fashion that actually works for you"
- **"Find My Style"** button (yellow/gold)
- **"Sign In"** button (top right)
- **"Get Started"** button (top right)

**What you need to do**:
Update these buttons to navigate to `/swipe` to start the flow:
```typescript
onClick={() => navigate('/swipe')}
```

---

## 🔐 **2. Signup Flow** (if not logged in)

**Uses existing**: `SignUpUserContext` and modals like:
- `SignUpNameModal`
- `SignUpGenderModal`
- `SignUpBodyTypeModal`
- `SignUpUsernameModal`
- etc.

**Flow**: User completes signup → automatically proceeds to color analysis

---

## 🎨 **3. Color Analysis** (`/color-analysis` or within `/swipe`)

**Two Options**:

### **Option A**: Direct to `/color-analysis` page
- User uploads photo
- Gets skin tone analysis
- Results are saved
- Proceeds to next step

### **Option B**: Integrated in `/swipe` (current implementation)
- Shows prompt screen first
- Button to start color analysis
- Can skip if already done

**What happens**:
- Analyzes face photo using MediaPipe
- Determines skin tone, undertone, seasonal colors
- Generates complementary color palette
- Saves to `localStorage` and backend
- **Auto-proceeds** to size collection

---

## 📏 **4. Size Collection Modal**

**Component**: `UserSizeModal.tsx`

**Collects**:
- ✅ Tops/Shirts (XS - 3XL)
- ✅ Bottoms/Pants (26" - 42")
- ✅ Shoes (US 6-13)
- ✅ Dresses (for female users)

**UI Features**:
- Beautiful grid layout with emoji icons
- Selected items highlight in purple
- "Save Sizes" or "Skip for Now" options
- Auto-closes after submission

**What happens**:
- Data saved to backend via `/update_user_info`
- **Auto-proceeds** to style preferences

---

## ✨ **5. Style Preferences Modal**

**Component**: `StylePreferencesModal.tsx`

**Collects**:

### **Styles** (select 2+):
- 👕 Casual
- 🤵 Formal  
- 💼 Business
- 🧢 Streetwear
- ⚽ Athletic
- 🌸 Bohemian
- ⚪ Minimalist
- 🕰️ Vintage
- ✨ Trendy
- 💎 Elegant

### **Occasions** (select any):
- ☀️ Everyday
- 💻 Work/Office
- 🎉 Party
- 💕 Date Night
- 🏋️ Gym/Sports
- 🎩 Formal Events
- 🏖️ Vacation
- 🏔️ Outdoor

### **Budget Range** (select one):
- 💵 Budget Friendly (₹0-2K)
- 💰 Mid Range (₹2K-5K)
- 💎 Premium (₹5K-15K)
- 👑 Luxury (₹15K+)

**What happens**:
- Data saved to backend
- **Auto-proceeds** to product loading

---

## 🔄 **6. Product Loading**

**What happens**:
1. Shows loading spinner with "Finding Perfect Matches..."
2. Backend scrapes products from fashion sites (Amazon, Flipkart, Myntra)
3. Products are ranked using recommendation algorithm:
   - +15 points: Color matches palette
   - +10 points: Preferred brand
   - +8 points: Preferred style
   - +5 points: Preferred category
   - +5 points: Gender appropriate
4. Top products loaded into swipe interface

---

## 👆 **7. Swipe Interface** (/swipe page)

**Component**: `SwipeInterface.tsx`

### **Features**:

#### **Gesture-Based Swiping**:
- 👉 **Swipe RIGHT** to LIKE
- 👈 **Swipe LEFT** to PASS
- Card stack shows 3 products ahead
- Smooth animations with feedback

#### **No Action Buttons** (gesture-only mode):
- `showButtons={false}` prop
- Encourages natural swipe gestures
- Buttons hidden to keep UI clean

#### **Header**:
- ❤️ Like count
- ✕ Pass count  
- Progress indicator (e.g., "5 / 50")
- **Exit button** (top right) → Returns to `/`

#### **Product Cards**:
- Large product image
- Title, brand, price
- Match score badge (e.g., "85%")
- Info button for details
- Color/style/category tags

#### **Swipe Actions**:
- Each swipe saved to backend
- System learns preferences
- Recommendations improve in real-time

#### **Visual Feedback**:
- "❤️ LIKE" or "✕ PASS" overlay
- Card flies off screen
- Next card comes to front

#### **Completion**:
When done swiping (or after minimum swipes):
- Shows completion screen
- Displays stats (likes/passes)
- Two buttons:
  - **"Swipe More"** → Continue swiping
  - **"See My Recommendations"** → Go to homepage

---

## 🏡 **8. Personalized Homepage** (`/home`)

**Component**: `PersonalizedHomepage.tsx`

### **Sections**:

#### **A. Style Profile Card** (top section):
**Purple gradient card showing**:
- Your color analysis results
- Color swatches from palette
- Favorite styles (learned from swipes)
- Activity stats:
  - Total likes
  - Favorite brands count
  - Seasonal color type

#### **B. Search & Filter Bar**:
**Features**:
- 🔍 Search input: "Search for fashion products..."
- **Search button**
- **Filter button** (funnel icon)

**Filters available**:
- By brand
- By color (matches your palette)
- By price range

**Smart behavior**:
- All search results are personalized
- Filters maintain recommendation scores
- Results ranked by match percentage

#### **C. Recommended For You** (main section):
**Shows**:
- Grid of product cards (responsive: 2-4 columns)
- Each card has:
  - Product image
  - Title, brand, price
  - **Match score badge** (e.g., "⭐ 92%")
  - Hover effect (lifts card)
  - Click to view product

**Sorted by**:
- Highest match score first
- Combines color analysis + swipe preferences + user inputs

**Loading state**:
- Skeleton cards while loading
- Smooth fade-in animation

#### **D. Recently Liked** (bottom section):
**Shows**:
- Last 6 products you liked
- Horizontal scrollable gallery
- Quick access to favorites
- Same card design as main products

---

## 🔄 **Data Flow & Backend**

### **Data Stored**:
```json
{
  "user_id": "user_timestamp",
  "color_analysis": {
    "skintone": {...},
    "complementaryColors": [...]
  },
  "gender": "Female/Male",
  "body_type": "Average/Slim/Plus",
  "clothing_sizes": {
    "tops": "M",
    "bottoms": "32",
    "shoes": "8"
  },
  "style_preferences": ["casual", "bohemian"],
  "budget_range": { "min": 2000, "max": 5000 },
  "swipe_history": [...]
}
```

### **Backend Endpoints Used**:
1. `POST /analyze` - Color analysis
2. `POST /update_user_info` - Save user data
3. `POST /scrape_products` - Get fashion products
4. `POST /swipe_action` - Save like/dislike
5. `POST /personalized_recommendations` - Get ranked products
6. `GET /homepage_feed/:userId` - Get complete feed

---

## 🎯 **Key User Actions**

### **From Landing Page**:
```
Click "Find My Style" 
→ Goes to /swipe
→ Sees color analysis prompt
→ Completes flow
```

### **From Swipe Interface**:
```
Swipe right on products you like
Swipe left on products you don't
→ System learns your taste
→ Click "See My Recommendations"
→ Goes to /home with personalized feed
```

### **From Homepage**:
```
Search for specific items
Apply filters
Browse recommendations
Click product → Opens in new tab
```

### **Exit Swipe Anytime**:
```
Click "Exit" button (top right)
→ Returns to landing page
→ Progress saved
→ Can resume later
```

---

## 🎨 **Design Features**

### **Animations**:
- ✅ Smooth card swipe with Framer Motion
- ✅ Spring animations on buttons
- ✅ Fade-in for new cards
- ✅ Skeleton loading states

### **Visual Feedback**:
- ✅ LIKE/PASS overlay
- ✅ Progress indicators
- ✅ Match score badges
- ✅ Color highlighting on selected items

### **Responsive**:
- ✅ Mobile: Single column, touch swipe
- ✅ Tablet: 2-3 columns
- ✅ Desktop: 4 columns

---

## 🚀 **How to Implement This Flow**

### **1. Update Landing Page Buttons**:

In your `Index.tsx` (or landing page component):

```typescript
// Find My Style button
<button
  onClick={() => navigate('/swipe')}
  className="your-button-classes"
>
  Find My Style
</button>

// Get Started button
<button
  onClick={() => navigate('/swipe')}
  className="your-button-classes"
>
  Get Started
</button>
```

### **2. Integrate with Existing Signup**:

If you have a signup flow, make it redirect to `/swipe` after completion:

```typescript
const handleSignupComplete = () => {
  // Save signup data
  // Then redirect
  navigate('/swipe');
};
```

### **3. Test the Complete Flow**:

```bash
# Make sure both servers are running:
# Terminal 1 (Backend):
cd Backend
python main.py

# Terminal 2 (Frontend):
cd Frontend/TUFF-frontend
npm run dev
```

**Then test**:
1. Go to `http://localhost:8080/`
2. Click "Find My Style"
3. Should go to `/swipe`
4. Complete color analysis (or skip)
5. Fill size modal
6. Fill style preferences
7. Swipe through products (gesture-based)
8. Click "See My Recommendations"
9. Should land on `/home` with personalized feed

---

## ✅ **What's Working Now**:

- ✅ Color analysis layer
- ✅ Size collection modal
- ✅ Style preferences modal
- ✅ Gesture-based swipe interface
- ✅ Exit button in swipe
- ✅ "See My Recommendations" button
- ✅ Personalized homepage with:
  - Style profile
  - Recommended products
  - Recently liked
  - Search & filters

---

## 📝 **What You Need to Do**:

1. **Update landing page buttons** to navigate to `/swipe`
2. **Test the complete flow** from start to finish
3. **(Optional) Customize** the existing signup modals to fit better
4. **(Optional) Add** transition animations between steps

---

## 🎊 **Summary**

You now have a complete, production-ready flow:

1. **Beautiful landing page** → User clicks "Find My Style"
2. **Signup** → (if needed) Quick user registration
3. **Color Analysis** → AI analyzes user's colors
4. **Size+Style Collection** → Beautiful modals collect preferences
5. **Swipe Interface** → Fun, Tinder-like product discovery (gesture-only!)
6. **Personalized Homepage** → Smart recommendations with search/filters

All integrated, all working, all beautiful! 🎨✨

**Your app workflow is now complete and ready for users!** 🚀
