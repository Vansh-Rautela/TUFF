# Database Audit

## What is actually used

There is **no database server and no ORM.** Persistent state is:

| Store | Location | Written by | Contents |
|---|---|---|---|
| Per-user JSON files | `Backend/user_data/<userId>.json` (configurable via `TUFF_DATA_DIR`) | `user_preferences.UserPreferenceManager` | Profile + full swipe history |
| Browser localStorage | user's browser | `src/lib/session.ts`, `useTuffyCart` | User id, cached profile, liked list, chat cart/wishlist |
| In-memory | backend process | `catalog.ProductSearch`, `tuffy_advisor` | Scrape cache (15 min), Gemini chat sessions |

`product_cache.py` defines a SQLite `products` table (with indexes on brand/category/gender/scraped_at) but **was never called**; `main.py` imported it only for its side effect of creating `product_cache.db` in the current directory. That import has been removed; the module is kept.

No remote/managed database credentials exist in the repository or `.env.example`, so there was nothing remote to inspect.

## Schema (JSON file per user)

```jsonc
{
  "user_id": "user_<32 hex>",           // also the file name; pattern ^[A-Za-z0-9_-]{1,64}$
  "color_analysis": { "skintone": {...}, "complementaryColors": [...], "palette": {...}, ... } | null,
  "gender": "Male" | "Female" | "Unisex" | null,
  "body_type": "Slim" | "Athletic" | "Average" | "Curvy" | "Plus Size" | null,
  "clothing_sizes": { "gender", "physique", "tops", "bottoms", "shoes", "dresses" } | null,
  "style_preferences": ["casual", ...] | null,
  "occasions": ["work", ...] | null,       // added in this audit (additive)
  "favorite_brands": ["Myntra", ...] | null,
  "budget_range": { "min": 0, "max": 2000 } | null,
  "swipe_history": [
    { "product_id", "product_title", "product_brand", "product_image", "product_price",
      "product_link", "action": "like" | "dislike", "timestamp": ISO-8601,
      "product_features": { "category", "color", "style", "tags" } }
  ]
}
```

Fashion concepts vs. what exists:

| Concept | Present? |
|---|---|
| Users / profiles | Anonymous profile per random id; no accounts |
| Style preferences, budget, occasions, sizes | Yes |
| Product catalog | No — products are scraped per request and only persisted inside swipe records |
| Categories / colors / brands | Derived from product titles at runtime (`catalog.extract_*`) and stored on swipes |
| Favorites | Yes, as `like` swipes (de-duplicated on read; removable) |
| Saved outfits | No |
| Recommendation history / feedback | Swipes only; recommendations themselves are not stored |
| Uploaded images | Not stored (decoded in memory, discarded) |

## Integrity findings

| Finding | Severity | Status |
|---|---|---|
| User id used directly as file name → path traversal | P0 | Fixed (validated at storage boundary) |
| Non-atomic writes; concurrent requests (Flask is threaded) could interleave read-modify-write and lose swipes or truncate a file | P2 | Fixed: process-wide `RLock` + temp file + `os.replace` |
| Loading crashed on any unknown/missing key (`UserPreferences(**data)`) — any schema change would orphan existing files | P2 | Fixed: unknown keys ignored, missing keys default |
| `update_user_info` accepted any type for any field | P2 | Fixed: per-field type check, unknown fields ignored |
| Duplicate likes of the same product accumulate | P3 | Reads de-duplicate; history is kept (it is behavioral signal) |
| Unbounded growth: swipe history and localStorage `searchedProducts` | P3 | `searchedProducts` capped at 200; swipe history still unbounded (fine for a demo) |
| No retention/deletion: "Reset profile" only clears the browser; the server file remains | P2 | **Open** — needs a `DELETE /user/<id>` endpoint and a retention policy |
| No backups | P3 | **Open** — files live on one disk |
| Locking is per process; running several workers (e.g. gunicorn `-w 4`) would reintroduce races | P2 | **Open** — documented; run a single process until a real DB is used |
| `product_cache.py`: `scraped_at` default is SQLite UTC text but queries compare against Python local `datetime` (and `INSERT OR REPLACE` resets it) | P3 | Not fixed (module unused) |

## Migration

No migration framework is needed for this change: the only schema change (`occasions`) is additive and the loader tolerates old and new files. Existing files load unchanged (covered by `tests/test_user_preferences.py::test_loads_files_with_unknown_or_missing_keys`).

## Recommendation

Move to **SQLite** (one file, no server, already in the stdlib) when any of these becomes true: real accounts are added, more than one backend process runs, or you need deletion/analytics queries. Suggested tables: `users`, `profiles` (1:1), `products` (url unique, brand, title, color, category, gender, price, last_seen), `interactions` (user_id, product_id, action, created_at; index on user_id, created_at). Introduce it behind `UserPreferenceManager`'s existing methods so routes don't change, and write a one-off importer for the JSON files. Postgres is only worth it once the app is hosted.

## Verification status

- JSON storage behavior: verified by 7 unit tests + API tests using a temporary directory.
- Live: one profile created and read back through the UI (gender, styles, budget, season all persisted correctly).
- Not verified: behavior under real concurrent load; multi-process deployment.
