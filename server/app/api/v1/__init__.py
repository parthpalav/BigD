"""
API Version 1 Router
Aggregates all API endpoints
"""
from fastapi import APIRouter

from app.api.v1.endpoints import traffic, predictions, users, alerts, locations, insights

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(traffic.router, prefix="/traffic", tags=["Traffic Data"])
api_router.include_router(predictions.router, prefix="/predictions", tags=["Predictions"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(alerts.router, prefix="/alerts", tags=["Alerts"])
api_router.include_router(locations.router, prefix="/locations", tags=["Locations"])
api_router.include_router(insights.router, prefix="/insights", tags=["AI Insights"])
