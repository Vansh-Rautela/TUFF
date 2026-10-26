from fastapi import APIRouter

from app.api.v1 import analysis, health, products, stylist, users

api_router = APIRouter(prefix="/api/v1")
for module in (health, analysis, products, users, stylist):
    api_router.include_router(module.router)
