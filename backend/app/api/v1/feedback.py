"""Farmer Feedback API Routes."""
from fastapi import APIRouter
from typing import List
from backend.app.schemas.feedback import FarmerFeedbackCreate, FarmerFeedbackRecord
from backend.app.services.feedback_service import feedback_service

router = APIRouter()

@router.post("", response_model=FarmerFeedbackRecord)
def submit_feedback(feedback: FarmerFeedbackCreate):
    """Submit ground observation feedback from farmer/field user.
    TODO: Persist feedback record and trigger bias recalibration.
    """
    record = feedback_service.record_feedback(feedback.model_dump())
    return record

@router.get("", response_model=List[FarmerFeedbackRecord])
def list_feedback():
    """List historical farmer feedback submissions."""
    return feedback_service.list_feedback()
