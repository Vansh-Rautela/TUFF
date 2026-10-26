# TUFF — AI Fashion Finder 👗✨

TUFF is a personal styling app for Indian fashion shoppers. It estimates your seasonal color palette from a selfie, learns your taste from Tinder-style swipes, and ranks real products from Amazon, Flipkart, Myntra and 12 other stores — explaining *why* each one fits you. TUFFY, an optional Gemini-powered stylist, answers style questions in chat.

**How it works**

1. **Color analysis** — face detection (MediaPipe, OpenCV fallback) → skin-tone sampling → undertone and season (Spring/Summer/Autumn/Winter) → a palette of colors, neutrals, accents and jewelry metals. It's a heuristic estimate; lighting affects it.
2. **Profile** — gender, body type, sizes, styles, occasions and budget.
3. **Search** — headless-Chrome scrapers query the selected stores in parallel (cached for 15 min). Only gender, one style and your typed search go to the stores.
4. **Ranking** — each product gets a 0–100 match score from your palette, liked colors/brands/categories, budget and styles, with reasons like "Olive is in your Autumn palette".
5. **Swipe** — likes and passes refine the ranking; liked items appear under **Saved**.

## Quick start

Requirements: **Python 3.12** (3.10–3.12; mediapipe has no 3.13+ wheels), **Node 20+**, and **Chrome or Chromium** for product search.

```bash
# 1. Backend
cd Backend
python3.12 -m venv .venv            # or: uv venv --python 3.12 .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env                 # optional: add GEMINI_API_KEY for TUFFY
.venv/bin/python main.py             # http://127.0.0.1:5000  (check /health)

# 2. Frontend (new terminal)
cd Frontend/TUFF-frontend
npm ci
npm run dev                          # http://localhost:8080
```

Open http://localhost:8080 and click **Get Started**.

If Selenium can't find your browser (common with Chromium on Linux), set in `Backend/.env`:

```
CHROME_BINARY=/usr/bin/chromium
CHROMEDRIVER_PATH=/usr/bin/chromedriver
```

If the backend isn't on `localhost:5000`, copy `Frontend/TUFF-frontend/.env.example` to `.env` and set `VITE_API_BASE_URL`.

## Configuration

| Variable | Default | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | — | Enables TUFFY chat. Without it, chat returns a friendly "not configured" message. |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Gemini model id. |
| `TUFF_PORT` / `TUFF_HOST` | `5000` / `127.0.0.1` | Where the API listens. |
| `TUFF_DEBUG` | `false` | Flask debug. Never enable on a reachable machine. |
| `TUFF_CORS_ORIGINS` | localhost:8080, :5173 | Allowed frontend origins. |
| `TUFF_DATA_DIR` | `user_data` | Where per-user JSON profiles are stored. |
| `TUFF_SCRAPER_WORKERS` / `TUFF_SCRAPER_TIMEOUT_SECONDS` | `3` / `90` | Parallel scrapers and time budget per search. |
| `CHROME_BINARY`, `CHROMEDRIVER_PATH` | auto | Browser location for Selenium. |

The full list with comments is in `Backend/.env.example`. No database setup or migrations are needed: profiles are JSON files (see `docs/DATABASE_AUDIT.md`).

## Tests

```bash
cd Backend && .venv/bin/pip install -r requirements-dev.txt && .venv/bin/python -m pytest -q
cd Frontend/TUFF-frontend && npm run lint && npm run typecheck && npm test && npm run build
```

Backend: 99 tests (scrapers and Gemini are faked; one test runs the real face pipeline on a stock photo). Frontend: 22 unit tests. CI runs both (`.github/workflows/ci.yml`). Details in `docs/TESTING.md`.

## Project layout

```
Backend/
  main.py                  Flask routes
  config.py                environment settings
  validation.py            input validation
  catalog.py               search query, scraper orchestration, product normalization
  recommender.py           match score + reasons
  user_preferences.py      profile & swipe storage (JSON files)
  facial_color_analyzer.py skin tone / season
  color_palettes.py        seasonal palettes
  tuffy_advisor.py         Gemini stylist
  Webscraping/             per-store Selenium scrapers
  tests/                   pytest suite
Frontend/TUFF-frontend/src/
  pages/                   routes (SwipePage, PersonalizedHomepage, SavedPage, ...)
  components/              UI (swipe cards, modals, TUFFY chat, shadcn/ui)
  lib/api.ts               backend client
  lib/session.ts           anonymous id + local profile cache
docs/                      audit, architecture, security, database, testing, roadmap
```

## Known limitations

- **No accounts.** Your profile is tied to a random id stored in your browser; anyone with the id could read it. Don't deploy publicly as-is.
- **Scraping is fragile.** Store markup changes break scrapers (two had silently broken before this audit), and stores may block heavy use.
- **Color analysis is an estimate.** Lighting, filters and makeup shift results.
- **Single process.** Profile writes are locked per process; run one backend process.

See `docs/IMPLEMENTATION_ROADMAP.md` for what's next and `docs/PROJECT_AUDIT.md` for the full audit. Older development notes are in `docs/legacy/` (historical, unverified).
