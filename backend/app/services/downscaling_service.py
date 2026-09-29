"""Downscaling Pipeline Orchestrator Service for Panchayat Weather Intelligence.

Coordinates the complete end-to-end inference flow:
1. Panchayat selection & static environmental feature loading.
2. Mapped coarse INDmet meteorological retrieval.
3. 33-feature tabular vector construction matching model training schema.
4. Random Forest regression inferences for Rainfall, Tmax, and Tmin.
5. Climate-zone constrained candidate filtering.
6. Multi-attribute terrain similarity donor matching.
7. Donor bias correction & physical sanity enforcement.
8. Prototype confidence score calculation.
9. Structured response assembly conforming to Pydantic schemas.
"""

import json
from pathlib import Path
from typing import Dict, Any, Optional
from datetime import datetime, date

import pandas as pd
import numpy as np
import joblib

from backend.app.services.feature_service import feature_service
from backend.app.services.donor_selection_service import donor_selection_service
from backend.app.services.bias_correction_service import bias_correction_service
from backend.app.services.confidence_service import confidence_service

# Paths
SERVICE_DIR = Path(__file__).resolve().parent
APP_DIR = SERVICE_DIR.parent
BACKEND_DIR = APP_DIR.parent
DATA_DIR = BACKEND_DIR / "data"
MODELS_DIR = DATA_DIR / "models"

class DownscalingService:
    def __init__(self):
        self.rainfall_model = None
        self.tmax_model = None
        self.tmin_model = None
        self.models_loaded = False

    def load_models(self):
        """Loads trained Random Forest models from disk."""
        if self.models_loaded:
            return

        rf_rain_path = MODELS_DIR / "rainfall_rf.joblib"
        rf_tmax_path = MODELS_DIR / "tmax_rf.joblib"
        rf_tmin_path = MODELS_DIR / "tmin_rf.joblib"

        if not (rf_rain_path.exists() and rf_tmax_path.exists() and rf_tmin_path.exists()):
            raise FileNotFoundError(
                f"Missing trained Random Forest model files in {MODELS_DIR}. Run train_downscaling_models.py first."
            )

        self.rainfall_model = joblib.load(rf_rain_path)
        self.tmax_model = joblib.load(rf_tmax_path)
        self.tmin_model = joblib.load(rf_tmin_path)
        self.models_loaded = True

    def predict_for_panchayat(
        self,
        panchayat_id: str,
        target_date: Any
    ) -> Dict[str, Any]:
        """Executes the full downscaling inference pipeline for a given Panchayat and date."""
        self.load_models()

        # Format date string (YYYY-MM-DD)
        if isinstance(target_date, (datetime, date)):
            date_str = target_date.strftime("%Y-%m-%d")
        elif isinstance(target_date, str):
            date_str = target_date
        else:
            raise ValueError(f"Unsupported date type: {type(target_date)}")

        # 1. Load Panchayat Data & Coarse Weather
        p_data = feature_service.get_panchayat_data(panchayat_id)
        coarse_weather = feature_service.get_coarse_weather(panchayat_id, date_str)

        # 2. Construct 33-feature model vector
        X = feature_service.build_feature_vector(panchayat_id, coarse_weather, date_str)

        # 3. Model Inference (Raw Predictions)
        raw_rain = float(np.clip(self.rainfall_model.predict(X)[0], 0.0, None))
        raw_tmax = float(self.tmax_model.predict(X)[0])
        raw_tmin = float(self.tmin_model.predict(X)[0])

        raw_pred = {
            "rainfall_mm": round(raw_rain, 2),
            "tmax_c": round(raw_tmax, 2),
            "tmin_c": round(raw_tmin, 2)
        }

        # 4. Climate Zone & Donor Selection
        donor_res = donor_selection_service.select_best_donor(panchayat_id)
        best_donor = donor_res["best_donor"]

        # 5. Bias Correction & Physical Sanity Checks
        correction_res = bias_correction_service.apply_bias_correction(raw_pred, best_donor)
        final_pred = correction_res["final_prediction"]
        correction_details = correction_res["correction_details"]

        # 6. Confidence Score Calculation
        confidence_res = confidence_service.compute_confidence(
            panchayat_id=panchayat_id,
            donor_similarity_score=float(best_donor["similarity_score"]),
            donor_distance_km=float(best_donor["distance_km"]),
            grid_distance_km=float(coarse_weather["grid_distance_km"]),
            ruggedness_m=float(p_data.get("ruggedness", p_data.get("ruggedness_m", 10.0)))
        )

        # 7. Assemble Structured Response conforming to Pydantic Schema
        return {
            "panchayat": {
                "id": panchayat_id,
                "name": p_data.get("name", panchayat_id),
                "block": p_data.get("block_name", ""),
                "climate_zone": p_data.get("climate_zone", ""),
                "climate_zone_source": "project_derived_agro_climatic_classification",
                "elevation_m": float(p_data["elevation_m"]),
                "latitude": float(p_data["latitude"]),
                "longitude": float(p_data["longitude"])
            },
            "input_weather": {
                "coarse_rainfall_mm": float(coarse_weather["coarse_rainfall_mm"]),
                "coarse_tmax_c": float(coarse_weather["coarse_tmax_c"]),
                "coarse_tmin_c": float(coarse_weather["coarse_tmin_c"]),
                "date": date_str,
                "weather_grid_latitude": float(coarse_weather["weather_grid_latitude"]),
                "weather_grid_longitude": float(coarse_weather["weather_grid_longitude"]),
                "grid_distance_km": float(coarse_weather["grid_distance_km"])
            },
            "raw_prediction": raw_pred,
            "donor": {
                "id": best_donor["id"],
                "name": best_donor["name"],
                "climate_zone": best_donor["climate_zone"],
                "similarity_score": best_donor["similarity_score"],
                "distance_km": best_donor["distance_km"],
                "terrain_comparison": best_donor["terrain_comparison"]
            },
            "correction": correction_details,
            "final_prediction": final_pred,
            "confidence": confidence_res,
            "metadata": {
                "model_type": "RandomForestRegressor",
                "model_version": "v1.0",
                "target_source": "synthetic_training_target",
                "scientific_status": "prototype_not_real_world_validated",
                "disclaimer": (
                    "These predictions are generated by prototype models trained on synthetic local targets. "
                    "They demonstrate the downscaling and terrain transfer learning architecture, but do not "
                    "establish validated real-world meteorological forecast accuracy."
                )
            }
        }

downscaling_service = DownscalingService()
