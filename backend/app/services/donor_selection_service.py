"""Donor Selection Service for Panchayat Weather Intelligence.

Selects the most suitable donor Panchayat within homogeneous climate boundaries
based on normalized multi-dimensional terrain similarity and spatial proximity.
"""

import math
from typing import Dict, Any, Optional, List
import pandas as pd

from backend.app.services.feature_service import feature_service
from backend.app.services.climate_zone_service import climate_zone_service
from backend.app.services.terrain_similarity_service import terrain_similarity_service

def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Computes great-circle distance between two coordinate points in kilometers."""
    r = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2.0) ** 2
    return round(2.0 * r * math.atan2(math.sqrt(a), math.sqrt(1.0 - a)), 2)

class DonorSelectionService:
    def __init__(self):
        pass

    def select_best_donor(self, target_panchayat_id: str) -> Dict[str, Any]:
        """Identifies and selects the optimal donor Panchayat for terrain-transfer learning."""
        panchayats_df = feature_service.get_all_panchayats()
        if target_panchayat_id not in panchayats_df.index:
            raise KeyError(f"Panchayat '{target_panchayat_id}' does not exist.")

        target_data = feature_service.get_panchayat_data(target_panchayat_id)
        target_lat = float(target_data["latitude"])
        target_lon = float(target_data["longitude"])

        # 1. Climate zone constrained filtering
        cz_result = climate_zone_service.get_climate_zone_candidates(target_panchayat_id, panchayats_df)
        candidates = cz_result["candidates"]

        # If zero candidates in exact climate zone (rare edge case), fall back to all other panchayats
        if not candidates:
            candidates = [
                row.to_dict() for pid, row in panchayats_df.iterrows() if pid != target_panchayat_id
            ]

        # 2. Score and rank all candidates
        scored_candidates = []
        for cand in candidates:
            cand_id = cand["panchayat_id"] if "panchayat_id" in cand else cand.get("id")
            cand_lat = float(cand["latitude"])
            cand_lon = float(cand["longitude"])
            geo_dist = haversine_km(target_lat, target_lon, cand_lat, cand_lon)

            sim_result = terrain_similarity_service.compute_similarity(target_data, cand)

            scored_candidates.append({
                "donor_id": cand_id,
                "donor_name": cand.get("name", cand_id),
                "climate_zone": cand.get("climate_zone", ""),
                "similarity_score": sim_result["similarity_score"],
                "distance_km": geo_dist,
                "terrain_comparison": sim_result["terrain_comparison"],
                "weighted_distance": sim_result["weighted_distance"]
            })

        # Sort descending by similarity score, then ascending by distance
        scored_candidates.sort(key=lambda x: (-x["similarity_score"], x["distance_km"]))
        best_donor = scored_candidates[0]

        return {
            "target_panchayat_id": target_panchayat_id,
            "target_panchayat_name": target_data.get("name", target_panchayat_id),
            "target_climate_zone": target_data.get("climate_zone", ""),
            "best_donor": {
                "id": best_donor["donor_id"],
                "name": best_donor["donor_name"],
                "climate_zone": best_donor["climate_zone"],
                "similarity_score": best_donor["similarity_score"],
                "distance_km": best_donor["distance_km"],
                "terrain_comparison": best_donor["terrain_comparison"]
            },
            "top_candidates": scored_candidates[:5]
        }

donor_selection_service = DonorSelectionService()
