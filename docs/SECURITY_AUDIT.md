# Security & Privacy

> **v2 status:** user ids are validated by route pattern and are 128-bit random; uploads are multipart, type- and size-checked, and decoded in memory; JSON error envelope with no internals; CORS allow-list; per-IP rate limits on search, analysis and stylist; a delete-my-data endpoint and UI; scraped links are canonical store URLs and only `https://` images are kept. Still open: no authentication (S5); the exposed Groq key in public history (S1) must be revoked by the owner.

---

# Security & Privacy Audit

Scope: code in this repository, run locally. No penetration testing, dependency CVE scan service, or hosted deployment was available. Absence of a finding here does not mean the app is secure.

## Findings

| # | Severity | Finding | Status |
|---|---|---|---|
| S1 | **Critical** | A **Groq API key was hardcoded** in `recommendation.ipynb` and is in the public GitHub history (commit `ad9bba6`). | Removed from the working tree (reads `GROQ_API_KEY`). **Action required by the owner:** revoke the key in the Groq console now. Removing it from history needs a rewrite (e.g. `git filter-repo`) and a force-push — not done, since it rewrites shared history. Revoking is what actually matters. |
| S2 | High | **Path traversal**: `userId` from the URL/body became a file path, allowing reads/writes of `.json` files outside `user_data/`. | Fixed: `^[A-Za-z0-9_-]{1,64}$` enforced in `validation.require_user_id` (all routes) and again in the storage layer. Tests cover `../`, `/`, `.`. |
| S3 | High | **PII sent to third parties**: name, date of birth and username were embedded in retailer search URLs (Amazon/Flipkart/Myntra), where they land in those sites' logs and analytics. | Fixed (frontend no longer sends it; backend ignores multi-line/long prompts). Test: `test_build_search_query_never_leaks_profile_dump`. |
| S4 | High | **Werkzeug debugger always enabled** — interactive Python console on any error page if the port is reachable. | Fixed: `TUFF_DEBUG` (default false), bind `127.0.0.1` by default. |
| S5 | Medium | **No authentication or authorization.** Anyone who knows a user id can read that profile (incl. color analysis) and modify it. | Open. Mitigated: ids are now random 128-bit values instead of `user_<timestamp>` (guessable). Real accounts are a roadmap item. |
| S6 | Medium | **Selfies written to disk** and leaked when analysis was unavailable. | Fixed: decoded in memory, never stored. |
| S7 | Medium | **Unbounded uploads / image-processing cost** (no size limit; full-resolution decode). | Fixed: `MAX_CONTENT_LENGTH` 12 MB (JSON 413), type allow-list, decoded image downscaled to 1280 px; frontend downsizes before upload. |
| S8 | Medium | **Internal error details returned to clients** (`str(e)` everywhere). | Fixed: JSON error handlers, generic 500 message, details logged. |
| S9 | Medium | **CORS `*`.** | Fixed: allow-list via `TUFF_CORS_ORIGINS`. (No cookies are used, so CSRF does not apply today.) |
| S10 | Medium | **No rate limiting.** Each search can start up to 3 headless Chrome processes; an attacker could exhaust CPU/RAM or burn Gemini quota. | Partly mitigated (bounded thread pool, cache, in-flight dedupe, message length cap). Open: per-IP rate limit (e.g. Flask-Limiter) before any public deployment. |
| S11 | Low | Prompt injection into TUFFY via profile fields sent by the client. | Mitigated: fields truncated and labelled as data in the system instruction. Impact limited to the user's own session. |
| S12 | Low | Notebook outputs in `Webscraping/learnning_scraping _amazon.ipynb` contain raw Amazon page HTML (including a session hash). | Open: clear outputs before sharing. |
| S13 | Low | Scraping retailer sites may breach their terms of service; retailers may block the server IP. | Open: business/legal decision (see roadmap: official APIs/affiliate feeds). |
| S14 | Info | `dangerouslySetInnerHTML` appears only in shadcn's `chart.tsx` (static CSS); product titles are rendered as text. No XSS sinks found. | — |
| S15 | Info | Product links from scrapers are restricted to `http(s)://` before reaching the UI (no `javascript:` URLs). Outbound links use `rel="noopener noreferrer"`; images use `referrerPolicy="no-referrer"`. | — |

## Secrets handling

- `.env`, `*.env` are git-ignored; `Backend/.env.example` and `Frontend/TUFF-frontend/.env.example` contain placeholders only.
- History scan (key-like patterns for Google, OpenAI, Groq, GitHub, Slack, AWS): one hit — S1.

## Dependency notes

- Backend dependencies are now pinned to ranges; `mediapipe==0.10.21` is exact because later releases removed the API used.
- `google-generativeai` (end of support) was replaced by `google-genai`.
- `npm install` reports install scripts blocked by policy for `esbuild`; builds and tests still pass. `npm audit` was not run against the network advisory DB in this session.

## Privacy summary

| Data | Where it goes |
|---|---|
| Face photo | Browser → local backend, analyzed in memory, discarded. Never sent to Gemini or retailers. |
| Skin tone / season | Stored in the user's JSON file and browser; sent to Gemini as context if TUFFY is used. |
| Gender, styles, budget, sizes | JSON file + browser. Gender and one style word are part of retailer search queries. |
| Typed search text | Retailer search URLs. |
| Name, DOB, username (sign-up chain) | Browser memory only; no longer sent anywhere. |
