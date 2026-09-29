"""Confidence Calculation Service for Panchayat Weather Intelligence.

Computes an interpretable prototype confidence score based on donor terrain similarity,
spatial proximity to the meteorological grid and donor, local ruggedness, and model training representation.
"""

from typing import Dict, Any, List

HELDOUT_PANCHAYAT_IDS = [
    "TN_NIL_OOTY_01",
    "TN_NIL_CNR_02",
    "TN_NIL_KTG_03",
    "TN_NIL_GDL_04",
    "TN_NIL_KND_02",
    "TN_NIL_CNR_07"
]

class ConfidenceService:
    def __init__(self):
        pass

    def compute_confidence(
        self,
        panchayat_id: str,
        donor_similarity_score: float,
        donor_distance_km: float,
        grid_distance_km: float,
        ruggedness_m: float
    ) -> Dict[str, Any]:
        """Calculates the composite prototype heuristic confidence score and returns explanatory breakdown."""
        # 1. Base model score (derived from prototype validation R² > 0.98 on synthetic targets)
        base_model_score = 0.82

        # 2. Donor similarity bonus (0.0 to +0.10)
        similarity_bonus = (donor_similarity_score - 0.70) * 0.30
        similarity_component = round(max(0.0, min(0.10, similarity_bonus)), 4)

        # 3. Spatial proximity penalties
        donor_dist_penalty = round(min(0.06, donor_distance_km * 0.002), 4)
        grid_dist_penalty = round(min(0.04, grid_distance_km * 0.01), 4)

        # 4. Complex terrain ruggedness penalty
        terrain_penalty = round(min(0.05, (ruggedness_m / 35.0) * 0.05), 4)

        # 5. Spatial cold-start evaluation vs represented in training
        is_cold_start = panchayat_id in HELDOUT_PANCHAYAT_IDS
        training_status = "spatial_cold_start" if is_cold_start else "represented_in_training"
        cold_start_penalty = 0.04 if is_cold_start else 0.0

        # Composite score
        raw_score = (
            base_model_score +
            similarity_component -
            donor_dist_penalty -
            grid_dist_penalty -
            terrain_penalty -
            cold_start_penalty
        )
        final_score = round(max(0.50, min(0.95, raw_score)), 2)

        # Qualitative level
        if final_score >= 0.80:
            level = "HIGH"
        elif final_score >= 0.65:
            level = "MODERATE"
        else:
            level = "LOW"

        # Explanatory narrative clearly declaring heuristic prototype nature
        explanation = (
            f"Prototype heuristic confidence {int(final_score * 100)}% ({level}) based on synthetic-target "
            f"baseline model evaluation ({base_model_score}), donor similarity ({donor_similarity_score:.2f}), "
            f"proximity ({donor_distance_km:.1f}km to donor, {grid_distance_km:.1f}km to weather grid), "
            f"terrain ruggedness ({ruggedness_m:.1f}m), and training split ({training_status}). "
            f"Note: This score is a heuristic architectural indicator, not a calibrated forecast probability."
        )

        return {
            "score": final_score,
            "level": level,
            "score_type": "prototype_heuristic_confidence",
            "training_status": training_status,
            "explanation": explanation,
            "components": {
                "base_model_reliability": base_model_score,
                "donor_similarity_bonus": similarity_component,
                "donor_distance_penalty": donor_dist_penalty,
                "weather_grid_distance_penalty": grid_dist_penalty,
                "terrain_ruggedness_penalty": terrain_penalty,
                "cold_start_penalty": cold_start_penalty
            }
        }

confidence_service = ConfidenceService()
