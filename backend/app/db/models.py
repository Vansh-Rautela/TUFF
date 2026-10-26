"""Database schema.

users ──1:1── profiles
  │
  ├──< interactions >── products      (every like / pass, for learning taste)
  └──< saved_items  >── products      (current favorites)
search_results: cached store searches (store + query -> ordered product ids)
"""
from datetime import UTC, datetime

from sqlalchemy import JSON, DateTime, Float, ForeignKey, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


def utcnow() -> datetime:
    return datetime.now(UTC)


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    profile: Mapped["Profile"] = relationship(back_populates="user", cascade="all, delete-orphan", uselist=False)


class Profile(Base):
    __tablename__ = "profiles"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    gender: Mapped[str | None] = mapped_column(String(16))
    body_type: Mapped[str | None] = mapped_column(String(32))
    sizes: Mapped[dict | None] = mapped_column(JSON)
    styles: Mapped[list] = mapped_column(JSON, default=list)
    occasions: Mapped[list] = mapped_column(JSON, default=list)
    favorite_stores: Mapped[list] = mapped_column(JSON, default=list)
    budget_min: Mapped[float | None] = mapped_column(Float)
    budget_max: Mapped[float | None] = mapped_column(Float)
    season: Mapped[str | None] = mapped_column(String(32), index=True)
    color_analysis: Mapped[dict | None] = mapped_column(JSON)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    user: Mapped[User] = relationship(back_populates="profile")


class Product(Base):
    __tablename__ = "products"
    __table_args__ = (Index("ix_products_store_category", "store", "category"),)

    id: Mapped[str] = mapped_column(String(40), primary_key=True)  # sha1(url)
    store: Mapped[str] = mapped_column(String(32), index=True)
    url: Mapped[str] = mapped_column(Text, unique=True)
    title: Mapped[str] = mapped_column(Text)
    brand: Mapped[str | None] = mapped_column(String(120))
    price: Mapped[float | None] = mapped_column(Float)
    mrp: Mapped[float | None] = mapped_column(Float)
    image_url: Mapped[str | None] = mapped_column(Text)
    rating: Mapped[float | None] = mapped_column(Float)
    category: Mapped[str | None] = mapped_column(String(40))
    gender: Mapped[str | None] = mapped_column(String(16))
    color_name: Mapped[str | None] = mapped_column(String(40))
    color_hex: Mapped[str | None] = mapped_column(String(7))
    color_source: Mapped[str | None] = mapped_column(String(16))  # store | title | image
    first_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    last_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)


class Interaction(Base):
    __tablename__ = "interactions"
    __table_args__ = (Index("ix_interactions_user_created", "user_id", "created_at"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    product_id: Mapped[str] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"))
    action: Mapped[str] = mapped_column(String(16))  # like | dislike
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    product: Mapped[Product] = relationship(lazy="joined")


class SavedItem(Base):
    __tablename__ = "saved_items"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    product_id: Mapped[str] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"), primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)

    product: Mapped[Product] = relationship(lazy="joined")


class SearchResult(Base):
    __tablename__ = "search_results"
    __table_args__ = (UniqueConstraint("store", "query", name="uq_search_store_query"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    store: Mapped[str] = mapped_column(String(32))
    query: Mapped[str] = mapped_column(String(200))
    product_ids: Mapped[list] = mapped_column(JSON)
    fetched_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
