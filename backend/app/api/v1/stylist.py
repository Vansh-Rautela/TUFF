from fastapi import APIRouter

from app.api.deps import ServicesDep, SessionDep, rate_limit
from app.schemas.stylist import ChatReply, ChatRequest
from app.services.recommendation.personalization import load_user_context, personalize
from app.services.search.query_builder import build_query

router = APIRouter(prefix="/stylist", tags=["stylist"])


@router.post("/chat", response_model=ChatReply, dependencies=[rate_limit("stylist")],
             summary="Ask the TUFF Stylist; replies can include real, ranked products")
async def chat(body: ChatRequest, services: ServicesDep, session: SessionDep):
    profile, taste = await load_user_context(session, body.user_id)

    async def search(text: str, store: str | None):
        query = build_query(text, profile.gender if profile else None)
        results = await services.search.search(query, services.search.resolve_stores([store] if store else []))
        products = [p for r in results for p in r.products]
        ranked = personalize(products, profile, taste)
        by_id = {p.id: p for p in products}
        return [by_id[p.id] for p in ranked]

    reply = await services.stylist.chat(body.user_id or "anonymous", body.message.strip(), profile, search)
    ranked = {p.id: p for p in personalize(reply.products, profile, taste)}
    return ChatReply(reply=reply.reply, products=[ranked[p.id] for p in reply.products if p.id in ranked],
                     source=reply.source)
