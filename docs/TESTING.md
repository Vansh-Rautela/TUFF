# Testing

```bash
cd backend  && uv run ruff check . && uv run pytest -q
cd frontend && npm run lint && npm run typecheck && npm test && npm run build
```

CI (`.github/workflows/ci.yml`) runs both on pushes to `main` and on pull requests; the backend job downloads the face models first.

## Backend (114 tests, ~3.9 s)

| File | Covers |
|---|---|
| `test_color_science.py` | CIEDE2000 against the 8 published Sharma et al. reference pairs, LAB round-trips, LCh, ITA° categories, colour vocabulary |
| `test_color_analysis.py` | 12 complete palettes, axes → season mapping, sclera white balance, garment colour on synthetic product shots; **real models** on two stock photos (close portrait; small face via YuNet + crop) and the no-face error |
| `test_search.py` | Myntra / Flipkart / Amazon parsers on saved real store pages, tolerance of blocked or changed markup, browser fallback vs HTTP-first, query privacy, engine caching (memory and SQLite), garment colours, timeouts, failure isolation, in-flight dedupe, streaming order |
| `test_recommendation.py` | Palette ordering by ΔE, normalisation over available signals, gender and pass filtering, learned taste, recency decay, MMR diversity, score bounds |
| `test_stylist.py` | Concierge intents, Gemini function-calling loop (fake client), fallback on Gemini failure |
| `test_research_methods.py` | Histogram mode, shadow-robust skin measurement, temperature-first seasons, harmony kinds and ordering (incl. CIELAB vs paint-wheel complements), outfit pairing and partner suggestions, colour families, Thompson deck: palette-led cold start, learning from swipes, recency, brand cap, exploration cap, garment-named top-up queries |
| `test_api.py` | Every route (incl. deck, love, undo, lookbook) through the ASGI app: profile lifecycle, validation error format, bad ids, data deletion, uploads (type, size, junk), 503 without analyzer, real-model analysis, anonymous vs personal search, price and store filters, swipes → wardrobe → insights, SSE stream, stylist, rate limiting |

Store HTTP and product images are faked with `httpx.MockTransport`; the database is a temporary SQLite file per test.

## Frontend (15 tests)

`src/lib/__tests__/`: API client (query strings, multipart upload, structured errors, network failures, 204), SSE handling with a fake `EventSource`, session storage (invalid ids, blocked storage), image prep, formatting.

## Verified manually (2026-10-27)

- Adaptive deck against the live API and real stores (30 simulated swipes favouring greens and olives): those colours rose from 2/10 to 8/10 cards per deck; about 0.1 s per deck once the catalog is warm. This run found and fixed cosmetics leaking into the deck.
- Live API against real stores: three stores in 2.6 s cold (72 products, all with measured colour), about 20 ms cached; analysis of a real portrait in 113 ms; like → wardrobe → insights; SSE events; concierge stylist; delete-user.
- Garment colour against Myntra's own colour labels on 30 live products: the measured shade visually matched the garment in about 24 of 30; the name agreed with the store label in 13 of 30 (store labels are coarse, and printed fabrics are the main failure).
- In a browser: landing page sections; onboarding end to end (real analysis → Warm Spring → preferences → personalised Discover with streaming store status and match badges).

## Not verified

- Gemini mode against the real API (no key available); covered only by a fake client.
- In-browser rendering of `/swipe`, `/saved`, `/studio` (report view), `/profile`, the stylist drawer, and phone-width layouts. The browser extension disconnected before these were viewed. They compile under strict TypeScript and use the same API calls verified above.
- The 12 legacy Selenium stores.
- Load and concurrency beyond a single process.
