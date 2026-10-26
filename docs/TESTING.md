# Testing

## Commands

```bash
# Backend (Python 3.12, from Backend/)
uv venv --python 3.12 .venv          # or: python3.12 -m venv .venv
uv pip install --python .venv/bin/python -r requirements-dev.txt
.venv/bin/python -m pytest -q

# Frontend (from Frontend/TUFF-frontend/)
npm ci
npm run lint
npm run typecheck
npm test
npm run build
```

CI runs the same commands (`.github/workflows/ci.yml`) on pushes to `main` and on pull requests.

## What the suites cover

| Suite | Tests | Covers | External services |
|---|---|---|---|
| `Backend/tests/test_validation.py` | 20 | user-id rules, image data-URL decoding/downscaling, bad input | none |
| `Backend/tests/test_catalog.py` | 29 | color/category/gender extraction, price parsing, normalization (NaN, placeholders), privacy-safe query building, price filters, brand interleaving, cache/TTL, timeouts, failure isolation, in-flight dedupe | scrapers faked |
| `Backend/tests/test_recommender.py` | 6 | palette/avoid colors, swipe signals, budget/style, penalties, no mutation, `None` fields | none |
| `Backend/tests/test_user_preferences.py` | 6 | path traversal, atomic writes, old-file compatibility, type checks, likes/remove, hiding swiped items | temp dir |
| `Backend/tests/test_tuffy.py` | 6 | missing key, system instruction & session reuse, LRU bound, error handling without leaking details, rule fallback | Gemini faked |
| `Backend/tests/test_api.py` | 26 | every route: validation, 400/404/413/422/503 JSON errors, no disk writes for photos, search/rank/swipe/remove/feed flows | scrapers + analyzer faked, temp dir |
| `Backend/tests/test_color_analysis.py` | 6 | palette contract for all seasons; **real MediaPipe pipeline** on a stock photo from `src/assets`; blank image → error | none (skips if CV deps missing) |
| `Frontend src/lib/__tests__/api.test.ts` | 11 | API client: request shape, server error messages, non-JSON errors, network failure, abort, path encoding, no profile in search prompt | `fetch` stubbed |
| `Frontend src/lib/__tests__/session.test.ts` | 7 | random id format, legacy id reuse, invalid id replacement, storage unavailable, JSON round-trip, `null` vs missing, reset | storage stubbed |
| `Frontend src/lib/__tests__/image.test.ts` | 4 | resize math, type/size rejection | none |

## Results at hand-off (2026-10-27)

| Command | Result |
|---|---|
| `pytest -q` (Backend) | **99 passed** (2 deprecation warnings from protobuf inside mediapipe) |
| `npm run lint` | **0 errors**, 8 warnings (shadcn `react-refresh/only-export-components`) — baseline was 29 errors |
| `npm run typecheck` | **pass** — baseline 1 error |
| `npm test` | **22 passed** |
| `npm run build` | **pass** (634 kB JS, was 659 kB) |

## Manual end-to-end check (performed, not automated)

Backend + Vite dev server, real Chromium, live retailers:

1. `/swipe`: uploaded a stock photo → "Medium Warm", Autumn palette shown.
2. Sizes: chose **Female** → saved (server file shows `gender: Female`).
3. Styles casual + elegant, budget ≤ ₹2,000 → exactly **one** product search ran (was two).
4. Deck showed women's products with "45% Match · Maroon is in your Autumn palette".
5. Swiped right/left → `/liked` showed the liked item → Remove worked → empty state.
6. `/home` → profile card, ranked products with reasons; after the style-seed change, casual wear instead of innerwear.
7. TUFFY (no key) → friendly "not configured" message.
8. `/color-analysis` → full palette rendered (previously crashed).
9. 390 px wide viewport: `/home` laid out correctly. No console errors.

Live search: Amazon/Flipkart/Myntra returned 17/17/16 products with titles, prices and images; cached repeat 6 ms.

## Not covered / not verified

- No browser E2E automation (Playwright) yet — the journey above was manual.
- TUFFY against the real Gemini API (no key available).
- The 12 scrapers other than Amazon/Flipkart/Myntra.
- The sign-up modal chain at `/?signin=1`.
- Load, concurrency across processes, accessibility audit with a screen reader.

## Manual scripts (not part of the suite)

`Backend/test_gemini.py`, `test_api_integrations.py`, `test_india_apis.py`, `quick_test_amazon.py`, `debug_amazon_api.py`, `list_models.py` call live paid APIs and are excluded by `pytest.ini` (`testpaths = tests`). `test_gemini.py` and `list_models.py` still use the retired `google-generativeai` package.
