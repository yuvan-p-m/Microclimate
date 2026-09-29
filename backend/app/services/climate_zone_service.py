"""Climate Zone Service for Panchayat Weather Intelligence.

Enforces climate-zone constraints for terrain transfer learning, ensuring
donor selection and bias correction operate strictly within homogeneous agro-climatic boundaries.
"""

from typing import List, Dict, Any, Optional
import pandas as pd

class ClimateZoneService:
    def __init__(self):
        pass

    def get_climate_zone_candidates(
        self,
        target_panchayat_id: str,
        panchayats_df: pd.DataFrame
    ) -> Dict[str, Any]:
        """Identifies target's climate zone and retrieves all valid candidate Panchayats in that zone.

        Excludes the target Panchayat itself.
        """
        if target_panchayat_id not in panchayats_df.index:
            raise KeyError(f"Panchayat '{target_panchayat_id}' not found in registry.")

        target_row = panchayats_df.loc[target_panchayat_id]
        target_zone = target_row["climate_zone"]

        # Filter candidates in the same climate zone (excluding target)
        candidates = panchayats_df[
            (panchayats_df["climate_zone"] == target_zone) &
            (panchayats_df.index != target_panchayat_id)
        ]

        candidate_list = []
        for pid, crow in candidates.iterrows():
            candidate_list.append({
                "panchayat_id": pid,
                "name": crow.get("name", pid),
                "block_name": crow.get("block_name", ""),
                "climate_zone": crow["climate_zone"],
                "elevation_m": float(crow["elevation_m"]),
                "slope_deg": float(crow["slope_deg"]),
                "aspect_deg": float(crow.get("aspect_deg", 180.0)),
                "ruggedness": float(crow.get("ruggedness", 10.0)),
                "ndvi": float(crow["ndvi"]),
                "forest_fraction": float(crow["forest_fraction"]),
                "cropland_fraction": float(crow["cropland_fraction"]),
                "latitude": float(crow["latitude"]),
                "longitude": float(crow["longitude"])
            })

        return {
            "target_panchayat_id": target_panchayat_id,
            "target_climate_zone": target_zone,
            "candidates_count": len(candidate_list),
            "candidates": candidate_list,
            "metadata": {
                "classification_standard": "Data-Derived Agro-Climatic Heuristic",
                "boundary_type": "Strict Homogeneous Climate Constraint"
            }
        }

climate_zone_service = ClimateZoneService()
