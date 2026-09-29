"""Feature Service for Panchayat Weather Intelligence.

Loads Panchayat environmental attributes, retrieves mapped coarse INDmet meteorology,
and constructs the exact 33-feature tabular predictor row matching model training schema.
"""

import math
import json
from pathlib import Path
from typing import Dict, Any, Optional, List, Tuple
from datetime import datetime

import pandas as pd
import numpy as np

# Path definitions
SERVICE_DIR = Path(__file__).resolve().parent
APP_DIR = SERVICE_DIR.parent
BACKEND_DIR = APP_DIR.parent
DATA_DIR = BACKEND_DIR / "data"
PROCESSED_DIR = DATA_DIR / "processed"
MODELS_DIR = DATA_DIR / "models"

class FeatureService:
    def __init__(self):
        self.panchayats_df: Optional[pd.DataFrame] = None
        self.weather_df: Optional[pd.DataFrame] = None
        self.feature_names: Optional[List[str]] = None
        self.initialized = False

    def initialize(self):
        """Lazy load static datasets and feature schema."""
        if self.initialized:
            return

        master_path = PROCESSED_DIR / "panchayat_master.csv"
        mapping_path = PROCESSED_DIR / "panchayat_weather_grid_mapping.csv"
        weather_path = PROCESSED_DIR / "historical_weather.csv"
        feat_path = MODELS_DIR / "feature_names.json"

        if not master_path.exists():
            raise FileNotFoundError(f"Missing master panchayat dataset at {master_path}")
        if not mapping_path.exists():
            raise FileNotFoundError(f"Missing mapping dataset at {mapping_path}")
        if not weather_path.exists():
            raise FileNotFoundError(f"Missing historical weather dataset at {weather_path}")

        # 1. Load Panchayat Master & Mapping
        p_df = pd.read_csv(master_path)
        m_df = pd.read_csv(mapping_path)
        p_merged = p_df.merge(
            m_df[["panchayat_id", "weather_grid_latitude", "weather_grid_longitude", "distance_km"]],
            on="panchayat_id",
            how="left"
        ).rename(columns={"distance_km": "grid_distance_km"})

        p_merged.set_index("panchayat_id", inplace=True)
        self.panchayats_df = p_merged

        # 2. Load Historical Weather (indexed by grid lat/lon and date)
        w_df = pd.read_csv(weather_path)
        w_df["grid_key"] = (
            w_df["latitude"].round(4).astype(str) + "_" +
            w_df["longitude"].round(4).astype(str) + "_" +
            w_df["date"]
        )
        w_df.set_index("grid_key", inplace=True)
        self.weather_df = w_df

        # 3. Load Feature Names Schema
        if feat_path.exists():
            with open(feat_path, "r", encoding="utf-8") as f:
                self.feature_names = json.load(f)["features"]
        else:
            self.feature_names = None

        self.initialized = True

    def get_panchayat_data(self, panchayat_id: str) -> Dict[str, Any]:
        """Retrieves static terrain and environmental attributes for a Panchayat."""
        self.initialize()
        if panchayat_id not in self.panchayats_df.index:
            raise KeyError(f"Panchayat ID '{panchayat_id}' does not exist in master directory.")
        row = self.panchayats_df.loc[panchayat_id]
        return row.to_dict()

    def get_all_panchayats(self) -> pd.DataFrame:
        """Returns the full Panchayat master DataFrame."""
        self.initialize()
        return self.panchayats_df.copy()

    def get_coarse_weather(self, panchayat_id: str, date_str: str) -> Dict[str, float]:
        """Retrieves authentic coarse INDmet daily observations for the Panchayat's mapped grid cell."""
        self.initialize()
        p_data = self.get_panchayat_data(panchayat_id)
        grid_lat = round(float(p_data["weather_grid_latitude"]), 4)
        grid_lon = round(float(p_data["weather_grid_longitude"]), 4)
        grid_key = f"{grid_lat}_{grid_lon}_{date_str}"

        if grid_key not in self.weather_df.index:
            raise KeyError(
                f"No historical INDmet weather observation found for grid ({grid_lat}, {grid_lon}) on date '{date_str}'."
            )

        w_row = self.weather_df.loc[grid_key]
        return {
            "coarse_rainfall_mm": float(w_row["rainfall_mm"]),
            "coarse_tmax_c": float(w_row["temperature_max_c"]),
            "coarse_tmin_c": float(w_row["temperature_min_c"]),
            "coarse_tmean_c": float(w_row.get("temperature_mean_c", (w_row["temperature_max_c"] + w_row["temperature_min_c"]) / 2.0)),
            "weather_grid_latitude": grid_lat,
            "weather_grid_longitude": grid_lon,
            "grid_distance_km": float(p_data["grid_distance_km"]),
            "date": date_str
        }

    def build_feature_vector(
        self,
        panchayat_id: str,
        coarse_weather: Dict[str, float],
        date_str: str
    ) -> pd.DataFrame:
        """Constructs the exact 33-feature tabular vector for model prediction."""
        self.initialize()
        p_data = self.get_panchayat_data(panchayat_id)

        try:
            dt = pd.to_datetime(date_str)
        except Exception as e:
            raise ValueError(f"Invalid date format '{date_str}': {e}")

        month = int(dt.month)
        day_of_year = int(dt.timetuple().tm_yday)
        day_of_week = int(dt.weekday())

        doy_rad = 2.0 * math.pi * day_of_year / 365.25
        sin_doy = round(math.sin(doy_rad), 6)
        cos_doy = round(math.cos(doy_rad), 6)

        c_rain = float(coarse_weather["coarse_rainfall_mm"])
        c_tmax = float(coarse_weather["coarse_tmax_c"])
        c_tmin = float(coarse_weather["coarse_tmin_c"])
        c_tmean = round((c_tmax + c_tmin) / 2.0, 3)
        c_range = round(c_tmax - c_tmin, 3)
        c_rain_flag = 1 if c_rain > 0.0 else 0
        c_heavy_rain_flag = 1 if c_rain >= 10.0 else 0

        aspect_deg = float(p_data.get("aspect_deg", 180.0))
        aspect_sin = round(math.sin(math.radians(aspect_deg)), 6)
        aspect_cos = round(math.cos(math.radians(aspect_deg)), 6)

        cz = str(p_data.get("climate_zone", ""))
        cz_am = 1 if "Am" in cz and "Cwb" not in cz else 0
        cz_aw = 1 if "Aw" in cz or "BSh" in cz else 0
        cz_cfb = 1 if "Cfb" in cz else 0
        cz_cwb_am = 1 if "Cwb / Am" in cz or "Sub-Montane" in cz else 0

        raw_feat_dict = {
            "coarse_rainfall_mm": c_rain,
            "coarse_tmax_c": c_tmax,
            "coarse_tmin_c": c_tmin,
            "coarse_tmean_c": c_tmean,
            "coarse_temperature_range_c": c_range,
            "coarse_rain_flag": c_rain_flag,
            "coarse_heavy_rain_flag": c_heavy_rain_flag,
            "elevation_m": float(p_data["elevation_m"]),
            "slope_deg": float(p_data["slope_deg"]),
            "aspect_sin": aspect_sin,
            "aspect_cos": aspect_cos,
            "ruggedness_m": float(p_data.get("ruggedness", p_data.get("ruggedness_m", 10.0))),
            "coastal_distance_km": float(p_data["coastal_distance_km"]),
            "panchayat_latitude": float(p_data["latitude"]),
            "panchayat_longitude": float(p_data["longitude"]),
            "weather_grid_latitude": float(p_data["weather_grid_latitude"]),
            "weather_grid_longitude": float(p_data["weather_grid_longitude"]),
            "grid_distance_km": float(p_data["grid_distance_km"]),
            "cropland_fraction": float(p_data["cropland_fraction"]),
            "forest_fraction": float(p_data["forest_fraction"]),
            "grassland_fraction": float(p_data["grassland_fraction"]),
            "builtup_fraction": float(p_data["builtup_fraction"]),
            "water_fraction": float(p_data["water_fraction"]),
            "ndvi": float(p_data["ndvi"]),
            "month": month,
            "day_of_year": day_of_year,
            "day_of_week": day_of_week,
            "sin_day_of_year": sin_doy,
            "cos_day_of_year": cos_doy,
            "climate_zone_am_tropical_monsoon_wet_western_escarpment": cz_am,
            "climate_zone_aw_bsh_tropical_savanna_rainshadow_foothills": cz_aw,
            "climate_zone_cfb_cwb_subtropical_highland_montane": cz_cfb,
            "climate_zone_cwb_am_sub_montane_transitional": cz_cwb_am,
        }

        # Verify against authoritative feature ordering from training
        if self.feature_names:
            ordered_dict = {}
            for col in self.feature_names:
                if col not in raw_feat_dict:
                    raise KeyError(f"Missing required predictor feature '{col}' in constructed feature vector.")
                ordered_dict[col] = raw_feat_dict[col]
            X = pd.DataFrame([ordered_dict])
        else:
            X = pd.DataFrame([raw_feat_dict])

        # Strict validation checks
        if len(X.columns) != 33:
            raise ValueError(f"Feature vector has {len(X.columns)} columns, expected exactly 33.")
        if X.isnull().sum().sum() > 0:
            raise ValueError("Feature vector contains null/NaN values.")
        if np.isinf(X.select_dtypes(include=[np.number]).values).any():
            raise ValueError("Feature vector contains infinite values.")

        return X

feature_service = FeatureService()
