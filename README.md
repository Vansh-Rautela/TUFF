# TUFF

**Personal colour analysis and fashion discovery, from a single photo.**

TUFF works out a person's seasonal colouring from one selfie and learns their taste from swipes. It then searches Myntra, Flipkart and Amazon in parallel and ranks the results by how well each piece suits them, with a written reason for every recommendation.

![Python](https://img.shields.io/badge/Python-3.11–3.13-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![OpenCV](https://img.shields.io/badge/OpenCV-4.10-5C3EE8?logo=opencv&logoColor=white)

---

## Contents

- [Features](#features)
- [How it works](#how-it-works)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Configuration](#configuration)
- [API](#api)
- [Testing](#testing)
- [Project structure](#project-structure)
- [Documentation](#documentation)
- [Known limitations](#known-limitations)

## Features

| | |
|---|---|
| **Colour analysis** | Places the user in one of 12 seasons from one photo. Returns a confidence score, alternative seasons, a wearable palette and notes on photo quality. The photo is analysed in memory and is never stored. |
| **Live product search** | Searches Myntra, Flipkart and Amazon at the same time and streams results to the browser as each store responds. |
| **Garment colour detection** | Measures each product's actual colour from its photo instead of trusting the listing's colour name. |
| **Personalised ranking** | Scores each product from 0 to 100 on palette fit, learned taste, budget and style. Every score comes with a plain-language reason, and the list is diversified so one brand or colour cannot dominate it. |
| **Adaptive swipe deck** | Learns from each keep, love and pass, and mixes picks it is confident about with a few deliberate new directions. Supports undo, flip-for-details and a live taste panel. |
| **Complete the look** | Pairs saved pieces into outfits by colour harmony and suggests what to look for next. |
| **AI stylist** | Chat powered by Gemini with function calling, so answers point to real products. A rule-based concierge takes over when no API key is set. |

## How it works

### Colour analysis

```
photo ─► face landmarks ─► white balance ─► skin measurement ─► temperature ─► season (1 of 12)
         MediaPipe 478 pts   from the        L* and h* in CIELAB  warm / cool     with confidence
         (OpenCV YuNet       eye whites      (Thong & Xiang,      decided first   and alternatives
          fallback)                           ICCV 2023)
```

1. **Landmarks.** MediaPipe Face Landmarker locates 478 facial points. OpenCV's YuNet detector is used if MediaPipe finds no face.
2. **White balance.** The image is corrected against the whites of the eyes, so indoor lighting does not read as warm skin.
3. **Skin measurement.** Skin pixels from the cheeks and forehead are clustered with k-means. The darkest clusters (shadows, facial hair) are discarded, following *Beyond Skin Tone* (Thong & Xiang, ICCV 2023). Skin is described by perceptual lightness L\* and hue angle h\* rather than a single light-to-dark scale.
4. **Season.** Warm versus cool is decided first, then the season within that family. Published classifiers mostly make mistakes within the same temperature, so this ordering keeps errors small. Eye and brow contrast refine the result.

### Recommendations

- **Palette fit** is measured with CIEDE2000, the standard perceptual colour-difference formula, between a product's measured colour and the user's palette.
- **Colour harmony** between garments is judged in CIELAB. Neutrals, tone-on-tone and analogous pairs rank highest, and bold complementary pairs are treated with caution (Henry & Westland, 2007).
- **The swipe deck** uses Thompson sampling over colour-family and category arms. Before any swipes, the user's palette serves as the prior. Each swipe updates the model, with recent swipes counting more (21-day half-life).

The papers behind each method, and the thresholds that were set by inspection rather than taken from a paper, are listed in [docs/RESEARCH.md](docs/RESEARCH.md).

## Tech stack

| Layer | Technology |
|---|---|
| API | FastAPI, Uvicorn, Pydantic v2, pydantic-settings |
| Data | SQLAlchemy 2.0 (async), SQLite with WAL via aiosqlite, Alembic migrations |
| Search | httpx, selectolax (Lexbor parser), Playwright as a headless fallback, Server-Sent Events |
| Computer vision | OpenCV (contrib), MediaPipe Tasks, NumPy |
| Stylist | Google Gemini (`google-genai`) with function calling |
| Frontend | React 18, TypeScript (strict), Vite, Tailwind CSS, TanStack Query, Framer Motion |
| Tooling | uv, Ruff, pytest, ESLint, Vitest, GitHub Actions |

## Getting started

### Prerequisites

- Python 3.11 – 3.13 and [uv](https://docs.astral.sh/uv/)
- Node.js 20 or newer
- Chromium, used for the browser fallback (installed by Playwright, or an existing system install)

### Backend

```bash
cd backend
uv sync
uv run python -m scripts.download_models   # face models, ~4 MB, checksum-verified
uv run playwright install chromium         # or set TUFF_BROWSER_EXECUTABLE in .env
cp .env.example .env
uv run uvicorn app.main:app --reload
```

The API runs at http://127.0.0.1:8000, with interactive docs at http://127.0.0.1:8000/docs. A SQLite database is created at `backend/data/tuff.db` on first start.

### Frontend

```bash
cd frontend
cp .env.example .env
npm ci
npm run dev
```

The web app runs at http://localhost:8080.

### Production notes

- Set `TUFF_ENVIRONMENT=production` and `TUFF_AUTO_CREATE_TABLES=false`, then run `uv run alembic upgrade head`.
- Set `TUFF_CORS_ORIGINS` to the deployed frontend origin.
- Build the frontend with `npm run build` and serve `frontend/dist` from any static host.

## Configuration

All backend settings are optional and read from `backend/.env`. See [backend/.env.example](backend/.env.example) for the full list.

| Variable | Default | Purpose |
|---|---|---|
| `TUFF_DATABASE_URL` | SQLite at `data/tuff.db` | Any SQLAlchemy async URL |
| `TUFF_CORS_ORIGINS` | local dev origins | Allowed frontend origins |
| `TUFF_BROWSER_EXECUTABLE` | Playwright's Chromium | Path to a system Chromium |
| `TUFF_BROWSER_FALLBACK` | `true` | Use a headless browser when a plain request is blocked |
| `TUFF_SEARCH_CACHE_TTL_SECONDS` | `1800` | How long search results are cached |
| `TUFF_RATE_LIMIT_*` | 30 / 10 / 20 | Requests per minute per IP for search, analysis and the stylist |
| `GEMINI_API_KEY` | empty | Enables the Gemini stylist; without it the rule-based concierge is used |

The frontend reads one variable, `VITE_API_BASE_URL`, which defaults to `http://localhost:8000`.

## API

All routes are under `/api/v1`. Full schemas are in the OpenAPI docs at `/docs`.

| Method | Route | Description |
|---|---|---|
| `GET` | `/health` | Liveness, plus which optional capabilities are available |
| `POST` | `/analysis/face` | Colour analysis of an uploaded photo |
| `GET` | `/products/search` | Search all stores and return ranked results |
| `GET` | `/products/search/stream` | The same search, streamed per store over SSE |
| `GET` | `/products/stores` | Supported stores |
| `POST` | `/users` | Create an anonymous profile |
| `GET` / `PATCH` | `/users/{id}/profile` | Read or update season, gender, budget and styles |
| `GET` | `/users/{id}/deck` | Next cards for the adaptive swipe deck |
| `POST` | `/users/{id}/interactions` | Record a keep, love or pass |
| `POST` | `/users/{id}/interactions/undo` | Undo the most recent swipe |
| `GET` | `/users/{id}/saved` | Saved pieces |
| `GET` | `/users/{id}/lookbook` | Outfits built from saved pieces, plus suggestions |
| `GET` | `/users/{id}/insights` | What the taste model has learned |
| `POST` | `/stylist/chat` | Talk to the stylist |

## Testing

```bash
# Backend: 114 tests
cd backend && uv run ruff check . && uv run pytest -q

# Frontend: 15 tests, plus type checking, linting and a production build
cd frontend && npm run lint && npm run typecheck && npm test && npm run build
```

Store parsers are tested against saved store pages, so the suite runs offline. CI runs both suites on every push ([.github/workflows/ci.yml](.github/workflows/ci.yml)). Results from manual testing against the live stores are recorded in [docs/TESTING.md](docs/TESTING.md).

## Project structure

```
TUFF/
├── backend/
│   ├── app/
│   │   ├── api/v1/          HTTP routes
│   │   ├── core/            settings, logging, rate limiting
│   │   ├── db/              models and session
│   │   ├── repositories/    database access
│   │   ├── schemas/         request and response models
│   │   └── services/
│   │       ├── color/           face analysis, skin measurement, palettes, harmony
│   │       ├── search/          store providers, browser pool, cache
│   │       ├── recommendation/  ranking, taste model, swipe deck, outfits
│   │       └── stylist/         Gemini and rule-based stylist
│   ├── migrations/          Alembic database migrations
│   ├── scripts/             model download and utilities
│   └── tests/
├── frontend/
│   └── src/
│       ├── pages/           Home, Onboarding, Colour Studio, Discover, Swipe, Wardrobe, Profile
│       ├── components/      brand, colour, layout, product, swipe, stylist and UI primitives
│       ├── hooks/           data and swipe-deck hooks
│       └── lib/             API client and helpers
├── docs/                    architecture, research, testing, security and audits
└── research/                exploratory notebooks (not part of the app)
```

## Documentation

| Document | Contents |
|---|---|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design, request flows and module responsibilities |
| [RESEARCH.md](docs/RESEARCH.md) | The papers behind the colour science and the swipe deck, and where each is used |
| [TESTING.md](docs/TESTING.md) | Test strategy, coverage and live verification results |
| [SECURITY_AUDIT.md](docs/SECURITY_AUDIT.md) | Security review and fixes |
| [DATABASE_AUDIT.md](docs/DATABASE_AUDIT.md) | Schema, indexes and migrations |
| [IMPLEMENTATION_ROADMAP.md](docs/IMPLEMENTATION_ROADMAP.md) | Planned work |
| [PROJECT_AUDIT.md](docs/PROJECT_AUDIT.md) | The original codebase audit |

## Known limitations

- **No accounts yet.** A profile is an anonymous ID stored on the device.
- **Store markup changes.** If a retailer changes its page structure, that provider can break. Parser tests catch this, and the browser fallback absorbs some changes.
- **Colour analysis is an estimate.** Lighting, makeup and camera processing all affect the reading, so results include a confidence score and alternatives. The light/deep boundary was tuned by inspection and should be fitted on a labelled portrait set (see [RESEARCH.md](docs/RESEARCH.md)).
