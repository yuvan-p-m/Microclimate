"""Donor Panchayat Transfer API Routes."""
from fastapi import APIRouter, HTTPException
from backend.app.schemas.donor import DonorPanchayatInfo

router = APIRouter()

@router.get("/{panchayat_id}/donor", response_model=DonorPanchayatInfo)
def get_panchayat_donor(panchayat_id: str):
    """Retrieve matched donor panchayat and terrain similarity metrics.
    TODO: Query donor selection service.
    """
    raise HTTPException(status_code=404, detail="Donor not computed yet (Skeleton)")
