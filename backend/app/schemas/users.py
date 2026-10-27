from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator

from app.schemas.products import ProductOut

Gender = Literal["women", "men", "unisex"]


class UserCreated(BaseModel):
    id: str


class Sizes(BaseModel):
    tops: str | None = Field(default=None, max_length=8)
    bottoms: str | None = Field(default=None, max_length=8)
    shoes: str | None = Field(default=None, max_length=8)
    dresses: str | None = Field(default=None, max_length=8)


class ProfileUpdate(BaseModel):
    """Partial update: only fields that are sent change."""
    gender: Gender | None = None
    body_type: str | None = Field(default=None, max_length=32)
    sizes: Sizes | None = None
    styles: list[str] | None = Field(default=None, max_length=12)
    occasions: list[str] | None = Field(default=None, max_length=12)
    favorite_stores: list[str] | None = Field(default=None, max_length=20)
    budget_min: float | None = Field(default=None, ge=0, le=1_000_000)
    budget_max: float | None = Field(default=None, ge=0, le=1_000_000)

    @field_validator("styles", "occasions", "favorite_stores")
    @classmethod
    def _short_words(cls, values):
        if values is None:
            return values
        return [str(v).strip().lower()[:24] for v in values if str(v).strip()]


class ProfileOut(BaseModel):
    gender: str | None = None
    body_type: str | None = None
    sizes: dict | None = None
    styles: list[str] = []
    occasions: list[str] = []
    favorite_stores: list[str] = []
    budget_min: float | None = None
    budget_max: float | None = None
    season: str | None = None
    color_analysis: dict | None = None
    onboarded: bool = False
    updated_at: datetime | None = None


class InteractionIn(BaseModel):
    product_id: str = Field(min_length=40, max_length=40)
    action: Literal["like", "love", "dislike"]


class SavedItemOut(BaseModel):
    saved_at: datetime
    product: ProductOut


class Insights(BaseModel):
    likes: int
    passes: int
    top_categories: list[str]
    top_brands: list[str]
    top_stores: list[str]
    favorite_colors: list[dict]
    typical_price: float | None


class DeckCardOut(BaseModel):
    product: ProductOut
    tag: Literal["for_you", "new_direction"]


class TasteLearning(BaseModel):
    swipes: int
    confidence: float
    colors: list[str]
    categories: list[str]


class DeckOut(BaseModel):
    cards: list[DeckCardOut]
    learning: TasteLearning


class UndoOut(BaseModel):
    product: ProductOut | None
    action: str | None


class HarmonyOut(BaseModel):
    kind: str
    score: float
    explanation: str


class OutfitOut(BaseModel):
    items: list[ProductOut]
    harmony: HarmonyOut
    score: float


class PartnerSuggestion(BaseModel):
    product: ProductOut
    need: str
    colors: list[dict]
    query: str


class LookbookOut(BaseModel):
    outfits: list[OutfitOut]
    suggestions: list[PartnerSuggestion]
