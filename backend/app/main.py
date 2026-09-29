"""FastAPI Application Entry Point."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.config import settings
from backend.app.api.routes import api_router
from backend.app.services.feature_service import feature_service
from backend.app.services.downscaling_service import downscaling_service
from backend.app.ml.predict import model_engine

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Hyperlocal Weather Downscaling for Rural Panchayats",
    version="0.1.0",
)

# Configure CORS for Vite frontend & Vercel deployments
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=settings.CORS_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    # Pre-warm and validate ML models and dataset caches on startup
    feature_service.initialize()
    downscaling_service.load_models()
    model_engine.load_model()

@app.get("/")
def read_root():
    return {
        "message": "Panchayat Weather Intelligence API",
        "status": "healthy",
        "version": "0.1.0"
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "version": "0.1.0"
    }

app.include_router(api_router, prefix=settings.API_V1_STR)

