from datetime import UTC, datetime, timedelta

from app.db.models import Interaction, Product, Profile
from app.services.recommendation.ranker import rank_products, similarity_matrix
from app.services.recommendation.taste_profile import build_taste_profile


def product(pid, title, color_hex=None, **kw) -> Product:
    return Product(id=pid.ljust(40, "0"), store=kw.pop("store", "Myntra"), url=f"https://x/{pid}", title=title,
                   color_hex=color_hex, **kw)


def profile(**kw) -> Profile:
    return Profile(user_id="u", styles=kw.pop("styles", []), occasions=[], favorite_stores=[], **kw)


def interaction(p: Product, action: str, days_ago: float = 0) -> Interaction:
    item = Interaction(user_id="u", product_id=p.id, action=action,
                       created_at=datetime.now(UTC) - timedelta(days=days_ago))
    item.product = p
    return item


def test_palette_fit_orders_by_color_science():
    autumn = profile(season="Warm Autumn")
    ranked = rank_products([
        product("pink", "Icy Blue Top", "#CFE6F2"),      # in Warm Autumn's avoid list
        product("rust", "Rust Top", "#B7410E"),          # signature color
        product("grey", "Grey Top", "#8A8D91"),
    ], autumn, None, diversify=False)
    assert [r.product.title for r in ranked] == ["Rust Top", "Grey Top", "Icy Blue Top"]
    assert ranked[0].score > 90 and "Warm Autumn" in ranked[0].reasons[0]
    assert ranked[-1].score == 0


def test_missing_signals_are_not_counted_as_zero():
    # Only budget is known: an in-budget item should score 100, not 14.
    ranked = rank_products([product("a", "Shirt", price=500)], profile(budget_max=1000), None)
    assert ranked[0].score == 100


def test_gender_and_dislikes_filter():
    liked = product("liked", "Olive Kurta", "#6B6B2E", category="kurta")
    passed = product("passed", "Neon Top", "#B8D430")
    taste = build_taste_profile([interaction(liked, "like"), interaction(passed, "dislike")])
    items = [liked, passed, product("men", "Men Shirt", gender="men"), product("new", "Moss Kurta", "#7A7A4A",
                                                                                 category="kurta")]
    titles = [r.product.title for r in rank_products(items, profile(gender="women"), taste)]
    assert "Neon Top" not in titles and "Men Shirt" not in titles
    titles = [r.product.title for r in rank_products(items, profile(gender="women"), taste, exclude_seen=True)]
    assert titles == ["Moss Kurta"]


def test_learned_taste_lifts_similar_colors_and_categories():
    olive = product("o", "Olive Kurta", "#6B6B2E", category="kurta", brand="Libas")
    taste = build_taste_profile([interaction(olive, "like")])
    ranked = rank_products([
        product("b", "Bright Blue Shirt", "#2C4FB8", category="shirt"),
        product("m", "Moss Kurta", "#7A7A4A", category="kurta", brand="Libas"),
    ], profile(), taste, diversify=False)
    assert ranked[0].product.title == "Moss Kurta"
    assert any("liked" in r or "Libas" in r or "kurta" in r for r in ranked[0].reasons)


def test_recency_decay():
    old = product("old", "Old", "#111111")
    new = product("new", "New", "#FAFAFA")
    taste = build_taste_profile([interaction(old, "like", days_ago=63), interaction(new, "like")])
    assert abs(taste.color_weights[0] - 0.125) < 0.01 and abs(taste.color_weights[1] - 1.0) < 0.01


def test_diversity_rerank_spreads_brands():
    same = [product(f"s{i}", f"Brand A item {i}", "#B7410E", brand="A", category="top") for i in range(4)]
    other = product("o", "Brand B item", "#B7410E", brand="B", category="dress", store="Amazon")
    ranked = rank_products(same + [other], profile(season="Warm Autumn"), None)
    assert [r.product.brand for r in ranked[:2]] == ["A", "B"]
    assert similarity_matrix(same[:2])[0, 1] > similarity_matrix([same[0], other])[0, 1]


def test_scores_bounded():
    ranked = rank_products([product(str(i), "x", f"#{i:02d}{i:02d}{i:02d}", price=i * 100, rating=5.0)
                            for i in range(1, 30)], profile(season="Deep Winter", budget_max=900), None)
    assert all(0 <= r.score <= 100 for r in ranked)
