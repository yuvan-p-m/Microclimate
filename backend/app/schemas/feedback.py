from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class FarmerFeedbackCreate(BaseModel):
    panchayat_id: str
    observed_rainfall: bool
    rainfall_intensity: Optional[str] = Field(None, description="light, moderate, heavy, none")
    perceived_accuracy_rating: int = Field(..., ge=1, le=5, description="1 (poor) to 5 (excellent)")
    comments: Optional[str] = None

class FarmerFeedbackRecord(FarmerFeedbackCreate):
    id: str
    created_at: datetime
