"""Root API Router for Panchayat Weather Intelligence."""
from fastapi import APIRouter
from backend.app.api.v1 import panchayats, forecast, donor, feedback

api_router = APIRouter()

# Register routes with canonical and nested prefixes
api_router.include_router(panchayats.router, prefix="/panchayats", tags=["Panchayats"])
api_router.include_router(forecast.router, prefix="/forecast", tags=["Forecasts & Downscaling"])
api_router.include_router(forecast.router, prefix="/panchayats", tags=["Forecasts & Downscaling"])
api_router.include_router(donor.router, prefix="/donor", tags=["Donor Matching"])
api_router.include_router(donor.router, prefix="/panchayats", tags=["Donor Matching"])
api_router.include_router(feedback.router, prefix="/feedback", tags=["Farmer Feedback"])
