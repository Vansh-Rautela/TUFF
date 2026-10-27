# Architecture (v2)

```
Browser — React SPA (Vite, :8080)
  │  REST + Server-Sent Events, /api/v1
  ▼
FastAPI (Uvicorn, :8000)               app/main.py: middleware (request id, Server-Timing, GZip, CORS), errors
  ├── api/v1/          health · analysis · products · users · stylist      (thin routes, Pydantic schemas)
  ├── services/
  │   ├── color/       face_landmarks → white_balance → skin_tone_analyzer → seasonal_palettes
  │   │                garment_color, color_science (CIELAB, CIEDE2000, ITA), color_names
  │   ├── search/      search_engine → providers/{myntra, flipkart, amazon, legacy_selenium}
  │   │                http_client (httpx) · browser_pool (Playwright) · query_builder · product_attributes
  │   ├── recommendation/  taste_profile → ranker (palette fit, taste, budget, style, MMR) → personalization
  │   ├── stylist/     GeminiStylist (function calling) / ConciergeStylist
  │   └── container.py long-lived services, built once in the lifespan
  ├── repositories/    product_repository · user_repository
  └── db/              SQLAlchemy 2.0 async models, session (SQLite WAL) — migrations in backend/migrations
```

## Data model (SQLite)

| Table | Purpose |
|---|---|
| `users` | Anonymous id (`u_` + 128 random bits). |
| `profiles` | Gender, body type, sizes, styles, occasions, budget, season, full colour analysis (JSON). |
| `products` | Catalog built from searches: store, url (unique), title, brand, price, MRP, image, rating, category, gender, colour name/hex/source. |
| `interactions` | Every like/pass with timestamp (taste learning). |
| `saved_items` | Current wardrobe (user × product). |
| `search_results` | Cached store searches: (store, query) → ordered product ids. |

Deleting a user cascades to everything linked to it.

## Request flows

**Colour analysis** (`POST /analysis/face`, multipart): decode and downscale in memory → Face Landmarker (or YuNet box → landmarks on an upscaled crop → box only) → masks for skin, sclera, irises, brows → sclera-referenced white balance → filtered skin pixels → dominant k-means cluster → ITA°, hue angle, chroma, contrast → three axes (warmth, lightness, clarity) → scores for all 12 seasons → softmax confidence × photo quality. Runs in a worker thread; ~40–150 ms.

**Search** (`GET /products/search` or `/search/stream`): build query (gender, typed terms, one style; never profile data) → per store, in parallel: memory cache → SQLite cache → provider (HTTP, then browser) with a timeout → measure garment colours from photos within a time budget → upsert catalog (serialized writes) → personalize (gender filter, hide passed items, score, reasons, MMR). The stream endpoint sends a `store` event as each store finishes. Measured live: about 2.6 s cold for three stores including colour measurement of ~70 products; about 20 ms cached.

**Stylist** (`POST /stylist/chat`): Gemini receives the persona plus the profile as its system instruction and a `search_products` tool; tool calls run real searches that are ranked for the user. Any failure, or no API key, falls back to the concierge.

## Frontend

React Query for server state, a `UserProvider` that creates the anonymous profile on first need, `useProductStream` (EventSource) for live results, and optimistic saves. Routes are lazy-loaded. Design tokens live in `src/styles.css` and `tailwind.config.ts`.

## Choices and trade-offs

- **SQLite over Postgres:** a single file, zero ops, WAL for concurrent reads. SQLAlchemy and Alembic make moving to Postgres a URL change.
- **In-process cache and rate limiter over Redis:** correct for a single API process; swap both if the API scales horizontally.
- **HTTP-first scraping:** about 1 s per store versus 3–5 s for a Chrome launch; the browser is a fallback, and Selenium only serves the optional 12 legacy stores.
- **Rules over a trained model for ranking:** transparent, testable and explainable, with no labelled data required. Weights are documented in `ranker.py`.
