# Project Audit — TUFF

> This is the October 2026 audit of the v1 codebase (Flask + JSON files). Most findings were fixed on `audit/mvp-hardening` and the system was then rebuilt as v2 (`tuff-v2`); see `ARCHITECTURE.md`.

Audit date: 2026-10-26/27. Baseline: GitHub `main` @ `ad9bba6` (the local copy was byte-identical; it had no `.git`, so history was re-attached and work happens on branch `audit/mvp-hardening`).

Legend for evidence: **Confirmed** = reproduced or observed by running code; **Code-read** = certain from reading the code but not executed; **Suspected** = plausible, not verified.

## 1. What the project actually is

| Part | Reality |
|---|---|
| Frontend | Vite 5 + React 18 + TypeScript + Tailwind + shadcn/ui (`Frontend/TUFF-frontend`). 9 routes, no auth. |
| Backend | Single Flask app (`Backend/main.py`), 15 routes. Runs locally on port 5000. |
| "Database" | One JSON file per user in `Backend/user_data/`. A SQLite product cache module exists but was never used. No migrations, no ORM. |
| Product data | Live Selenium scraping of 15 Indian retailers per request (headless Chrome). No catalog of its own. |
| AI/ML | (1) Skin-tone estimation: MediaPipe face detection + pixel sampling + hand-written rules → season + palette. (2) TUFFY chat: Google Gemini. (3) Ranking: hand-weighted rules over swipe history. No trained models. |
| Unused code | `hybrid_fetcher.py`, `api_integrations*.py` (RapidAPI/SerpApi/Amazon PA-API), `product_cache.py`, `Webscraping/app.py` (Streamlit), `recommendation.ipynb` (LangChain/Groq experiment). |
| Tests/CI | None. The `Backend/test_*.py` files are manual scripts that call live paid APIs. |

## 2. Baseline (before any change)

| Check | Result |
|---|---|
| `npm ci` | OK |
| `eslint .` | **29 errors**, 12 warnings |
| `tsc -p tsconfig.app.json` | **1 error** (`window.__TUFF_ONBOARDING__`) |
| `vite build` | OK (659 kB JS) |
| Backend install (`pip install -r requirements.txt`) | Installs, but **missing** pandas, google-generativeai, python-dotenv, selenium, bs4 (imported but undeclared); declares unused scipy/scikit-learn |
| Backend `POST /analyze` (fresh install) | **503 always** — mediapipe 1.1.1 removed `mp.solutions` |
| Backend `POST /analyze` with `null` body | **500** (TypeError) |
| Backend tests | none |

## 3. Findings (prioritized)

### P0 — Critical

| # | Finding | Evidence | Status |
|---|---|---|---|
| P0-1 | **Groq API key hardcoded** in `recommendation.ipynb`, committed to the public GitHub repo. | Confirmed | Removed from the working tree (now `GROQ_API_KEY` env var). **Still in public git history → owner must revoke the key.** |
| P0-2 | **Color analysis broken on every fresh install**: unpinned `mediapipe` resolves to a release without `mp.solutions`; onboarding step 1 always 503. | Confirmed | Fixed: pinned `mediapipe==0.10.21` + OpenCV Haar fallback detector. |
| P0-3 | **Path traversal via `userId`**: ids went straight into `os.path.join(storage, f"{id}.json")`; `../../x` reads/writes arbitrary `.json` files. | Code-read (and covered by tests now) | Fixed: strict id pattern at the storage boundary and on every route. |

### P1 — High

| # | Finding | Evidence | Status |
|---|---|---|---|
| P1-1 | **Personal data sent to retailers**: the product page sent a profile dump (name, date of birth, username, color JSON) as the search prompt; the backend copied its words into Amazon/Flipkart/Myntra URLs. | Code-read | Fixed in both frontend (only typed search text is sent) and backend (multi-line/long prompts ignored). |
| P1-2 | **Gender chosen in onboarding ignored**: swipe flow hardcoded `'Male'`; the sizes step never saved the selection. Women got men's products and men's-only filtering. | Code-read, verified fixed in browser | Fixed. |
| P1-3 | **Gender filter substring bug**: `'men' in "women's kurta"` → women's items passed the men's filter. | Confirmed (test) | Fixed (whole-word matching). |
| P1-4 | **/color-analysis page crashed after every successful analysis** (UI read `result.palette.*`, API never returned it). | Code-read, verified fixed in browser | Fixed: API returns a seasonal palette; UI merges defaults. |
| P1-5 | **Amazon titles were brand names** ("GoSriKi"), **Flipkart prices all missing** (selector drift). | Confirmed against live pages | Fixed and re-verified live (17/17 titles and prices). |
| P1-6 | Uploaded selfies **leaked to disk** on the 503 path (`uploads/temp_*.png` never deleted). | Confirmed | Fixed: images decoded in memory, never written. |
| P1-7 | Werkzeug **debug mode always on** (`app.run(debug=True)`): remote code execution if the port is exposed. | Code-read | Fixed: `TUFF_DEBUG` env, default off, bind 127.0.0.1. |
| P1-8 | **Broken navigation**: `/ask-tuff`, `/wishlist`, `/profile`, `/liked` all 404. "Swipe More" button did nothing (users stuck after 10 swipes). | Code-read | Fixed; new Saved page at `/liked`. |
| P1-9 | **Gemini SDK end-of-life** (`google-generativeai` support ended); TUFFY crashed the import of `main.py` if the package was absent. | Confirmed (runtime warning) | Migrated to `google-genai`; TUFFY optional (503 when unconfigured). |

### P2 — Medium

| # | Finding | Status |
|---|---|---|
| P2-1 | Recommendation "score" was an unbounded point sum shown as "%", using fields scrapers never populate (color/style/category) — effectively brand + gender only. | Fixed: `recommender.py`, 0–100 score + reasons, colors/categories extracted from titles, budget/style used, disliked items hidden. |
| P2-2 | Scrapers run sequentially per request (~3 headless Chromes back-to-back), no cache, no timeout; Amazon scraper leaked a Chrome process on any exception. | Fixed: concurrent with a time budget, 15-min TTL cache, in-flight dedupe, page-load timeout, `try/finally`. Live: ~5 s cold, 6 ms cached. |
| P2-3 | Scraper rows with `NaN`/"No title"/`#` links reached the UI; `NaN` produces invalid JSON. | Fixed (normalization). |
| P2-4 | Preferences submit loaded products **twice** (onSubmit + onClose). | Fixed, verified (1 search in server log). |
| P2-5 | Stale-state bugs: feed recommendations used `colorAnalysis`/`selectedBrands` from a stale closure; TUFFY received the styles array as `gender`. | Fixed. |
| P2-6 | TUFFY chat product cards had no images (`image` vs `thumbnail`). | Fixed. |
| P2-7 | Errors returned `str(e)` to clients; inconsistent error shapes; HTML 404/413/500 pages. | Fixed: JSON handlers, generic 500 message, logged server-side. |
| P2-8 | Hardcoded `http://localhost:5000` in 18 places. | Fixed: `VITE_API_BASE_URL` + `src/lib/api.ts`. |
| P2-9 | Price/style filters on the product page were ignored by the backend. | Fixed. |
| P2-10 | CORS open to all origins. | Fixed: configurable allow-list. |
| P2-11 | Concurrent requests could corrupt a user file (non-atomic read-modify-write); unknown keys in a file crashed loading. | Fixed: lock + atomic replace + tolerant load. |
| P2-12 | MediaPipe detector swapped (and leaked) on each miss; analyzer not thread-safe. | Fixed. |
| P2-13 | No authentication: anyone with a user id can read/modify that profile. | **Open** (see roadmap). Ids are now random UUIDs instead of timestamps. |
| P2-14 | Scrapers depend on retailer HTML and likely violate retailer ToS at scale. | **Open** — product/legal decision (see roadmap). |

### P3 — Low

| # | Finding | Status |
|---|---|---|
| P3-1 | Broken placeholder images (`/placeholder-product.jpg` missing, `via.placeholder.com` dead). | Fixed: `ProductImage` with local fallback. |
| P3-2 | Lint 29 errors / typecheck 1 error. | Fixed: 0 errors (8 shadcn fast-refresh warnings remain). |
| P3-3 | 15 overlapping status docs at the repo root, several inaccurate. | Moved to `docs/legacy/`. |
| P3-4 | `Webscraping/learnning_scraping _amazon.ipynb` stores raw Amazon page HTML (incl. a session hash) in outputs. | Open: clear outputs. |
| P3-5 | Seven copy-pasted `get_driver()` variants; `clean_price` defined twice in `scrapers.py`. | Partly: shared `driver.make_chrome`; duplicates left (low value, high churn). |
| P3-6 | 634 kB JS bundle, ~17 MB of images/videos in `src/assets`. | Open. |
| P3-7 | Sign-in modal is a mock (Gmail/Phone buttons just open the sign-up flow). | Open — honest labelling or real auth needed. |

## 4. Feature inventory

Status after this work. "Verified" means exercised end-to-end in a browser against the real backend on 2026-10-27 unless noted.

| Feature | Frontend | Backend | Storage / external | Status | Tests |
|---|---|---|---|---|---|
| Landing page | `/` (`Index`) | — | — | Working (static) | — |
| Onboarding: photo color analysis | `/swipe` → `ColorAnalysisModal` | `POST /analyze` | MediaPipe/OpenCV, in-memory | **Working, verified** | API + real-photo integration test |
| Onboarding: sizes, gender, body type | `UserSizeModal` | `POST /update_user_info` | `user_data/<id>.json` | **Working, verified** (gender persisted) | API tests |
| Onboarding: styles, occasions, budget | `StylePreferencesModal` | `POST /update_user_info` | JSON file | **Working, verified** | API tests |
| Product search | `/swipe`, `/home`, `/product-suggestions` | `POST /scrape_products` | Selenium → Amazon/Flipkart/Myntra (+12 others) | **Working, verified live** for Amazon/Flipkart/Myntra; other 12 scrapers load but were not exercised | Unit + API (scrapers faked) |
| Ranking & explanations | swipe cards, feed cards | `POST /personalized_recommendations` | JSON file | **Working, verified** | Unit + API |
| Swipe like/pass | `SwipeInterface` | `POST /swipe_action` | JSON file | **Working, verified** | API |
| Saved items (favorites) | `/liked` (new) | `GET /liked_products/<id>`, `POST .../remove` (new) | JSON file | **Working, verified** (list + remove) | API |
| Personalized feed | `/home` | `GET /homepage_feed/<id>` | JSON file | **Working, verified** | API |
| Brand filter | `BrandFilterModal` | `/scrape_products` | — | Implemented, not browser-verified | API |
| Standalone color analysis page | `/color-analysis` | `POST /analyze` | — | **Working, verified** (was crashing) | — |
| TUFFY chat | floating button on `/home` | `POST /tuffy/chat` | Gemini | **Blocked by credentials** — without `GEMINI_API_KEY` returns a clear 503 message (verified); with a key: implemented, unverified | Unit (faked client) |
| TUFFY products in chat | `TuffyChat` brand buttons | `POST /tuffy/show_products` | Selenium | Implemented, unit-tested; not browser-verified | API |
| TUFFY style tip / outfit check | not used by UI | `/tuffy/style_tip`, `/tuffy/analyze_outfit` | Gemini, rules fallback | Implemented; tip has rule-based fallback | API |
| Sign-up modal chain (DOB→…→color) | `/?signin=1` | `/analyze`, `/update_user_info` | Context + JSON | Implemented, **not browser-verified**; reachable only via URL param | — |
| Sign in / accounts | `SignInModal` | — | — | **Mocked** (no auth exists) | — |
| Cart / wishlist in chat | `useTuffyCart` | — | localStorage only | Partially implemented (no cart page) | — |
| Pricing, FAQ, testimonials | landing | — | — | Static marketing content | — |
| Retail APIs (RapidAPI, SerpApi, PA-API), product cache, hybrid fetcher | — | not routed | — | **Not wired in** | — |
