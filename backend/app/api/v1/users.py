from collections import Counter
from statistics import median

from fastapi import APIRouter, status

from app.api.deps import ServicesDep, SessionDep, UserId
from app.repositories import user_repository as users_repo
from app.schemas.products import ProductOut
from app.schemas.users import Insights, InteractionIn, ProfileOut, ProfileUpdate, SavedItemOut, UserCreated
from app.services.color.color_names import RETAIL_COLORS
from app.services.recommendation.taste_profile import build_taste_profile

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
    liked_colors = Counter(i.product.color_name for i in history if i.action == "like" and i.product.color_name)
    return Insights(
        likes=taste.likes,
        passes=taste.passes,
        top_categories=taste.top("categories"),
        top_brands=[b.title() for b in taste.top("brands")],
        top_stores=taste.top("stores"),
        favorite_colors=[{"name": n, "hex": RETAIL_COLORS.get(n, "#999999")} for n, _ in liked_colors.most_common(5)],
        typical_price=round(median(taste.liked_prices)) if taste.liked_prices else None,
    )
