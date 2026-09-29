from pydantic import BaseModel
from typing import Optional

class TerrainFeatures(BaseModel):
    elevation_m: float
    slope_deg: float
    aspect_deg: float
    ruggedness_index: float
    coastal_distance_km: float
    ndvi: float
    soil_moisture: float

class PanchayatBase(BaseModel):
    id: str
    name: str
    block_id: str
    block_name: str
    district: str
    state: str
    latitude: float
    longitude: float
    climate_zone: str

class PanchayatDetail(PanchayatBase):
    terrain: Optional[TerrainFeatures] = None
