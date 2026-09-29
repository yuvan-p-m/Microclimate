import os
from pathlib import Path
from pydantic import BaseModel, Field

def get_cors_origins() -> list[str]:
    default_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://microclimate.vercel.app",
        "https://microclimate.onrender.com",
    ]
    env_cors = os.getenv("CORS_ORIGINS")
    if env_cors:
        custom_origins = [orig.strip() for orig in env_cors.split(",") if orig.strip()]
        for orig in custom_origins:
            if orig not in default_origins:
                default_origins.append(orig)
    return default_origins

class Settings(BaseModel):
    PROJECT_NAME: str = "Panchayat Weather Intelligence"
    API_V1_STR: str = "/api/v1"
    
    # Base directories
    BASE_DIR: Path = Path(__file__).resolve().parent.parent
    DATA_DIR: Path = BASE_DIR / "data"
    RAW_DATA_DIR: Path = DATA_DIR / "raw"
    PROCESSED_DATA_DIR: Path = DATA_DIR / "processed"
    SIMULATED_DATA_DIR: Path = DATA_DIR / "simulated"
    MODELS_DIR: Path = DATA_DIR / "models"
    FEEDBACK_DIR: Path = DATA_DIR / "feedback"
    
    # CORS Origins
    CORS_ORIGINS: list[str] = Field(default_factory=get_cors_origins)
    CORS_ORIGIN_REGEX: str = r"^https://.*\.vercel\.app$"

settings = Settings()

