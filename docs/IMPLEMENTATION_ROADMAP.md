# Implementation Roadmap

> **v2 (branch `tuff-v2`, Oct 2026):** FastAPI, SQLite with Alembic, async HTTP-first scraping with Playwright fallback and streaming, a colour science engine (Face Landmarker, YuNet, ITA°, 12 seasons, garment colour), a learned taste model with MMR, Gemini function calling, and a redesigned frontend. Items below marked ✅ are done.

Ordered by value and dependency. "Done" items are on branch `audit/mvp-hardening`; see `PROJECT_AUDIT.md` for details.

## Done in this pass

- Reproducible backend install (pinned deps, Python 3.12) — color analysis works again; OpenCV fallback.
- Security: path traversal, PII in search URLs, debug mode, CORS, upload limits, error leakage, hardcoded key removed from tree.
- Core flows: gender persistence, double load, Swipe More, Saved page, color-analysis crash, stale state, chat images, dead links.
- Search: concurrent scrapers with timeout + cache, normalization, fixed Amazon titles and Flipkart prices.
- Ranking: explainable 0–100 score using palette, swipes, budget, style.
- TUFFY on the supported Gemini SDK, optional, bounded.
- 99 backend + 22 frontend tests, CI workflow, docs.

## Now (owner actions, minutes)

1. **Revoke the exposed Groq key** (Groq console). Optionally purge it from history with `git filter-repo` + force-push — coordinate first, it rewrites `main`.
2. Review and merge `audit/mvp-hardening` (5 commits).
3. Add `GEMINI_API_KEY` to `Backend/.env` and smoke-test TUFFY chat (the only flow not verified live).

## Next (P1/P2, days)

| # | Item | Why | Depends on |
|---|---|---|---|
| 1 | **Accounts**: email magic link or Google sign-in; replace the mock `SignInModal`; tie profiles to accounts, add `DELETE /user/<id>` | Profiles are readable/editable by anyone holding an id; no cross-device use; no data deletion | — |
| 2 | ✅ **Move storage to SQLite** behind `UserPreferenceManager` (schema in `DATABASE_AUDIT.md`), store a product table from scrapes | Needed for accounts, multi-process serving, analytics, deletion | — |
| 3 | ✅ (rate limiting; production server still to set up) **Rate limiting** (Flask-Limiter, per IP/user) and a production server (gunicorn, 1 worker until #2) | Each search can spawn headless Chrome; Gemini costs money | — |
| 4 | **Playwright E2E** for the onboarding → swipe → saved journey with the backend's scrapers faked | The manual browser check in `TESTING.md` should run in CI | — |
| 5 | **Product data source decision**: affiliate feeds / official APIs (the unused `api_integrations_india.py` is a start) vs. scraping | Scrapers break on markup changes (two had already broken) and may violate retailer ToS | product/legal call |
| 6 | Scraper health check: a scheduled job that runs each scraper and reports zero-result or missing-field brands | Silent breakage is the main reliability risk | 5 |

## Later (P3, product improvements)

- ✅ Capture color from structured retailer fields (Flipkart shows a color line) instead of titles only — titles rarely name the color, which weakens palette matching.
- Outfit building: "complete the look" from liked items by category + palette (data model: `outfits`, `outfit_items`).
- Show the occasion preference in search (currently stored but unused in ranking).
- Learn ranking weights from swipe data once there are enough users (logistic regression on the existing features before anything heavier).
- Skin-tone analysis: add a white-balance step / reference-card option and show a confidence; collect user corrections ("this isn't me") as feedback.
- ✅ Code-split routes and compress `src/assets` (~17 MB of images/videos; 634 kB JS).
- ✅ Remove or finish dead code: `hybrid_fetcher.py`, `product_cache.py`, Streamlit `Webscraping/app.py`, duplicate `clean_price`/`get_driver`, manual `test_*.py` scripts.
- Clear outputs in `Webscraping/learnning_scraping _amazon.ipynb`.
- ✅ Use React Query (already installed) for caching/retries instead of hand-rolled fetch effects.

## Explicitly not recommended now

Microservices, message queues, Redis, vector databases, or a custom ML model: none is justified by current load or data. Revisit after accounts + SQLite and real usage numbers.

## Next after v2

1. **Accounts** (magic link or Google), attaching the anonymous profile on sign-in.
2. **Playwright E2E tests** in CI for onboarding → discover → swipe → wardrobe, against faked stores.
3. **Gemini verification** with a real key; consider streaming replies.
4. **Fast providers for Ajio and Nykaa Fashion**, if their pages carry structured data like Myntra's (not yet checked), retiring their Selenium scrapers.
5. **Calibration set** for colour analysis: a small labelled set of portraits to tune the undertone and contrast thresholds, which are currently set by inspection.
6. **Postgres + Redis** only if the API runs as several processes.
