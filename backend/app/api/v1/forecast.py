"""Panchayat Weather Forecast & Downscaling API Routes."""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from datetime import datetime

from backend.app.schemas.weather import PanchayatDownscaleResponse
from backend.app.services.downscaling_service import downscaling_service

router = APIRouter()

@router.get("/{panchayat_id}/forecast", response_model=PanchayatDownscaleResponse)
@router.get("/{panchayat_id}", response_model=PanchayatDownscaleResponse)
def get_panchayat_forecast(
    panchayat_id: str,
    date: str = Query(..., description="Target date in YYYY-MM-DD format (1981-01-01 to 2024-12-31)")
):
    """Retrieve hyperlocal downscaled weather forecast and terrain transfer analysis for a Panchayat."""
    try:
        # Validate date format
        datetime.strptime(date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid date format '{date}'. Expected YYYY-MM-DD (e.g., 2024-07-15)."
        )

    try:
        result = downscaling_service.predict_for_panchayat(panchayat_id=panchayat_id, target_date=date)
        return result
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e).strip("'\""))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except FileNotFoundError as e:
        raise HTTPException(status_code=500, detail=f"Server ML model error: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal downscaling error: {e}")
