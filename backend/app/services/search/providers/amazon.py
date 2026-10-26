"""Amazon India: search result cards, canonicalised to /dp/<ASIN> links."""
import re
from urllib.parse import quote_plus

from selectolax.lexbor import LexborHTMLParser

from app.services.search.product_attributes import parse_price
from app.services.search.providers.base import ProductCandidate, StoreProvider, make_candidate

_RATING = re.compile(r"([1-5](?:\.\d)?) out of 5")


class AmazonProvider(StoreProvider):
    name = "Amazon"
    base_url = "https://www.amazon.in/"
    wait_selector = "div[data-component-type='s-search-result']"

    def search_url(self, query: str) -> str:
        return f"{self.base_url}s?k={quote_plus(query)}"

    def parse(self, html: str) -> list[ProductCandidate]:
        results = []
        for card in LexborHTMLParser(html).css("div[data-component-type='s-search-result']"):
            asin = card.attributes.get("data-asin")
            if not asin:
                continue
            headings = [h.text(strip=True) for h in card.css("h2") if h.text(strip=True)]
            # Fashion results show the maker brand in a first, short h2 and the product name in a second.
            if len(headings) >= 2:
                brand, title = headings[0], headings[1]
            else:
                brand, title = None, headings[0] if headings else None
            price = card.css_first("span.a-price:not(.a-text-price) span.a-offscreen")
            mrp = card.css_first("span.a-price.a-text-price span.a-offscreen")
            image = card.css_first("img.s-image")
            rating = card.css_first("span.a-icon-alt")
            rating_match = _RATING.search(rating.text()) if rating else None
            candidate = make_candidate(
                self.name, self.base_url,
                url=f"/dp/{asin}",
                title=title,
                brand=brand,
                price=parse_price(price.text()) if price else None,
                mrp=parse_price(mrp.text()) if mrp else None,
                image_url=image.attributes.get("src") if image else None,
                rating=float(rating_match.group(1)) if rating_match else None,
            )
            if candidate:
                results.append(candidate)
        return results
