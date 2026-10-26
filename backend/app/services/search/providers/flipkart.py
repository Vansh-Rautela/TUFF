"""Flipkart: server-rendered product cards (`div[data-id]`)."""
import re
from urllib.parse import quote_plus

from selectolax.lexbor import LexborHTMLParser

from app.services.color.color_names import canonical_color
from app.services.search.product_attributes import parse_price
from app.services.search.providers.base import ProductCandidate, StoreProvider, make_candidate

_RUPEES = re.compile(r"₹\s*\|?\s*([\d,]+)")
_RATING = re.compile(r"^([1-5](?:\.\d)?)$")


class FlipkartProvider(StoreProvider):
    name = "Flipkart"
    base_url = "https://www.flipkart.com/"
    wait_selector = "div[data-id]"

    def search_url(self, query: str) -> str:
        return f"{self.base_url}search?q={quote_plus(query)}"

    def parse(self, html: str) -> list[ProductCandidate]:
        results = []
        for card in LexborHTMLParser(html).css("div[data-id]"):
            link = card.css_first('a[href*="/p/"]')
            if link is None:
                continue
            titled = card.css_first("a[title]")
            title = titled.attributes.get("title") if titled else link.text(strip=True)
            image = card.css_first("img")
            segments = [s for s in card.text(separator="|", strip=True).split("|") if s.strip()]
            prices = [parse_price(p) for p in _RUPEES.findall(card.text(separator="|", strip=True))]
            brand = segments[0] if segments and segments[0] != title and "₹" not in segments[0] else None
            rating = next((float(s) for s in segments if _RATING.match(s.strip())), None)
            # Fashion cards list the color on its own line after the title.
            color = next((s for s in segments if canonical_color(s)), None)
            candidate = make_candidate(
                self.name, self.base_url,
                url=(link.attributes.get("href") or "").split("&")[0],
                title=title,
                brand=brand,
                price=prices[0] if prices else None,
                mrp=prices[1] if len(prices) > 1 else None,
                image_url=image.attributes.get("src") if image else None,
                rating=rating,
                color=color,
            )
            if candidate:
                results.append(candidate)
        return results
