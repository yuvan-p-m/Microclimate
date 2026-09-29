"""Panchayat Metadata API Routes."""
from fastapi import APIRouter, HTTPException
from typing import List
from backend.app.schemas.panchayat import PanchayatBase, PanchayatDetail

router = APIRouter()

@router.get("", response_model=List[PanchayatBase])
def list_panchayats():
    """List all available panchayats for demo region.
    TODO: Return populated list from processed data store.
    """
    return []

@router.get("/{panchayat_id}", response_model=PanchayatDetail)
def get_panchayat(panchayat_id: str):
    """Retrieve detailed terrain and climate metadata for a specific panchayat.
    TODO: Query panchayat by id.
    """
    raise HTTPException(status_code=404, detail="Panchayat not found (Skeleton)")
