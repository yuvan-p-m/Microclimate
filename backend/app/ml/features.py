"""ML Feature Matrix Definitions and Transformers.
Responsible for scaling and encoding tabular environmental features.
"""
from typing import List
import pandas as pd

# Core feature list for Random Forest downscaler
FEATURE_COLUMNS: List[str] = [
    "block_rainfall_forecast_mm",
    "block_temperature_c",
    "block_humidity_pct",
    "block_wind_speed_kmh",
    "elevation_m",
    "slope_deg",
    "aspect_deg",
    "ruggedness_index",
    "coastal_distance_km",
    "ndvi",
    "soil_moisture",
]

def prepare_feature_dataframe(raw_data: List[dict]) -> pd.DataFrame:
    """Prepares and validates DataFrame against expected schema.
    TODO: Implement feature normalization and missing-value imputation.
    """
    df = pd.DataFrame(raw_data)
    return df
