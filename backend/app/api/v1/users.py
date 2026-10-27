from collections import Counter
from statistics import median

from fastapi import APIRouter, Query, status

from app.api.deps import ServicesDep, SessionDep, UserId
from app.repositories import product_repository as products_repo
from app.repositories import user_repository as users_repo
from app.schemas.products import ProductOut
from app.schemas.users import (
    DeckCardOut,
    DeckOut,
    HarmonyOut,
    Insights,
    InteractionIn,
    LookbookOut,
    OutfitOut,
    PartnerSuggestion,
    ProfileOut,
    ProfileUpdate,
    SavedItemOut,
    TasteLearning,
    UndoOut,
    UserCreated,
)
from app.services.color.color_names import RETAIL_COLORS
from app.services.color.seasonal_palettes import get_season
from app.services.recommendation.adaptive_deck import build_taste_model, compose_deck
from app.services.recommendation.outfit_builder import build_outfits, suggest_partners
from app.services.recommendation.ranker import rank_products
from app.services.recommendation.taste_profile import build_taste_profile
from app.services.search.query_builder import build_query

router = APIRouter(prefix="/users", tags=["users"])


def _profile_out(profile) -> ProfileOut:
    out = ProfileOut.model_validate(profile, from_attributes=True)
    out.onboarded = bool(profile.season or (profile.gender and profile.styles))
    return out


@router.post("", response_model=UserCreated, status_code=status.HTTP_201_CREATED,
             summary="Create an anonymous profile and get its id")
async def create_user(session: SessionDep):
    return UserCreated(id=(await users_repo.create_user(session)).id)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT,
               summary="Delete the profile and everything linked to it")
async def delete_user(user_id: UserId, session: SessionDep):
    await users_repo.delete_user(session, user_id)


@router.get("/{user_id}/profile", response_model=ProfileOut)
async def get_profile(user_id: UserId, session: SessionDep):
    return _profile_out(await users_repo.get_profile(session, user_id))


@router.patch("/{user_id}/profile", response_model=ProfileOut)
async def update_profile(user_id: UserId, changes: ProfileUpdate, session: SessionDep):
    data = changes.model_dump(exclude_unset=True)
    if "sizes" in data and data["sizes"] is not None:
        data["sizes"] = {k: v for k, v in data["sizes"].items() if v}
    return _profile_out(await users_repo.update_profile(session, user_id, data))


@router.post("/{user_id}/interactions", status_code=status.HTTP_204_NO_CONTENT,
             summary="Record a like (also saves the item) or a pass")
async def add_interaction(user_id: UserId, body: InteractionIn, session: SessionDep):
    await users_repo.get_user(session, user_id)
    product = await users_repo.get_product(session, body.product_id)
    await users_repo.record_interaction(session, user_id, product, body.action)


@router.get("/{user_id}/saved", response_model=list[SavedItemOut])
async def list_saved(user_id: UserId, session: SessionDep):
    await users_repo.get_user(session, user_id)
    return [SavedItemOut(saved_at=item.created_at, product=ProductOut.from_product(item.product))
            for item in await users_repo.saved_items(session, user_id)]


@router.delete("/{user_id}/saved/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_saved(user_id: UserId, product_id: str, session: SessionDep):
    await users_repo.remove_saved(session, user_id, product_id)


@router.get("/{user_id}/insights", response_model=Insights, summary="What TUFF has learned from swipes")
async def insights(user_id: UserId, session: SessionDep, services: ServicesDep):
    await users_repo.get_user(session, user_id)
    history = await users_repo.interactions(session, user_id)
    taste = build_taste_profile(history)
    liked_colors = Counter(i.product.color_name for i in history
                           if i.action in ("like", "love") and i.product.color_name)
    return Insights(
        likes=taste.likes,
        passes=taste.passes,
        top_categories=taste.top("categories"),
        top_brands=[b.title() for b in taste.top("brands")],
        top_stores=taste.top("stores"),
        favorite_colors=[{"name": n, "hex": RETAIL_COLORS.get(n, "#999999")} for n, _ in liked_colors.most_common(5)],
        typical_price=round(median(taste.liked_prices)) if taste.liked_prices else None,
    )


@router.get("/{user_id}/deck", response_model=DeckOut,
            summary="Next swipe cards, chosen by Thompson sampling over colour and category preferences")
async def swipe_deck(user_id: UserId, session: SessionDep, services: ServicesDep,
                     size: int = Query(default=10, ge=1, le=30)):
    profile = await users_repo.get_profile(session, user_id)
    history = await users_repo.interactions(session, user_id)
    seen = {i.product_id for i in history}
    pool = await products_repo.candidate_products(session, gender=profile.gender, exclude_ids=seen)

    if len(pool) < size * 3:
        # Top up the catalog: the profile's own query plus one built around a signature colour,
        # so the deck always has something to explore.
        season = get_season(profile.season)
        queries = [build_query("", profile.gender, profile.styles)]
        if season:
            queries.append(build_query(season.signature[len(history) % len(season.signature)].name, profile.gender))
        for query in queries:
            await services.search.search(query, services.search.resolve_stores(profile.favorite_stores))
        pool = await products_repo.candidate_products(session, gender=profile.gender, exclude_ids=seen)

    taste = build_taste_profile(history)
    ranked = rank_products(pool, profile, taste, exclude_seen=True, diversify=False)
    scores = {r.product.id: r.score for r in ranked}
    reasons = {r.product.id: r.reasons for r in ranked}
    model = build_taste_model(history)
    cards = compose_deck([r.product for r in ranked], profile, model, scores, size)
    return DeckOut(
        cards=[DeckCardOut(product=ProductOut.from_product(c.product, scores.get(c.product.id),
                                                           reasons.get(c.product.id)), tag=c.tag) for c in cards],
        learning=TasteLearning(swipes=model.swipes, confidence=model.confidence,
                               colors=model.learned(model.colors), categories=model.learned(model.categories)),
    )


@router.post("/{user_id}/interactions/undo", response_model=UndoOut, summary="Take back the most recent swipe")
async def undo_interaction(user_id: UserId, session: SessionDep):
    await users_repo.get_user(session, user_id)
    undone = await users_repo.undo_last_interaction(session, user_id)
    if undone is None:
        return UndoOut(product=None, action=None)
    return UndoOut(product=ProductOut.from_product(undone.product), action=undone.action)


@router.get("/{user_id}/lookbook", response_model=LookbookOut,
            summary="Complete the look: saved pieces paired by colour harmony, plus what to find next")
async def lookbook(user_id: UserId, session: SessionDep):
    profile = await users_repo.get_profile(session, user_id)
    saved = [item.product for item in await users_repo.saved_items(session, user_id)]
    season = get_season(profile.season)
    outfits = build_outfits(saved, season)
    return LookbookOut(
        outfits=[OutfitOut(items=[ProductOut.from_product(p) for p in o.items],
                           harmony=HarmonyOut(kind=o.harmony.kind, score=o.harmony.score,
                                              explanation=o.harmony.explanation),
                           score=o.score) for o in outfits],
        suggestions=[PartnerSuggestion(product=ProductOut.from_product(s.product), need=s.need, colors=s.colors,
                                       query=s.query) for s in suggest_partners(saved, season, profile.gender)],
    )
