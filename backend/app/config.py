from pathlib import Path
from pydantic import BaseModel

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
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]

settings = Settings()
