from types import SimpleNamespace

from app.db.models import Product, Profile
from app.services.stylist.stylist_service import ConciergeStylist, GeminiStylist, StylistService


def autumn():
    return Profile(user_id="u", season="Warm Autumn", gender="women", styles=["casual"], occasions=[],
                   favorite_stores=[])


def fake_product(title="Rust Kurta"):
    return Product(id="p" * 40, store="Myntra", url="https://x/p", title=title, price=999, color_name="rust")


class Search:
    def __init__(self, products=None):
        self.calls, self.products = [], products or [fake_product()]

    async def __call__(self, query, store):
        self.calls.append((query, store))
        return self.products


async def test_concierge_answers_color_questions_from_palette():
    reply = await ConciergeStylist().reply("Which colors suit me?", autumn(), Search())
    assert "Warm Autumn" in reply.reply and "rust" in reply.reply.lower() and not reply.products


async def test_concierge_finds_products_for_occasions_and_requests():
    search = Search()
    reply = await ConciergeStylist().reply("outfit for a wedding", autumn(), search)
    assert reply.products and "wedding" in search.calls[0][0]
    reply = await ConciergeStylist().reply("show me olive kurtas", None, search)
    assert search.calls[-1][0] == "olive kurtas" and reply.products


async def test_concierge_without_profile_invites_analysis():
    reply = await ConciergeStylist().reply("what colours suit me", None, Search())
    assert "color analysis" in reply.reply


class FakeChat:
    def __init__(self, responses):
        self.responses, self.sent = list(responses), []

    async def send_message(self, message):
        self.sent.append(message)
        return self.responses.pop(0)


def gemini_with(responses):
    chat = FakeChat(responses)
    client = SimpleNamespace(aio=SimpleNamespace(chats=SimpleNamespace(create=lambda model, config: chat)))
    return GeminiStylist("key", "test-model", 10, 2, client=client), chat


async def test_gemini_function_calling_grounds_reply_in_products():
    call = SimpleNamespace(name="search_products", args={"query": "rust kurta", "store": "Myntra"})
    stylist, chat = gemini_with([
        SimpleNamespace(function_calls=[call], text=None),
        SimpleNamespace(function_calls=[], text="Try this Rust Kurta from Myntra."),
    ])
    search = Search()
    reply = await StylistService(stylist).chat("u", "find me a kurta", autumn(), search)
    assert reply.source == "gemini" and reply.products and search.calls == [("rust kurta", "Myntra")]
    assert len(chat.sent) == 2  # user message, then the function response


async def test_gemini_failure_falls_back_to_concierge():
    class Broken:
        sessions: dict = {}

        async def reply(self, *args):
            raise RuntimeError("quota exceeded")

    reply = await StylistService(Broken()).chat("u", "which colors suit me", autumn(), Search())
    assert reply.source == "concierge" and "Warm Autumn" in reply.reply
