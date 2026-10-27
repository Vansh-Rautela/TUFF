"""Users, profiles, interactions and saved items."""
import secrets

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import NotFoundError
from app.db.models import Interaction, Product, Profile, SavedItem, User


def new_user_id() -> str:
    return "u_" + secrets.token_hex(16)


async def create_user(session: AsyncSession, user_id: str | None = None) -> User:
    user = User(id=user_id or new_user_id())
    user.profile = Profile(user_id=user.id, styles=[], occasions=[], favorite_stores=[])
    session.add(user)
    await session.flush()
    return user


async def get_user(session: AsyncSession, user_id: str) -> User:
    user = await session.get(User, user_id)
    if user is None:
        raise NotFoundError("We couldn't find that profile. Start onboarding again.", code="user_not_found")
    return user


async def get_profile(session: AsyncSession, user_id: str) -> Profile:
    await get_user(session, user_id)
    profile = await session.get(Profile, user_id)
    if profile is None:
        profile = Profile(user_id=user_id, styles=[], occasions=[], favorite_stores=[])
        session.add(profile)
        await session.flush()
    return profile


async def update_profile(session: AsyncSession, user_id: str, changes: dict) -> Profile:
    profile = await get_profile(session, user_id)
    for key, value in changes.items():
        setattr(profile, key, value)
    if "color_analysis" in changes:
        analysis = changes["color_analysis"] or {}
        profile.season = (analysis.get("season") or {}).get("name")
    await session.flush()
    return profile


async def delete_user(session: AsyncSession, user_id: str) -> None:
    await get_user(session, user_id)
    await session.execute(delete(User).where(User.id == user_id))


async def record_interaction(session: AsyncSession, user_id: str, product: Product, action: str) -> None:
    session.add(Interaction(user_id=user_id, product_id=product.id, action=action))
    if action in ("like", "love") and await session.get(SavedItem, (user_id, product.id)) is None:
        session.add(SavedItem(user_id=user_id, product_id=product.id))
    await session.flush()


async def undo_last_interaction(session: AsyncSession, user_id: str) -> Interaction | None:
    """Remove the most recent swipe; un-save the product if that swipe saved it."""
    last = await session.scalar(select(Interaction).where(Interaction.user_id == user_id)
                                .order_by(Interaction.created_at.desc(), Interaction.id.desc()).limit(1))
    if last is None:
        return None
    if last.action in ("like", "love"):
        await session.execute(delete(SavedItem).where(SavedItem.user_id == user_id,
                                                      SavedItem.product_id == last.product_id))
    await session.delete(last)
    await session.flush()
    return last


async def interactions(session: AsyncSession, user_id: str, limit: int = 500) -> list[Interaction]:
    rows = await session.scalars(
        select(Interaction).where(Interaction.user_id == user_id).order_by(Interaction.created_at.desc()).limit(limit))
    return list(rows.unique())


async def saved_items(session: AsyncSession, user_id: str) -> list[SavedItem]:
    rows = await session.scalars(
        select(SavedItem).where(SavedItem.user_id == user_id).order_by(SavedItem.created_at.desc()))
    return list(rows.unique())


async def remove_saved(session: AsyncSession, user_id: str, product_id: str) -> bool:
    result = await session.execute(
        delete(SavedItem).where(SavedItem.user_id == user_id, SavedItem.product_id == product_id))
    return result.rowcount > 0


async def get_product(session: AsyncSession, product_id: str) -> Product:
    product = await session.get(Product, product_id)
    if product is None:
        raise NotFoundError("That product is no longer available.", code="product_not_found")
    return product
