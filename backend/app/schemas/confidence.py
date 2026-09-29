from pydantic import BaseModel

class ConfidenceBreakdown(BaseModel):
    panchayat_id: str
    overall_score: float  # 0.0 to 1.0
    donor_similarity_component: float
    terrain_complexity_penalty: float
    model_variance_component: float
    explanation: str
