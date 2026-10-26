"""Myntra: results are embedded as JSON in `window.__myx`."""
import json
import re
from urllib.parse import quote

from app.services.search.providers.base import ProductCandidate, StoreProvider, make_candidate

_STATE = re.compile(r"window\.__myx\s*=\s*(\{.*?\})\s*</script>", re.S)


class MyntraProvider(StoreProvider):
    name = "Myntra"
    base_url = "https://www.myntra.com/"
    wait_selector = "li.product-base"

    def search_url(self, query: str) -> str:
        return self.base_url + quote(query.strip().lower().replace(" ", "-"))

    def parse(self, html: str) -> list[ProductCandidate]:
        match = _STATE.search(html)
        if not match:
            return []
        try:
            products = json.loads(match.group(1))["searchData"]["results"]["products"]
        except (ValueError, KeyError, TypeError):
            return []
        results = []
        for item in products:
            candidate = make_candidate(
                self.name, self.base_url,
                url=item.get("landingPageUrl"),
                title=item.get("productName"),
                brand=item.get("brand"),
                price=item.get("price"),
                mrp=item.get("mrp"),
                image_url=item.get("searchImage"),
                rating=item.get("rating") or None,
                category=(item.get("articleType") or {}).get("typeName"),
                gender=item.get("gender"),
                color=item.get("primaryColour"),
            )
            if candidate:
                results.append(candidate)
        return results
