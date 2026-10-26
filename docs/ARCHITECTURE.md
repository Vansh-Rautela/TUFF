# Architecture

TUFF is a two-process app: a React single-page app and a Flask JSON API, both run locally. There is no hosted infrastructure, queue, or database server.

```
Browser (React SPA, Vite :8080)
   │  fetch via src/lib/api.ts  (base URL = VITE_API_BASE_URL)
   ▼
Flask API (Backend/main.py :5000)
   ├── validation.py        input checks (user ids, image data URLs)
   ├── facial_color_analyzer.py ──► MediaPipe (or OpenCV Haar fallback)
   │        └── color_palettes.py   seasonal palettes (rules)
   ├── catalog.py           query building, scraper orchestration, normalization, cache
   │        └── Webscraping/*.py ──► headless Chrome ──► retailer websites
   ├── recommender.py       0-100 match score + reasons
   ├── user_preferences.py  per-user JSON files in user_data/
   └── tuffy_advisor.py     ──► Google Gemini (google-genai), optional
```

## Frontend (`Frontend/TUFF-frontend`)

| Route | Page | Purpose |
|---|---|---|
| `/` | `Index` | Landing page. "Get Started" / "Sign In" both go to `/swipe`. `/?signin=1` opens the sign-up modal chain. |
| `/swipe` | `SwipePage` | Onboarding (color → sizes/gender → styles/budget), then the swipe deck. Resumes where the user left off. |
| `/home` | `PersonalizedHomepage` | Style profile, ranked recommendations, search, brand filter, recently liked, TUFFY chat. |
| `/liked` (`/wishlist` redirects) | `SavedPage` | Liked products with remove. |
| `/product-suggestions` | `ProductSuggestPage` | Grid with brand/price/style filters and search (end of the sign-up chain). |
| `/color-analysis` | `ColorAnalysis` | Standalone upload/webcam analysis with full palette view. |
| `/services`, `/how-it-works` | static | Marketing. |

Shared code:

- `src/lib/api.ts` — the only place that talks to the backend; typed helpers; `ApiError` carries the server's message.
- `src/lib/session.ts` — anonymous user id + local profile cache (localStorage). Keys are listed in `STORAGE_KEYS`.
- `src/lib/image.ts` — validates and downsizes photos to ≤1280 px before upload.
- `src/types/fashion.ts` — API shapes.
- `src/components/ProductImage.tsx` — product photo with lazy loading and a local fallback.
- `SignUpUserContext` — in-memory state for the sign-up modal chain only.

State lives in component state plus localStorage; `@tanstack/react-query` is installed and wrapped around the app but not used for data fetching.

## Backend (`Backend`)

| Endpoint | Purpose |
|---|---|
| `GET /health` | Liveness, detector in use, whether TUFFY is configured, loaded scrapers. |
| `POST /analyze` | `{image: dataURL}` → skin tone, season, palette. 400 bad input, 422 no face, 503 detector unavailable. |
| `POST /scrape_products` | `{userData:{userId,gender,brands}, filters:{brands,prices,styles}, prompt}` → `{products, query, brands, errors}`. |
| `POST /personalized_recommendations` | `{userId, products, excludeSwiped}` → ranked products with `match_score`, `match_reasons`. |
| `POST /swipe_action` | Record like/dislike. |
| `POST /update_user_info` | Partial profile update (typed fields only). |
| `GET /user_preferences/<id>`, `/user_analysis/<id>`, `/homepage_feed/<id>` | Profile reads. |
| `GET /liked_products/<id>`, `POST /liked_products/<id>/remove` | Saved items. |
| `POST /tuffy/chat`, `/tuffy/show_products`, `/tuffy/style_tip`, `/tuffy/analyze_outfit` | AI stylist. |

All errors are JSON `{success: false, error}`; unexpected exceptions are logged and return a generic message.

### Request flow: "show me products"

1. UI calls `api.searchProducts` with gender, brands, filters and the typed search text only.
2. `catalog.build_search_query` → e.g. `women olive kurta casual` (no profile data).
3. `ProductSearch.search` returns cached results (15 min TTL) or runs brand scrapers on a 3-thread pool with a 90 s budget; late scrapers still fill the cache.
4. Rows are normalized (`normalize_product`: real http link, title, numeric price, color/category/gender from the title) and de-duplicated.
5. Gender filter (whole words) and price filter; results interleaved across brands, capped at 50.
6. UI calls `api.rankProducts`; `recommender.rank_products` scores each product against palette, swipe history, budget and styles.

### Color analysis

`validation.decode_image_data_url` decodes in memory and downsizes → MediaPipe face detection (short then full range) and Face Mesh landmarks → sample skin pixels → median/outlier removal → average RGB → undertone by hue/ratios → season by undertone + brightness → `color_palettes.get_season_palette`. If MediaPipe is not importable, OpenCV's Haar cascade finds the face and region-based sampling is used. The result includes `method` and a `disclaimer`; it is a heuristic estimate, not a calibrated measurement.

### TUFFY

`tuffy_advisor.TuffyStyleAdvisor` keeps one Gemini chat per user id (LRU, max 500, in memory) with the persona + user profile as the system instruction. 30 s timeout, 2 attempts. Without `GEMINI_API_KEY`, chat endpoints return 503 and the style tip falls back to palette rules.

## Configuration

Backend: environment variables read in `Backend/config.py` (template in `Backend/.env.example`). Frontend: `VITE_API_BASE_URL` (`Frontend/TUFF-frontend/.env.example`).

## Not wired in (kept for future use)

`hybrid_fetcher.py` + `api_integrations_india.py` (RapidAPI/SerpApi/Apify/PA-API), `api_integrations.py`, `product_cache.py` (SQLite), `Webscraping/app.py` (Streamlit demo), `recommendation.ipynb`. None of these run in the app.

## Design choices and trade-offs

- **Stayed with Flask + JSON files.** Fine for a single-machine demo; see `DATABASE_AUDIT.md` for when to move to SQLite/Postgres.
- **Threads, not a job queue,** for scraping. A queue (Celery/RQ + Redis) would only pay off with multiple server processes or many concurrent users.
- **In-memory cache,** not Redis — lost on restart, per-process. Acceptable at this stage.
- **Rules, not a learned model,** for ranking: transparent, testable, and there is not enough interaction data to train anything.
