from pydantic import BaseModel, Field

from app.schemas.products import ProductOut


class ChatRequest(BaseModel):
    user_id: str | None = Field(default=None, max_length=64)
    message: str = Field(min_length=1, max_length=1000)


class ChatReply(BaseModel):
    reply: str
    products: list[ProductOut]
    source: str
