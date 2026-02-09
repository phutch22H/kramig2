from fastapi import APIRouter

from src.api.v1.auth import router as auth_router
from src.api.v1.organizations import router as org_router
from src.api.v1.events import router as events_router
from src.api.v1.tickets import router as tickets_router
from src.api.v1.customers import router as customers_router
from src.api.v1.financials import router as financials_router
from src.api.v1.connectors import router as connectors_router
from src.api.v1.public import router as public_router
from src.api.v1.sharing import router as sharing_router

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth_router)
api_router.include_router(org_router)
api_router.include_router(events_router)
api_router.include_router(tickets_router)
api_router.include_router(customers_router)
api_router.include_router(financials_router)
api_router.include_router(connectors_router)
api_router.include_router(public_router)
api_router.include_router(sharing_router)
