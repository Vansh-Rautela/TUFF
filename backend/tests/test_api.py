import io
import json

import pytest

from tests.conftest import FACES, png_upload

API = "/api/v1"


async def test_health(client):
    body = (await client.get(f"{API}/health")).json()
    assert body["status"] == "ok" and body["color_analysis"] == "fake" and body["stylist"] == "concierge"
    assert body["stores"] == ["Myntra", "Flipkart", "Amazon"]


async def test_openapi_docs_available(client):
    schema = (await client.get("/openapi.json")).json()
    assert schema["info"]["title"] == "TUFF API" and f"{API}/products/search" in schema["paths"]


async def test_request_id_and_timing_headers(client):
    response = await client.get(f"{API}/health", headers={"X-Request-ID": "abc123"})
    assert response.headers["X-Request-ID"] == "abc123" and response.headers["Server-Timing"].startswith("app;dur=")

# ---- users & profile ------------------------------------------------------------


async def test_profile_lifecycle(client, user_id):
    assert user_id.startswith("u_") and len(user_id) == 34
    profile = (await client.get(f"{API}/users/{user_id}/profile")).json()
    assert profile["onboarded"] is False
    updated = await client.patch(f"{API}/users/{user_id}/profile", json={
        "gender": "women", "styles": ["Casual ", "Elegant"], "budget_max": 3000, "sizes": {"tops": "M"}})
    body = updated.json()
    assert updated.status_code == 200 and body["styles"] == ["casual", "elegant"] and body["onboarded"]
    assert body["sizes"] == {"tops": "M"}
    # Partial update leaves other fields alone.
    body = (await client.patch(f"{API}/users/{user_id}/profile", json={"body_type": "Athletic"})).json()
    assert body["gender"] == "women" and body["body_type"] == "Athletic"


@pytest.mark.parametrize("payload", [{"gender": "robot"}, {"budget_max": -5}, {"styles": "casual"}])
async def test_profile_validation_errors_are_structured(client, user_id, payload):
    response = await client.patch(f"{API}/users/{user_id}/profile", json=payload)
    assert response.status_code == 422
    error = response.json()["error"]
    assert error["code"] == "validation_error" and error["details"]


async def test_bad_and_unknown_user_ids(client):
    assert (await client.get(f"{API}/users/..%2Fetc/profile")).status_code in (404, 422)
    assert (await client.get(f"{API}/users/bad.id/profile")).status_code == 422
    response = await client.get(f"{API}/users/u_doesnotexist/profile")
    assert response.status_code == 404 and response.json()["error"]["code"] == "user_not_found"


async def test_delete_user_removes_everything(client, user_id):
    await client.get(f"{API}/products/search", params={"q": "kurta"})
    product_id = (await client.get(f"{API}/products/search", params={"q": "kurta"})).json()["products"][0]["id"]
    await client.post(f"{API}/users/{user_id}/interactions", json={"product_id": product_id, "action": "like"})
    assert (await client.delete(f"{API}/users/{user_id}")).status_code == 204
    assert (await client.get(f"{API}/users/{user_id}/saved")).status_code == 404

# ---- color analysis -----------------------------------------------------------------


async def test_analysis_saves_to_profile(client, user_id, services):
    response = await client.post(f"{API}/analysis/face", files={"photo": png_upload()}, data={"user_id": user_id})
    assert response.status_code == 200
    body = response.json()
    assert body["season"]["name"] == "Warm Autumn" and body["season"]["palette"]["signature"]
    profile = (await client.get(f"{API}/users/{user_id}/profile")).json()
    assert profile["season"] == "Warm Autumn" and profile["onboarded"]


async def test_analysis_rejects_bad_uploads(client, services):
    response = await client.post(f"{API}/analysis/face", files={"photo": ("a.txt", io.BytesIO(b"hi"), "text/plain")})
    assert response.status_code == 422 and response.json()["error"]["code"] == "bad_image_type"
    response = await client.post(f"{API}/analysis/face", files={"photo": ("a.png", io.BytesIO(b"junk"), "image/png")})
    assert response.json()["error"]["code"] == "bad_image"
    services.settings.max_upload_bytes = 100
    response = await client.post(f"{API}/analysis/face", files={"photo": png_upload()})
    assert response.json()["error"]["code"] == "image_too_large"


async def test_analysis_unavailable_is_503(client, services):
    services.analyzer = None
    response = await client.post(f"{API}/analysis/face", files={"photo": png_upload()})
    assert response.status_code == 503


async def test_analysis_with_real_models(client, services, settings):
    if not (settings.face_landmarker_model.exists() and (FACES / "close_portrait.webp").exists()):
        pytest.skip("models or sample photo missing")
    from app.services.container import _load_analyzer

    services.analyzer = _load_analyzer(settings)
    response = await client.post(f"{API}/analysis/face", files={"photo": png_upload(FACES / "close_portrait.webp")})
    body = response.json()
    assert response.status_code == 200 and body["quality"]["detector"].startswith("mediapipe")
    assert body["elapsed_ms"] < 2000

# ---- search, ranking, swipes ------------------------------------------------------


async def test_anonymous_search_interleaves_stores(client):
    body = (await client.get(f"{API}/products/search", params={"q": "kurta"})).json()
    assert body["query"] == "kurta"
    assert [p["store"] for p in body["products"][:3]] == ["Myntra", "Flipkart", "Amazon"]
    assert all(p["match_score"] is None for p in body["products"])
    assert {s["store"]: s["count"] for s in body["stores"]} == {"Myntra": 2, "Flipkart": 2, "Amazon": 1}


async def test_personal_search_uses_profile_and_ranks(client, user_id):
    await client.patch(f"{API}/users/{user_id}/profile", json={"gender": "women", "styles": ["casual"]})
    await client.post(f"{API}/analysis/face", files={"photo": png_upload()}, data={"user_id": user_id})
    body = (await client.get(f"{API}/products/search", params={"q": "kurta", "user_id": user_id})).json()
    assert body["query"] == "women kurta casual"
    titles = [p["title"] for p in body["products"]]
    assert "Men Navy Slim Shirt" not in titles                     # gender filter
    assert body["products"][0]["match_score"] >= body["products"][-1]["match_score"] - 40
    top = body["products"][0]
    assert top["match_reasons"] and top["color_hex"]
    assert next(p for p in body["products"] if p["title"] == "Women Olive Cotton Kurta")["discount_percent"] == 55


async def test_price_filter_and_store_choice(client):
    params = {"q": "x", "store": "Flipkart", "max_price": 2000}
    body = (await client.get(f"{API}/products/search", params=params)).json()
    assert [p["title"] for p in body["products"]] == ["Women Rust Casual Top"]


async def test_swipes_save_learn_and_hide(client, user_id):
    params = {"q": "kurta", "user_id": user_id}
    products = (await client.get(f"{API}/products/search", params=params)).json()["products"]
    liked, passed = products[0], products[1]
    for pid, action in ((liked["id"], "like"), (passed["id"], "dislike")):
        response = await client.post(f"{API}/users/{user_id}/interactions", json={"product_id": pid, "action": action})
        assert response.status_code == 204
    saved = (await client.get(f"{API}/users/{user_id}/saved")).json()
    assert [s["product"]["id"] for s in saved] == [liked["id"]]
    deck = (await client.get(f"{API}/products/search",
                             params={"q": "kurta", "user_id": user_id, "exclude_seen": True})).json()["products"]
    assert {liked["id"], passed["id"]}.isdisjoint({p["id"] for p in deck})
    insights = (await client.get(f"{API}/users/{user_id}/insights")).json()
    assert insights["likes"] == 1 and insights["passes"] == 1
    assert (await client.delete(f"{API}/users/{user_id}/saved/{liked['id']}")).status_code == 204
    assert (await client.get(f"{API}/users/{user_id}/saved")).json() == []


async def test_interaction_with_unknown_product(client, user_id):
    response = await client.post(f"{API}/users/{user_id}/interactions", json={"product_id": "0" * 40, "action": "like"})
    assert response.status_code == 404


async def test_streaming_search(client, user_id):
    async with client.stream("GET", f"{API}/products/search/stream", params={"q": "kurta", "user_id": user_id}) as r:
        assert r.headers["content-type"].startswith("text/event-stream")
        text = "".join([chunk async for chunk in r.aiter_text()])
    events = [block.split("\n") for block in text.strip().split("\n\n")]
    names = [e[0].removeprefix("event: ") for e in events]
    assert names[0] == "start" and names[-1] == "done" and names.count("store") == 3
    store_payloads = [json.loads(e[1].removeprefix("data: ")) for e in events if e[0] == "event: store"]
    assert sum(p["store"]["count"] for p in store_payloads) == 5


async def test_stores_and_product_lookup(client):
    stores = (await client.get(f"{API}/products/stores")).json()
    assert {s["name"] for s in stores if s["default"]} == {"Myntra", "Flipkart", "Amazon"}
    product = (await client.get(f"{API}/products/search", params={"q": "kurta"})).json()["products"][0]
    assert (await client.get(f"{API}/products/{product['id']}")).json()["title"] == product["title"]

# ---- stylist & limits ----------------------------------------------------------------


async def test_stylist_concierge_returns_ranked_products(client, user_id):
    await client.post(f"{API}/analysis/face", files={"photo": png_upload()}, data={"user_id": user_id})
    body = (await client.post(f"{API}/stylist/chat", json={"user_id": user_id, "message": "show me kurtas"})).json()
    assert body["source"] == "concierge" and body["products"]
    assert all(p["match_score"] is not None for p in body["products"])


async def test_stylist_validates_message(client):
    assert (await client.post(f"{API}/stylist/chat", json={"message": ""})).status_code == 422
    assert (await client.post(f"{API}/stylist/chat", json={"message": "x" * 1001})).status_code == 422


async def test_rate_limit(client, services):
    services.settings.rate_limit_search = 2
    codes = [(await client.get(f"{API}/products/search", params={"q": "a"})).status_code for _ in range(3)]
    assert codes == [200, 200, 429]
