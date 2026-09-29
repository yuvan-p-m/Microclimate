"""Terrain Similarity Service for Panchayat Weather Intelligence.

Calculates multi-dimensional normalized topographic and land-surface similarity
between target and candidate donor Panchayats.
"""

import math
from typing import Dict, Any, List

class TerrainSimilarityService:
    def __init__(self):
        # Normalization ranges across Nilgiris District domain
        self.norm_ranges = {
            "elevation_m": (700.0, 2500.0),       # Range: 1800m
            "slope_deg": (0.0, 50.0),              # Range: 50°
            "ruggedness": (0.0, 35.0),             # Range: 35m
            "ndvi": (0.0, 1.0),                    # Range: 1.0
            "forest_fraction": (0.0, 1.0),         # Range: 1.0
            "cropland_fraction": (0.0, 0.5),       # Range: 0.5
        }
        # Multi-attribute importance weights summing to 1.0
        self.weights = {
            "elevation_m": 0.30,
            "slope_deg": 0.20,
            "ruggedness": 0.15,
            "aspect": 0.10,
            "ndvi": 0.10,
            "forest_fraction": 0.10,
            "cropland_fraction": 0.05
        }

    def _normalize(self, val: float, key: str) -> float:
        vmin, vmax = self.norm_ranges.get(key, (0.0, 1.0))
        return max(0.0, min(1.0, (val - vmin) / (vmax - vmin)))

    def compute_similarity(
        self,
        target_terrain: Dict[str, Any],
        candidate_terrain: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Calculates normalized terrain distance and returns a deterministic similarity score (0.0 to 1.0)."""
        # 1. Feature normalization differences
        diff_elev = self._normalize(float(target_terrain["elevation_m"]), "elevation_m") - \
                    self._normalize(float(candidate_terrain["elevation_m"]), "elevation_m")

        diff_slope = self._normalize(float(target_terrain["slope_deg"]), "slope_deg") - \
                     self._normalize(float(candidate_terrain["slope_deg"]), "slope_deg")

        diff_rug = self._normalize(float(target_terrain.get("ruggedness", 10.0)), "ruggedness") - \
                   self._normalize(float(candidate_terrain.get("ruggedness", 10.0)), "ruggedness")

        diff_ndvi = self._normalize(float(target_terrain["ndvi"]), "ndvi") - \
                    self._normalize(float(candidate_terrain["ndvi"]), "ndvi")

        diff_forest = self._normalize(float(target_terrain["forest_fraction"]), "forest_fraction") - \
                      self._normalize(float(candidate_terrain["forest_fraction"]), "forest_fraction")

        diff_crop = self._normalize(float(target_terrain["cropland_fraction"]), "cropland_fraction") - \
                    self._normalize(float(candidate_terrain["cropland_fraction"]), "cropland_fraction")

        # 2. Circular aspect distance
        asp_t = math.radians(float(target_terrain.get("aspect_deg", 180.0)))
        asp_c = math.radians(float(candidate_terrain.get("aspect_deg", 180.0)))
        # Angular distance normalized between 0 (identical) and 1 (opposite)
        diff_aspect = (1.0 - math.cos(asp_t - asp_c)) / 2.0

        # 3. Weighted Euclidean distance
        weighted_sq_sum = (
            self.weights["elevation_m"] * (diff_elev ** 2) +
            self.weights["slope_deg"] * (diff_slope ** 2) +
            self.weights["ruggedness"] * (diff_rug ** 2) +
            self.weights["aspect"] * (diff_aspect ** 2) +
            self.weights["ndvi"] * (diff_ndvi ** 2) +
            self.weights["forest_fraction"] * (diff_forest ** 2) +
            self.weights["cropland_fraction"] * (diff_crop ** 2)
        )
        distance = math.sqrt(weighted_sq_sum)

        # 4. Convert distance to similarity score in [0.0, 1.0]
        similarity_score = round(1.0 / (1.0 + distance), 4)

        return {
            "similarity_score": similarity_score,
            "weighted_distance": round(distance, 4),
            "terrain_comparison": {
                "elevation_diff_m": round(float(candidate_terrain["elevation_m"]) - float(target_terrain["elevation_m"]), 1),
                "slope_diff_deg": round(float(candidate_terrain["slope_deg"]) - float(target_terrain["slope_deg"]), 2),
                "ndvi_diff": round(float(candidate_terrain["ndvi"]) - float(target_terrain["ndvi"]), 3),
                "forest_fraction_diff": round(float(candidate_terrain["forest_fraction"]) - float(target_terrain["forest_fraction"]), 3),
            }
        }

terrain_similarity_service = TerrainSimilarityService()
