# TUFF Fashion App 👗✨

**AI-Powered Personal Fashion Stylist with Three-Layer Intelligence**

A sophisticated fashion recommendation system that combines computer vision, user preferences, and behavioral learning to provide truly personalized fashion suggestions.

![TUFF Architecture](See architectural diagram in artifacts)

---

## 🌟 What Makes TUFF Special?

TUFF uses a **unique three-layer approach** to understand your fashion needs:

### 🎨 **Layer 1: Computer Vision**
- Analyzes your skin tone using advanced color science
- Determines your undertone (Warm, Cool, Neutral)
- Identifies your seasonal color type (Spring, Summer, Autumn, Winter)
- Generates a personalized complementary color palette

### 📋 **Layer 2: Explicit Preferences**
- Collects your clothing sizes (tops, bottoms, shoes, dresses)
- Understands your style preferences (casual, formal, bohemian, etc.)
- Knows what occasions you shop for (work, party, everyday, etc.)
- Respects your budget range

### ❤️ **Layer 3: Behavioral Learning**
- Tinder-like swipe interface for products
- Learns from every like and pass
- Identifies your favorite brands, colors, and styles
- Improves recommendations with each interaction

---

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### Installation

**1. Backend Setup**
```bash
cd Backend
pip install -r requirements.txt
pip install pandas
python main.py
```

**2. Frontend Setup**
```bash
cd Frontend/TUFF-frontend
npm install
npm install framer-motion
npm run dev
```

**3. Open Browser**
```
http://localhost:5173
```

---

## 📚 Documentation

We've created comprehensive documentation to help you understand and use TUFF:

### 📖 **Start Here**
- **[QUICK_START.md](QUICK_START.md)** - Installation, setup, and first-time usage
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - Overview of all features

### 🔧 **Technical Details**
- **[THREE_LAYER_IMPLEMENTATION.md](THREE_LAYER_IMPLEMENTATION.md)** - Complete technical documentation
  - Architecture details
  - API reference
  - Data structures
  - Algorithm explanation

### ✅ **Testing**
- **[TESTING_CHECKLIST.md](TESTING_CHECKLIST.md)** - Step-by-step testing guide
  - Pre-flight checks
  - Layer-by-layer testing
  - Integration testing
  - Performance testing

---

## 🎯 Features

### ✨ Core Features

#### **Color Analysis**
- Upload your photo
- Get instant skin tone analysis
- Receive personalized color palette
- See colors that suit you best

#### **Personalized Onboarding**
- Beautiful modal interfaces
- Size collection (all clothing types)
- Style preference selection
- Budget range setting
- Smooth, guided experience

#### **Swipe to Discover**
- Tinder-style product cards
- Smooth drag-to-swipe gestures
- Like (❤️) or Pass (✕)
- Undo functionality
- Real-time statistics
- Product details on demand

#### **Smart Recommendations**
- Multi-factor scoring algorithm
- Match percentage (0-100%)
- Combines all three layers:
  - Color compatibility
  - Style preferences
  - Swipe history
- Improves with usage

#### **Personalized Homepage**
- **Style Profile**: Your color analysis and preferences
- **Recommended For You**: Top-scored products
- **Recently Liked**: Quick access to favorites
- **Smart Search**: Personalized search results
- **Advanced Filters**: By brand, color, price

---

## 🏗️ Architecture

### Backend (`/Backend`)

**Core Files:**
- `facial_color_analyzer.py` - Computer vision & color analysis
- `user_preferences.py` - Preference storage & learning
- `main.py` - Flask API server
- `Webscraping/` - Fashion site scrapers

**API Endpoints:**
- `POST /analyze` - Facial color analysis
- `POST /swipe_action` - Record swipe (like/dislike)
- `POST /update_user_info` - Save user preferences
- `GET /user_analysis/<id>` - Get preference analysis
- `POST /personalized_recommendations` - Get ranked products
- `GET /homepage_feed/<id>` - Get personalized feed

**Data Storage:**
- `user_data/<user_id>.json` - Per-user preferences and history

### Frontend (`/Frontend/TUFF-frontend/src`)

**Pages:**
- `ColorAnalysis.tsx` - Photo upload & analysis
- `SwipePage.tsx` - Swipe flow orchestration
- `PersonalizedHomepage.tsx` - Personalized product feed

**Components:**
- `SwipeCard.tsx` - Individual product card
- `SwipeInterface.tsx` - Card stack & swipe logic
- `UserSizeModal.tsx` - Size collection modal
- `StylePreferencesModal.tsx` - Style preferences modal

**Tech Stack:**
- React + TypeScript
- Vite (build tool)
- Tailwind CSS
- Framer Motion (animations)
- React Router (navigation)

---

## 🎨 How It Works

### The Recommendation Algorithm

Each product gets a **match score** based on:

```python
Score = 0

# Color matching (most important)
if product.color matches your_complementary_colors:
    Score += 15

# Brand preference
if product.brand in your_favorite_brands:
    Score += 10

# Style preference
if product.style in your_preferred_styles:
    Score += 8

# Category preference
if product.category in your_favorite_categories:
    Score += 5

# Gender appropriateness
if product.gender matches your_gender:
    Score += 5

# Convert to percentage: (Score / 43) * 100
```

### Learning Over Time

- **After 5 swipes**: Basic preferences emerge
- **After 20 swipes**: Clear patterns identified
- **After 50+ swipes**: Highly personalized results

---

## 📸 Screenshots & Demo

*(Check the architectural diagram in artifacts)*

The system flow:
1. **Upload photo** → Get color analysis
2. **Select sizes** → System knows your fit
3. **Choose styles** → Express preferences
4. **Swipe products** → Like what you love
5. **Get recommendations** → See perfect matches

---

## 🔍 Example Use Cases

### **Scenario 1: First-time User**
```
Sarah uploads her photo
→ Discovers she's a "Light, Cool, Summer" type
→ Selects sizes: M tops, 32 bottoms, 8 shoes
→ Chooses styles: Bohemian, Casual
→ Sets budget: ₹2,000 - ₹5,000
→ Swipes through 30 products (likes 12)
→ Homepage shows products in her colors
→ Match scores reflect her bohemian style
→ Products from liked brands ranked higher
```

### **Scenario 2: Returning User**
```
After 100 swipes, the system knows:
→ Favorite brands: Zara, H&M, Mango
→ Favorite colors: Coral, Peach, Soft Pink
→ Favorite styles: Bohemian dresses, Casual tops
→ Homepage shows 90%+ match products
→ All in her complementary colors
→ Budget-appropriate options only
→ Search results personalized
```

---

## 📊 Data & Privacy

### What We Store
- Color analysis results
- Clothing sizes
- Style preferences
- Swipe history (likes/dislikes)
- Product interactions

### How We Use It
- To personalize recommendations
- To improve match accuracy
- To remember your preferences
- To make shopping easier

### Storage
- Locally in `Backend/user_data/`
- One JSON file per user
- No cloud sync (privacy-first)

---

## 🛠️ Development

### Project Structure
```
TUFF-app/
├── Backend/
│   ├── facial_color_analyzer.py
│   ├── user_preferences.py
│   ├── main.py
│   ├── Webscraping/
│   └── user_data/
├── Frontend/TUFF-frontend/
│   └── src/
│       ├── pages/
│       ├── components/
│       └── ...
├── recommendation.ipynb
├── QUICK_START.md
├── IMPLEMENTATION_SUMMARY.md
├── THREE_LAYER_IMPLEMENTATION.md
├── TESTING_CHECKLIST.md
└── README.md (this file)
```

### Adding New Features

**New Fashion Site Scraper:**
1. Add scraper function in `Backend/Webscraping/`
2. Register in `main.py` → `_brand_to_scraper_map()`
3. Test with API endpoint

**New Recommendation Factor:**
1. Update scoring in `user_preferences.py` → `get_personalized_recommendations()`
2. Adjust point values
3. Test with sample data

**New UI Component:**
1. Create in `Frontend/src/components/`
2. Use Framer Motion for animations
3. Match existing purple/pink theme
4. Add to relevant page

---

## 🧪 Testing

Run through our comprehensive testing checklist:

```bash
# See TESTING_CHECKLIST.md for complete guide
```

**Quick Test:**
1. Start backend: `python Backend/main.py`
2. Start frontend: `cd Frontend/TUFF-frontend && npm run dev`
3. Navigate to `http://localhost:5173/color-analysis`
4. Upload a photo
5. Go to `/swipe` and complete flow
6. Check `/home` for personalized feed

---

## 🚧 Known Limitations

- **Web Scraping**: May break if retailer sites change
- **Color Analysis**: Requires good lighting and clear photos
- **Storage**: Currently JSON files (migrate to DB for production)
- **Authentication**: Uses localStorage (implement proper auth for production)
- **Real-time**: No live updates (refresh needed for changes)

---

## 🔮 Future Enhancements

### Planned Features
- [ ] Machine learning model for image-based matching
- [ ] Collaborative filtering ("Users like you also liked...")
- [ ] Social features (share looks, follow friends)
- [ ] Virtual try-on (AR integration)
- [ ] Style board creator
- [ ] Outfit generator
- [ ] Price drop alerts
- [ ] Wardrobe manager

### ML Integration
The `recommendation.ipynb` notebook provides foundation for:
- Product embedding vectors
- Similarity matching
- Trend prediction
- Advanced analytics

---

## 🤝 Contributing

This is a feature-complete implementation. To extend:

1. **Read the docs**: Start with IMPLEMENTATION_SUMMARY.md
2. **Understand the layers**: See THREE_LAYER_IMPLEMENTATION.md
3. **Test thoroughly**: Use TESTING_CHECKLIST.md
4. **Maintain style**: Follow existing patterns
5. **Document changes**: Update relevant markdown files

---

## 📝 Version History

**v1.0.0** (Current) - Three-Layer Implementation
- ✅ Computer vision color analysis
- ✅ User input collection modals
- ✅ Swipe feature with behavioral learning
- ✅ Personalized homepage
- ✅ Search and filter system
- ✅ Complete documentation

---

## 🎓 Learn More

### Color Science
- LAB color space for accurate matching
- Seasonal color analysis theory
- Undertone detection methods

### Recommendation Systems
- Multi-factor scoring algorithms
- Preference learning from implicit feedback
- Personalization techniques

### UI/UX Best Practices
- Swipe gesture patterns
- Modal design principles
- Progressive disclosure
- Micro-interactions

---

## 💬 Support

For questions about the implementation:

1. **Check Documentation**: Most answers in the docs
2. **Review Code Comments**: All files well-commented
3. **Test Checklist**: Systematic troubleshooting guide
4. **Browser Console**: Look for error messages
5. **Backend Logs**: Check terminal output

---

## 🎉 Credits

**Technologies Used:**
- **Backend**: Flask, OpenCV, MediaPipe, NumPy, Pandas
- **Frontend**: React, TypeScript, Tailwind CSS, Framer Motion
- **Build Tools**: Vite, npm
- **Color Science**: LAB color space, CIE2000

**Design Inspiration:**
- Tinder's swipe interface
- Modern fashion apps
- Material Design principles

---

## 📄 License

This is an educational/portfolio project demonstrating modern fashion recommendation techniques combining computer vision, user input, and behavioral learning.

---

## 📧 Contact

For implementation questions or customization requests, refer to the comprehensive documentation provided.

---

**Made with ❤️ for Fashion Lovers**

*Helping you discover your perfect style, one swipe at a time.*

---

## 🌈 Quick Links

- 📖 [Quick Start Guide](QUICK_START.md)
- 📊 [Implementation Summary](IMPLEMENTATION_SUMMARY.md)
- 🔧 [Technical Documentation](THREE_LAYER_IMPLEMENTATION.md)
- ✅ [Testing Checklist](TESTING_CHECKLIST.md)
- 🧠 [Recommendation Notebook](recommendation.ipynb)

---

**Ready to find your perfect style? Let's get started!** 🚀
