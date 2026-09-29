#!/usr/bin/env python3
"""Build ML Feature Dataset for Panchayat Weather Intelligence Downscaling.

Constructs the standardized (Panchayat x Date) feature dataset:
- Joins 31 Nilgiris Panchayats with their mapped 0.05° INDmet grid weather time series (1981-2024).
- Adds static topographic (Copernicus DEM 30m), land-cover (ESA WorldCover 10m), and vegetation (Sentinel-2 NDVI) features.
- Generates temporal (cyclical sin/cos day-of-year), weather-derived, and aspect-transformed features.
- One-hot encodes climate zones.
- Generates full provenance metadata, split strategies, scientific limitations, and diagnostics.

Outputs in backend/data/processed/ml_dataset/:
- downscaling_base.csv
- feature_metadata.json
- shared_grid_diagnostic.csv
- split_strategy.md
- scientific_notes.md
- feature_summary.csv
"""

import os
import sys
import json
import time
import math
from pathlib import Path
from datetime import datetime, timezone
from typing import Dict, Any, List, Tuple

import pandas as pd
import numpy as np

# Project root paths
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
PROCESSED_DIR = PROJECT_ROOT / "backend" / "data" / "processed"
ML_DIR = PROCESSED_DIR / "ml_dataset"
ML_DIR.mkdir(parents=True, exist_ok=True)

def build_ml_dataset():
    t_start = time.time()
    print("=" * 60)
    print("BUILDING ML FEATURE DATASET (PANCHAYAT x DATE)")
    print("=" * 60)

    # 1. Load validated datasets
    p_path = PROCESSED_DIR / "panchayat_master.csv"
    m_path = PROCESSED_DIR / "panchayat_weather_grid_mapping.csv"
    w_path = PROCESSED_DIR / "historical_weather.csv"

    if not (p_path.exists() and m_path.exists() and w_path.exists()):
        raise FileNotFoundError("Missing processed datasets. Run data preparation first.")

    p_df = pd.read_csv(p_path)
    m_df = pd.read_csv(m_path)
    w_df = pd.read_csv(w_path)

    print(f"Loaded {len(p_df)} Panchayats, {len(m_df)} Mappings, {len(w_df):,} Weather Records.")

    # 2. Merge Panchayat static attributes with weather grid mapping
    p_static = p_df[[
        "panchayat_id", "name", "block_name", "latitude", "longitude",
        "elevation_m", "slope_deg", "aspect_deg", "ruggedness", "coastal_distance_km",
        "cropland_fraction", "forest_fraction", "grassland_fraction", "builtup_fraction", "water_fraction",
        "ndvi", "climate_zone"
    ]].rename(columns={
        "name": "panchayat_name",
        "latitude": "panchayat_latitude",
        "longitude": "panchayat_longitude",
        "ruggedness": "ruggedness_m"
    })

    p_map = m_df[[
        "panchayat_id", "weather_grid_latitude", "weather_grid_longitude", "distance_km"
    ]].rename(columns={"distance_km": "grid_distance_km"})

    p_merged = p_static.merge(p_map, on="panchayat_id", how="inner")

    # 3. Merge with historical weather on (weather_grid_latitude, weather_grid_longitude)
    w_renamed = w_df.rename(columns={
        "latitude": "weather_grid_latitude",
        "longitude": "weather_grid_longitude",
        "rainfall_mm": "coarse_rainfall_mm",
        "temperature_max_c": "coarse_tmax_c",
        "temperature_min_c": "coarse_tmin_c",
        "temperature_mean_c": "coarse_tmean_c"
    })

    print("Merging Panchayat static features with daily weather series...")
    base_df = p_merged.merge(
        w_renamed,
        on=["weather_grid_latitude", "weather_grid_longitude"],
        how="inner"
    )

    n_rows = len(base_df)
    n_panchayats = base_df["panchayat_id"].nunique()
    date_min, date_max = base_df["date"].min(), base_df["date"].max()
    n_weather_cells = base_df[["weather_grid_latitude", "weather_grid_longitude"]].drop_duplicates().shape[0]

    print(f"Merge successful: {n_rows:,} rows ({n_panchayats} Panchayats x {base_df['date'].nunique():,} days).")

    # 4. Generate Temporal Features
    print("Generating temporal features (calendar & cyclical representations)...")
    dt_series = pd.to_datetime(base_df["date"])
    base_df["year"] = dt_series.dt.year.astype(int)
    base_df["month"] = dt_series.dt.month.astype(int)
    base_df["day_of_year"] = dt_series.dt.dayofyear.astype(int)
    base_df["day_of_week"] = dt_series.dt.dayofweek.astype(int)

    # Cyclical seasonal transformation: sin/cos(2*pi*day_of_year / 365.25)
    doy_rad = 2.0 * np.pi * base_df["day_of_year"] / 365.25
    base_df["sin_day_of_year"] = np.round(np.sin(doy_rad), 6)
    base_df["cos_day_of_year"] = np.round(np.cos(doy_rad), 6)

    # 5. Generate Weather-Derived Features
    print("Generating weather-derived physical features...")
    base_df["coarse_temperature_range_c"] = np.round(base_df["coarse_tmax_c"] - base_df["coarse_tmin_c"], 3)
    base_df["coarse_rain_flag"] = (base_df["coarse_rainfall_mm"] > 0.0).astype(int)
    # Project-defined feature threshold: coarse rainfall >= 10.0 mm/day
    base_df["coarse_heavy_rain_flag"] = (base_df["coarse_rainfall_mm"] >= 10.0).astype(int)

    # 6. Generate Aspect Trigonometric Transformation
    print("Generating circular aspect transformations...")
    aspect_rad = np.radians(base_df["aspect_deg"])
    base_df["aspect_sin"] = np.round(np.sin(aspect_rad), 6)
    base_df["aspect_cos"] = np.round(np.cos(aspect_rad), 6)

    # 7. Generate Climate Zone One-Hot Encodings
    print("Encoding climate zones...")
    # Clean column naming helper
    def sanitize_cz_name(cz: str) -> str:
        cz_clean = cz.lower().replace(" / ", "_").replace(" ", "_").replace("-", "_").replace("(", "").replace(")", "")
        return f"climate_zone_{cz_clean}"

    unique_zones = sorted(base_df["climate_zone"].unique().tolist())
    one_hot_cols = []
    for cz in unique_zones:
        col_name = sanitize_cz_name(cz)
        base_df[col_name] = (base_df["climate_zone"] == cz).astype(int)
        one_hot_cols.append(col_name)

    # 8. Add Reference/Target Candidate Columns (Explicitly Coarse Reference)
    base_df["reference_indmet_rainfall_mm"] = base_df["coarse_rainfall_mm"]
    base_df["reference_indmet_tmax_c"] = base_df["coarse_tmax_c"]
    base_df["reference_indmet_tmin_c"] = base_df["coarse_tmin_c"]

    # 9. Sort Deterministically by (panchayat_id, date)
    base_df.sort_values(by=["panchayat_id", "date"], inplace=True)
    base_df.reset_index(drop=True, inplace=True)

    # 10. Define Column Ordering & Roles
    id_cols = [
        "panchayat_id", "panchayat_name", "block_name", "date"
    ]
    geo_cols = [
        "panchayat_latitude", "panchayat_longitude",
        "weather_grid_latitude", "weather_grid_longitude", "grid_distance_km"
    ]
    weather_input_cols = [
        "coarse_rainfall_mm", "coarse_tmax_c", "coarse_tmin_c", "coarse_tmean_c",
        "coarse_temperature_range_c", "coarse_rain_flag", "coarse_heavy_rain_flag"
    ]
    terrain_cols = [
        "elevation_m", "slope_deg", "aspect_deg", "aspect_sin", "aspect_cos", "ruggedness_m", "coastal_distance_km"
    ]
    landcover_cols = [
        "cropland_fraction", "forest_fraction", "grassland_fraction", "builtup_fraction", "water_fraction"
    ]
    vegetation_cols = [
        "ndvi"
    ]
    temporal_cols = [
        "year", "month", "day_of_year", "day_of_week", "sin_day_of_year", "cos_day_of_year"
    ]
    climate_cols = ["climate_zone"] + one_hot_cols
    reference_cols = [
        "reference_indmet_rainfall_mm", "reference_indmet_tmax_c", "reference_indmet_tmin_c"
    ]

    all_ordered_columns = (
        id_cols + geo_cols + weather_input_cols + terrain_cols +
        landcover_cols + vegetation_cols + temporal_cols + climate_cols + reference_cols
    )

    base_df = base_df[all_ordered_columns]

    # 11. Validation Checks
    print("\nRunning ML dataset integrity validations...")
    assert len(base_df) == 498201, f"Expected 498,201 rows, got {len(base_df)}"
    assert base_df.duplicated(subset=["panchayat_id", "date"]).sum() == 0, "Duplicate panchayat-date rows found"
    assert (base_df["coarse_rainfall_mm"] >= 0.0).all(), "Negative coarse rainfall found"
    assert (base_df["coarse_tmax_c"] >= base_df["coarse_tmin_c"]).all(), "Coarse Tmax < Tmin found"
    assert (base_df["sin_day_of_year"].between(-1.000001, 1.000001)).all(), "sin_day_of_year out of [-1, 1]"
    assert (base_df["cos_day_of_year"].between(-1.000001, 1.000001)).all(), "cos_day_of_year out of [-1, 1]"
    assert (base_df["aspect_sin"].between(-1.000001, 1.000001)).all(), "aspect_sin out of [-1, 1]"
    assert (base_df["aspect_cos"].between(-1.000001, 1.000001)).all(), "aspect_cos out of [-1, 1]"
    assert base_df[id_cols + geo_cols + weather_input_cols + terrain_cols + temporal_cols].isnull().sum().sum() == 0, "Null values found in core features"
    print("All ML dataset validations PASSED.")

    # 12. Write downscaling_base.csv
    out_csv_path = ML_DIR / "downscaling_base.csv"
    print(f"\nWriting full base ML dataset ({len(base_df):,} rows x {len(base_df.columns)} cols) to {out_csv_path}...")
    base_df.to_csv(out_csv_path, index=False)
    csv_size_mb = out_csv_path.stat().st_size / (1024 * 1024)
    print(f"Saved downscaling_base.csv ({csv_size_mb:.2f} MB).")

    # 13. Generate feature_metadata.json
    ml_feature_columns = (
        weather_input_cols +
        ["elevation_m", "slope_deg", "aspect_sin", "aspect_cos", "ruggedness_m", "coastal_distance_km"] +
        landcover_cols + vegetation_cols +
        ["month", "day_of_year", "day_of_week", "sin_day_of_year", "cos_day_of_year"] +
        one_hot_cols
    )

    metadata_json = {
        "dataset_name": "Panchayat Weather Intelligence - Spatial Downscaling Base Table",
        "dataset_type": "spatial_downscaling_base",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "row_definition": "One Panchayat x Date combination",
        "total_rows": n_rows,
        "total_columns": len(all_ordered_columns),
        "spatial_extent": {
            "district": "Nilgiris",
            "state": "Tamil Nadu",
            "panchayat_count": n_panchayats,
            "weather_grid_cells_count": n_weather_cells,
            "latitude_bounds": [float(base_df["panchayat_latitude"].min()), float(base_df["panchayat_latitude"].max())],
            "longitude_bounds": [float(base_df["panchayat_longitude"].min()), float(base_df["panchayat_longitude"].max())]
        },
        "temporal_extent": {
            "start_date": date_min,
            "end_date": date_max,
            "total_days": int(base_df["date"].nunique())
        },
        "identifier_columns": id_cols,
        "coordinate_columns": geo_cols,
        "feature_columns": ml_feature_columns,
        "reference_columns": reference_cols,
        "excluded_columns": [
            {
                "column": "soil_moisture",
                "reason": "SOURCE_PENDING due to monolithic 14.96 GB archive on Zenodo 15469972."
            }
        ],
        "target_status": "NO_INDEPENDENT_PANCHAYAT_TARGET_AVAILABLE",
        "scientific_limitation": (
            "Reference values originate from the coarse 0.05° INDmet grid. The dataset does not contain "
            "independent in-situ Panchayat station rain-gauge or thermometer observations. A model trained on "
            "these features demonstrates spatial downscaling and terrain transfer learning methodology, "
            "not independently proven ground-truth prediction."
        )
    }

    meta_path = ML_DIR / "feature_metadata.json"
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(metadata_json, f, indent=2)
    print(f"Saved feature_metadata.json to {meta_path}.")

    # 14. Generate shared_grid_diagnostic.csv
    # Sample dates and show shared cells
    sample_dates = ["2024-07-15", "2024-10-20", "2023-01-10"]
    shared_diag_rows = []
    
    # Identify cells shared by multiple panchayats
    cell_p_counts = p_merged.groupby(["weather_grid_latitude", "weather_grid_longitude"]).agg(
        panchayat_count=("panchayat_id", "count"),
        panchayat_ids=("panchayat_id", lambda ids: "|".join(ids)),
        panchayat_names=("panchayat_name", lambda names: "|".join(names)),
        min_elev=("elevation_m", "min"),
        max_elev=("elevation_m", "max"),
        min_slope=("slope_deg", "min"),
        max_slope=("slope_deg", "max"),
        min_ndvi=("ndvi", "min"),
        max_ndvi=("ndvi", "max")
    ).reset_index()

    shared_cells = cell_p_counts[cell_p_counts["panchayat_count"] > 1]
    for _, cell_row in shared_cells.iterrows():
        lat, lon = cell_row["weather_grid_latitude"], cell_row["weather_grid_longitude"]
        for s_date in sample_dates:
            w_sample = base_df[
                (base_df["weather_grid_latitude"] == lat) &
                (base_df["weather_grid_longitude"] == lon) &
                (base_df["date"] == s_date)
            ]
            if len(w_sample) > 0:
                c_rain = float(w_sample["coarse_rainfall_mm"].iloc[0])
                c_tmax = float(w_sample["coarse_tmax_c"].iloc[0])
                c_tmin = float(w_sample["coarse_tmin_c"].iloc[0])
                shared_diag_rows.append({
                    "weather_grid_latitude": lat,
                    "weather_grid_longitude": lon,
                    "date": s_date,
                    "coarse_rainfall_mm": c_rain,
                    "coarse_tmax_c": c_tmax,
                    "coarse_tmin_c": c_tmin,
                    "panchayat_count": int(cell_row["panchayat_count"]),
                    "panchayat_ids": cell_row["panchayat_ids"],
                    "panchayat_names": cell_row["panchayat_names"],
                    "elevation_range_m": f"{cell_row['min_elev']:.1f} - {cell_row['max_elev']:.1f}",
                    "slope_range_deg": f"{cell_row['min_slope']:.2f} - {cell_row['max_slope']:.2f}",
                    "ndvi_range": f"{cell_row['min_ndvi']:.3f} - {cell_row['max_ndvi']:.3f}"
                })

    shared_diag_df = pd.DataFrame(shared_diag_rows)
    shared_diag_path = ML_DIR / "shared_grid_diagnostic.csv"
    shared_diag_df.to_csv(shared_diag_path, index=False)
    print(f"Saved shared_grid_diagnostic.csv ({len(shared_diag_df)} rows) to {shared_diag_path}.")

    # 15. Generate feature_summary.csv
    feature_summary_rows = []
    
    descriptions = {
        "panchayat_id": ("Unique administrative code for Panchayat / Town Panchayat", "IDENTIFIER", "string", "None", "Tamil Nadu Local Body Directory"),
        "panchayat_name": ("Official name of the Panchayat / Town Panchayat", "IDENTIFIER", "string", "None", "Tamil Nadu Local Body Directory"),
        "block_name": ("Taluka / Block administrative division", "IDENTIFIER", "string", "None", "Tamil Nadu Local Body Directory"),
        "date": ("Calendar date of meteorological observation (YYYY-MM-DD)", "IDENTIFIER", "string", "None", "Calendar"),
        "panchayat_latitude": ("WGS84 Latitude centroid of Panchayat settlement", "INPUT", "float", "degrees_north", "Administrative Directory"),
        "panchayat_longitude": ("WGS84 Longitude centroid of Panchayat settlement", "INPUT", "float", "degrees_east", "Administrative Directory"),
        "weather_grid_latitude": ("Latitude center of nearest INDmet 0.05° grid cell", "INPUT", "float", "degrees_north", "INDmet (Zenodo 15430548)"),
        "weather_grid_longitude": ("Longitude center of nearest INDmet 0.05° grid cell", "INPUT", "float", "degrees_east", "INDmet (Zenodo 15430548)"),
        "grid_distance_km": ("Geodesic distance between Panchayat centroid and INDmet cell center", "INPUT", "float", "km", "Haversine Distance"),
        "coarse_rainfall_mm": ("Coarse daily precipitation from INDmet 0.05° grid", "INPUT", "float", "mm/day", "INDmet (Zenodo 15430548)"),
        "coarse_tmax_c": ("Coarse daily maximum temperature from INDmet 0.05° grid", "INPUT", "float", "°C", "INDmet (Zenodo 15430548)"),
        "coarse_tmin_c": ("Coarse daily minimum temperature from INDmet 0.05° grid", "INPUT", "float", "°C", "INDmet (Zenodo 15430548)"),
        "coarse_tmean_c": ("Coarse daily mean temperature from INDmet 0.05° grid", "INPUT", "float", "°C", "INDmet (Zenodo 15430548)"),
        "coarse_temperature_range_c": ("Diurnal temperature range (coarse_tmax_c - coarse_tmin_c)", "DERIVED", "float", "°C", "Derived from INDmet"),
        "coarse_rain_flag": ("Binary precipitation indicator (1 if rainfall > 0 else 0)", "DERIVED", "int", "binary", "Derived from INDmet"),
        "coarse_heavy_rain_flag": ("Binary heavy rain indicator (1 if rainfall >= 10 mm/day else 0)", "DERIVED", "int", "binary", "Project-defined threshold"),
        "elevation_m": ("Mean surface elevation at Panchayat location", "INPUT", "float", "meters", "Copernicus GLO-30 DEM (30m)"),
        "slope_deg": ("Topographic slope angle computed via Horn's 3x3 algorithm", "INPUT", "float", "degrees", "Copernicus GLO-30 DEM"),
        "aspect_deg": ("Topographic compass aspect direction (0=N, 90=E, 180=S, 270=W)", "INPUT", "float", "degrees", "Copernicus GLO-30 DEM"),
        "aspect_sin": ("Trigonometric sine of topographic aspect angle", "DERIVED", "float", "unitless [-1,1]", "Derived from Aspect"),
        "aspect_cos": ("Trigonometric cosine of topographic aspect angle", "DERIVED", "float", "unitless [-1,1]", "Derived from Aspect"),
        "ruggedness_m": ("Riley et al. Terrain Ruggedness Index (TRI) in 3x3 window", "INPUT", "float", "meters", "Copernicus GLO-30 DEM"),
        "coastal_distance_km": ("Geodesic distance to nearest Peninsular India coastline", "INPUT", "float", "km", "Natural Earth 50m Coastline"),
        "cropland_fraction": ("Fractional area of agricultural cropland within 500m radius", "INPUT", "float", "fraction [0,1]", "ESA WorldCover 2021 (10m)"),
        "forest_fraction": ("Fractional area of tree canopy / forest within 500m radius", "INPUT", "float", "fraction [0,1]", "ESA WorldCover 2021 (10m)"),
        "grassland_fraction": ("Fractional area of shrub/grassland within 500m radius", "INPUT", "float", "fraction [0,1]", "ESA WorldCover 2021 (10m)"),
        "builtup_fraction": ("Fractional area of human settlement / built-up within 500m radius", "INPUT", "float", "fraction [0,1]", "ESA WorldCover 2021 (10m)"),
        "water_fraction": ("Fractional area of open water bodies within 500m radius", "INPUT", "float", "fraction [0,1]", "ESA WorldCover 2021 (10m)"),
        "ndvi": ("Normalized Difference Vegetation Index (B08-B04)/(B08+B04)", "INPUT", "float", "index [-1,1]", "Sentinel-2 L2A (10m)"),
        "year": ("Calendar year of meteorological observation", "INPUT", "int", "year", "Date string"),
        "month": ("Calendar month of meteorological observation (1-12)", "INPUT", "int", "month", "Date string"),
        "day_of_year": ("Day of year index (1-366)", "INPUT", "int", "day", "Date string"),
        "day_of_week": ("Day of week index (0=Monday, 6=Sunday)", "INPUT", "int", "day", "Date string"),
        "sin_day_of_year": ("Cyclic seasonal component: sin(2*pi*day_of_year / 365.25)", "DERIVED", "float", "unitless [-1,1]", "Derived from Calendar"),
        "cos_day_of_year": ("Cyclic seasonal component: cos(2*pi*day_of_year / 365.25)", "DERIVED", "float", "unitless [-1,1]", "Derived from Calendar"),
        "climate_zone": ("Agro-climatic / Koppen classification category", "IDENTIFIER", "string", "category", "Agro-climatic Rule"),
        "reference_indmet_rainfall_mm": ("Reference coarse precipitation (mapped INDmet grid value; NOT in-situ ground truth)", "REFERENCE", "float", "mm/day", "INDmet (Zenodo 15430548)"),
        "reference_indmet_tmax_c": ("Reference coarse maximum temperature (mapped INDmet grid value; NOT in-situ ground truth)", "REFERENCE", "float", "°C", "INDmet (Zenodo 15430548)"),
        "reference_indmet_tmin_c": ("Reference coarse minimum temperature (mapped INDmet grid value; NOT in-situ ground truth)", "REFERENCE", "float", "°C", "INDmet (Zenodo 15430548)"),
    }

    # Add climate one-hot descriptions
    for cz_col in one_hot_cols:
        descriptions[cz_col] = (f"One-hot binary indicator for {cz_col}", "INPUT", "int", "binary", "One-hot Encoding")

    for col in all_ordered_columns:
        desc, role, dtype, unit, source = descriptions.get(col, ("Feature column", "INPUT", str(base_df[col].dtype), "None", "Project"))
        missing_cnt = int(base_df[col].isnull().sum())
        
        if pd.api.types.is_numeric_dtype(base_df[col]):
            val_min = str(round(float(base_df[col].min()), 4))
            val_max = str(round(float(base_df[col].max()), 4))
        else:
            val_min = str(base_df[col].min())
            val_max = str(base_df[col].max())

        feature_summary_rows.append({
            "feature_name": col,
            "data_type": dtype,
            "source": source,
            "description": desc,
            "unit": unit,
            "role": role,
            "missing_count": missing_cnt,
            "min": val_min,
            "max": val_max
        })

    # Add excluded features
    feature_summary_rows.append({
        "feature_name": "soil_moisture",
        "data_type": "float",
        "source": "IIT Gandhinagar (Zenodo 15469972)",
        "description": "Root-zone soil moisture (quarantined due to monolithic 14.96 GB archive)",
        "unit": "m3/m3",
        "role": "EXCLUDED",
        "missing_count": n_rows,
        "min": "N/A",
        "max": "N/A"
    })

    feature_summary_df = pd.DataFrame(feature_summary_rows)
    feature_summary_path = ML_DIR / "feature_summary.csv"
    feature_summary_df.to_csv(feature_summary_path, index=False)
    print(f"Saved feature_summary.csv ({len(feature_summary_df)} features) to {feature_summary_path}.")

    # 16. Generate split_strategy.md
    split_strategy_md = """# Panchayat Weather Intelligence — Model Validation & Evaluation Strategy

To ensure scientific validity and prevent data leakage, the downscaling Random Forest model must **never use a naive random row-level train/test split**.

---

## 1. Why Random Row Splits Cause Fatal Data Leakage

The dataset contains:
1. **Strong Temporal Autocorrelation:** Weather on day $t$ is highly correlated with day $t-1$ and $t+1$.
2. **Repeated Static Spatial Topography:** The same Panchayat static attributes (elevation, slope, aspect, NDVI, land use) repeat across all 16,071 days.
3. **Shared Coarse Meteorological Cells:** Multiple compact Panchayats share identical coarse inputs from the same INDmet 0.05° grid square on any given date.

A standard random row shuffle would place day $t$ in the training set and day $t+1$ for the same Panchayat in the validation set, resulting in artificially inflated $R^2$ scores that do not reflect true downscaling generalization.

---

## 2. Strategy A: Temporal Holdout (Walk-Forward Validation)

Evaluates the model's ability to forecast future weather regimes under changing seasonal and interannual climate dynamics.

* **Training Set (38 Years):** `1981-01-01` to `2018-12-31`
  * Rows: $31 \\times 13,880 = 430,280$ rows (~86.4% of data)
* **Validation Set (3 Years):** `2019-01-01` to `2021-12-31`
  * Rows: $31 \\times 1,096 = 33,976$ rows (~6.8% of data)
* **Out-of-Time Test Set (3 Years):** `2022-01-01` to `2024-12-31`
  * Rows: $31 \\times 1,095 = 33,945$ rows (~6.8% of data)

---

## 3. Strategy B: Spatial / Panchayat Holdout (Cold-Start Terrain Transfer)

Evaluates whether the learned relationships between coarse atmospheric forcing and complex topography can transfer to an **unmonitored or unobserved Panchayat**.

* **Training Panchayats (80% / 25 Panchayats):**
  * Train model on 25 Panchayats representing varied terrain.
* **Held-Out Test Panchayats (20% / 6 Panchayats):**
  * Hold out representative Panchayats across distinct blocks and altitudinal zones:
    1. `TN_NIL_OOTY_01` (Udhagamandalam / Ooty - High Plateau, 2,233 m)
    2. `TN_NIL_CNR_02` (Hulical - Eastern Escarpment, 1,501 m)
    3. `TN_NIL_KTG_03` (Kodanad - Northern Rim Viewpoint, 1,827 m)
    4. `TN_NIL_GDL_04` (Pandalur - Western Low-Elevation Slopes, 1,123 m)
    5. `TN_NIL_KND_02` (Kil Kundah - Southern High Montane, 1,798 m)
    6. `TN_NIL_CNR_07` (Burliar - Deep Foothills, 782 m)
* **Evaluation Metric:** Mean Absolute Error (MAE) and bias transfer on held-out Panchayats.

---

## 4. Strategy C: Spatio-Temporal Grouped K-Fold Cross-Validation

* **Grouping:** Grouped by `(block_name, year_block)`.
* Ensures that neither the same geographic cluster nor the same temporal block is simultaneously present in both training and fold evaluation splits.
"""

    split_strat_path = ML_DIR / "split_strategy.md"
    with open(split_strat_path, "w", encoding="utf-8") as f:
        f.write(split_strategy_md)
    print(f"Saved split_strategy.md to {split_strat_path}.")

    # 17. Generate scientific_notes.md
    scientific_notes_md = """# Panchayat Weather Intelligence — Scientific & Methodological Notes

This document explicitly outlines the scope, assumptions, and foundational limitations of the current Panchayat Weather Intelligence prototype dataset.

---

## 1. Meteorological Input Origin (INDmet)
* All coarse meteorological inputs (`coarse_rainfall_mm`, `coarse_tmax_c`, `coarse_tmin_c`) originate from the **INDmet 0.05° (~5.5 km) daily gridded dataset** (Zenodo DOI: [10.5281/zenodo.15430548](https://doi.org/10.5281/zenodo.15430548)).
* The 31 Panchayats in Nilgiris District are mapped to the nearest authentic INDmet 0.05° grid center (mean distance: $1.96\\text{ km}$, maximum distance: $3.34\\text{ km}$).

---

## 2. Critical Scientific Target Limitation
* **The current dataset does NOT contain independent in-situ Panchayat station rain-gauge or thermometer observations.**
* Therefore, the columns `reference_indmet_rainfall_mm`, `reference_indmet_tmax_c`, and `reference_indmet_tmin_c` represent the coarse grid reference, not ground-truth sensor measurements at the village square.
* **Implication:** A model trained solely against these reference values is designed to demonstrate **spatial terrain downscaling methodology, cold-start donor selection, and bias-correction architecture**, but **cannot claim independent validation of true village-level precipitation**.

---

## 3. What the Future ML Downscaler Actually Learns
1. **Orographic Temperature Adjustment (Lapse Rate Learning):** The model learns the empirical vertical lapse rate (cooling with elevation from 782 m to 2,233 m) modulated by aspect and slope.
2. **Topographic Rain-Shadow & Escarpment Redistribution:** Modulating coarse precipitation based on slope steepness, mountain barrier aspect, and distance to coast.
3. **Microclimate & Surface Roughness Effects:** Accounting for terrain ruggedness (TRI) and land cover canopy fractions (ESA WorldCover 10m).

---

## 4. Soil Moisture Exclusion
* Root-zone soil moisture from Zenodo record 15469972 is currently flagged as `SOURCE_PENDING` and **excluded from the ML table** because the distribution only provides a monolithic 14.96 GB national archive without a spatial slicing API.

---

## 5. Panchayat Coordinate Provenance
* Panchayat latitude/longitude coordinates represent **manually compiled settlement centroids** from public administrative records (`PROVENANCE_UNVERIFIED`), not official cadastral GIS boundary survey polygons.

---

## 6. Climate Zone Categorization
* Climate zone labels represent a **data-derived agro-climatic heuristic** based on elevation (>1600 m Montane Cfb/Cwb, Western slopes Am, Rainshadow valleys Aw/BSh), rather than an official national climate atlas.
"""

    sci_notes_path = ML_DIR / "scientific_notes.md"
    with open(sci_notes_path, "w", encoding="utf-8") as f:
        f.write(scientific_notes_md)
    print(f"Saved scientific_notes.md to {sci_notes_path}.")

    t_end = time.time()
    elapsed = t_end - t_start

    # Print exact required terminal summary
    print("\n" + "=" * 58)
    print("PANCHAYAT WEATHER INTELLIGENCE - ML DATASET PREPARATION")
    print("=" * 58)
    print(f"Rows: {n_rows:,}")
    print(f"Panchayats: {n_panchayats}")
    print(f"Date range: {date_min} to {date_max} ({base_df['date'].nunique():,} days)")
    print(f"Weather grid cells: {n_weather_cells}")
    print(f"Columns: {len(all_ordered_columns)}")
    print(f"File size: {csv_size_mb:.2f} MB")
    print(f"Generation time: {elapsed:.2f}s")
    print()
    print(f"Required-field missing values: 0")
    print(f"Duplicate Panchayat/date rows: 0")
    print()
    print(f"Feature columns: {len(ml_feature_columns)}")
    print(f"Reference columns: {len(reference_cols)}")
    print()
    print("Independent Panchayat target available: NO")
    print("Scientific limitation: DOCUMENTED")
    print("Validation split strategy: DOCUMENTED")
    print()
    print("Artifacts created:")
    print(f"  * {out_csv_path}")
    print(f"  * {meta_path}")
    print(f"  * {shared_diag_path}")
    print(f"  * {split_strat_path}")
    print(f"  * {sci_notes_path}")
    print(f"  * {feature_summary_path}")
    print()
    print("Model training performed: NO")
    print("=" * 58)

if __name__ == "__main__":
    build_ml_dataset()
