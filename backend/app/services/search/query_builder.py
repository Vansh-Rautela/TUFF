"""Retailer search queries.

Only gender, the user's typed search and one style word go to retailers.
Profile details (name, age, body type, skin tone) never leave TUFF.
"""
import re

from app.services.search.product_attributes import normalize_gender

STOPWORDS = {
    "a", "an", "the", "and", "or", "for", "with", "to", "of", "in", "on", "me", "my", "i", "show", "find",
    "want", "need", "some", "please", "looking", "something", "clothes", "clothing", "outfit", "outfits",
    "buy", "get", "suggest", "recommend", "best", "good", "nice", "what", "should", "wear", "can", "you",
}
MAX_TERMS = 6
MAX_INPUT_CHARS = 120


def search_terms(text: str | None) -> list[str]:
    text = (text or "").strip()
    if not text or "\n" in text or len(text) > MAX_INPUT_CHARS:
        return []
    terms: list[str] = []
    for token in re.findall(r"[a-zA-Z][a-zA-Z'-]{1,24}", text.lower()):
        token = token.strip("'-")
        if len(token) > 1 and token not in STOPWORDS and token not in terms:
            terms.append(token)
    return terms[:MAX_TERMS]


def build_query(text: str | None = None, gender: str | None = None, styles: list[str] | None = None) -> str:
    parts: list[str] = []
    target = normalize_gender(gender)
    if target in {"men", "women"}:
        parts.append(target)
    terms = [t for t in search_terms(text) if t not in parts]
    parts.extend(terms)
    for style in styles or []:
        word = str(style).strip().lower()
        if re.fullmatch(r"[a-z][a-z -]{1,20}", word) and word not in parts:
            parts.append(word)
            break
    if not terms:
        parts.append("clothing" if len(parts) < 2 else "wear")
    return " ".join(parts)
