# TUFF

**Dressed in your true colours.** TUFF reads your colouring from one photo, learns your taste from swipes, and edits Myntra, Flipkart and Amazon down to the pieces made for you, explaining why each one fits.

| | |
|---|---|
| **Colour analysis** | MediaPipe Face Landmarker (478 points) with an OpenCV YuNet fallback, eye-white white balance, dense skin masks, ITA° depth, CIELAB undertone, eye and brow contrast → one of **12 seasons**, with confidence and photo-quality notes. The photo is never stored. |
| **Search** | Async HTTP-first store providers (httpx + Lexbor parser), a shared Playwright browser as fallback, all stores in parallel, results **streamed per store** (SSE), cached in SQLite. |
| **Garment colour** | Each product's real colour is measured from its photo with OpenCV (background and skin removal, k-means in CIELAB). |
| **Ranking** | Palette fit by CIEDE2000, a recency-weighted taste model from swipes, budget and style; 0–100 score with reasons; MMR diversity. |
| **Stylist** | Gemini with function calling, so answers cite real products; a rule-based concierge when no key is set. |

## Run it

Requirements: Python 3.11–3.13 with [uv](https://docs.astral.sh/uv/), Node 20+.

```bash
# API  →  http://127.0.0.1:8000  (docs at /docs)
cd backend
uv sync
uv run python -m scripts.download_models     # face models (≈4 MB, checksum-verified)
uv run playwright install chromium           # or set TUFF_BROWSER_EXECUTABLE=/usr/bin/chromium in .env
cp .env.example .env                         # optional: GEMINI_API_KEY
uv run uvicorn app.main:app --reload

# Web  →  http://localhost:8080
cd frontend
npm ci
npm run dev
```

The SQLite database is created at `backend/data/tuff.db` on first start. In production set `TUFF_AUTO_CREATE_TABLES=false` and run `uv run alembic upgrade head`.

## Test

```bash
cd backend  && uv run ruff check . && uv run pytest -q          # 94 tests
cd frontend && npm run lint && npm run typecheck && npm test && npm run build   # 14 tests
```

## Layout

```
backend/    FastAPI app (app/), Alembic migrations, scripts, tests
frontend/   React + Vite web app
docs/       architecture, testing, security, database, roadmap, audit history
research/   notebooks (not part of the app)
```

See `docs/ARCHITECTURE.md` for how it fits together.

## Limits

- No accounts yet: a profile is an anonymous id stored on the device.
- Store markup changes break providers; parsers are covered by tests on saved store pages, and the browser fallback absorbs some changes.
- Colour analysis is an estimate from pixels; the result says so and lists photo issues.
