from pydantic import BaseModel

class DonorPanchayatInfo(BaseModel):
    target_panchayat_id: str
    donor_panchayat_id: str
    donor_panchayat_name: str
    climate_zone_matched: bool
    terrain_similarity_score: float
    distance_km: float
    historical_bias_offset_mm: float
