#!/usr/bin/env python3
"""Build Synthetic Local-Weather Target Dataset for Panchayat Weather Intelligence.

Constructs a reproducible, physically plausible synthetic local weather target dataset
for ML downscaling prototype development:
- Derived from real coarse INDmet gridded meteorology (1981-2024) and high-resolution
  Panchayat environmental/topographic features (Copernicus DEM 30m, ESA WorldCover, Sentinel-2 NDVI).
- Employs deterministic physical lapse-rate adjustments (0.0065 °C/m), solar radiation
  aspect modulation, forest canopy thermal buffering, and orographic precipitation scaling.
- Applies bounded stochastic variations using a fixed random seed (42) for exact reproducibility.
- Explicitly labeled as SYNTHETIC to ensure scientific integrity without claiming ground-truth status.

Outputs in backend/data/simulated/:
- synthetic_local_weather_targets.csv
- synthetic_weather_metadata.json
- README.md
"""

import json
import time
from pathlib import Path
from datetime import datetime, timezone
from typing import Dict, Any

import pandas as pd
import numpy as np

# Project root paths
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
PROCESSED_DIR = PROJECT_ROOT / "backend" / "data" / "processed"
SIMULATED_DIR = PROJECT_ROOT / "backend" / "data" / "simulated"
ML_DATASET_DIR = PROCESSED_DIR / "ml_dataset"
SIMULATED_DIR.mkdir(parents=True, exist_ok=True)

# Configuration Constants
RANDOM_SEED = 42
GENERATION_VERSION = "v1.0"
DEFAULT_LAPSE_RATE_C_PER_M = 0.0065  # 6.5 °C / 1000 m environmental lapse rate
REFERENCE_ELEVATION_M = 1600.0       # Regional mean elevation baseline for Nilgiris study area
MIN_DIURNAL_RANGE_C = 2.0            # Physical minimum threshold for Tmax - Tmin

def build_synthetic_targets():
    t_start = time.time()
    print("=" * 65)
    print("PANCHAYAT WEATHER INTELLIGENCE — SYNTHETIC TARGET GENERATION")
    print("=" * 65)

    base_path = ML_DATASET_DIR / "downscaling_base.csv"
    if not base_path.exists():
        raise FileNotFoundError(f"Missing base ML dataset: {base_path}")

    print(f"Loading base feature table from {base_path}...")
    df = pd.read_csv(base_path)
    n_rows = len(df)
    n_panchayats = df["panchayat_id"].nunique()
    date_min, date_max = df["date"].min(), df["date"].max()
    print(f"Loaded {n_rows:,} rows across {n_panchayats} Panchayats ({date_min} to {date_max}).")

    # Set fixed random seed for 100% deterministic reproducibility
    np.random.seed(RANDOM_SEED)

    print("\nGenerating physically plausible synthetic local weather targets...")

    # 1. Temperature Adjustments
    # -------------------------------------------------------------
    # a. Orographic elevation lapse rate adjustment relative to reference height
    #    Delta_T_elev = -Gamma * (elevation - z_ref)
    delta_elev = -DEFAULT_LAPSE_RATE_C_PER_M * (df["elevation_m"] - REFERENCE_ELEVATION_M)

    # b. Solar radiation aspect & slope modulation
    #    In Nilgiris (~11.4°N), SE facing slopes receive early direct solar heating, NW slopes are shaded.
    aspect_rad = np.radians(df["aspect_deg"] - 135.0)
    rad_factor = np.clip(np.cos(aspect_rad) * (df["slope_deg"] / 45.0), -1.0, 1.0)
    delta_rad = 0.35 * rad_factor

    # c. Land-cover thermal buffering (forest cooling during day / insulating at night, built-up warming)
    delta_tmax_forest = -0.40 * df["forest_fraction"]
    delta_tmin_forest = +0.25 * df["forest_fraction"]
    delta_builtup = +0.30 * df["builtup_fraction"]

    # d. Bounded stochastic variation (deterministic with seed 42)
    eps_tmax = np.clip(np.random.normal(0.0, 0.15, n_rows), -0.40, 0.40)
    eps_tmin = np.clip(np.random.normal(0.0, 0.15, n_rows), -0.40, 0.40)

    # Combined raw synthetic temperatures
    tmax_raw = df["coarse_tmax_c"] + delta_elev + delta_rad + delta_tmax_forest + delta_builtup + eps_tmax
    tmin_raw = df["coarse_tmin_c"] + delta_elev - 0.5 * delta_rad + delta_tmin_forest + delta_builtup + eps_tmin

    # Ensure physical constraint: Tmax >= Tmin + MIN_DIURNAL_RANGE_C
    diurnal_diff = tmax_raw - tmin_raw
    too_close = diurnal_diff < MIN_DIURNAL_RANGE_C
    if too_close.any():
        midpoint = 0.5 * (tmax_raw + tmin_raw)
        tmax_syn = np.where(too_close, midpoint + (MIN_DIURNAL_RANGE_C / 2.0), tmax_raw)
        tmin_syn = np.where(too_close, midpoint - (MIN_DIURNAL_RANGE_C / 2.0), tmin_raw)
    else:
        tmax_syn = tmax_raw
        tmin_syn = tmin_raw

    synthetic_tmax = np.round(tmax_syn, 2)
    synthetic_tmin = np.round(tmin_syn, 2)

    # 2. Rainfall Adjustments
    # -------------------------------------------------------------
    # a. Orographic elevation multiplier: high-altitude condensation enhancement
    f_elev = np.clip(1.0 + 0.00015 * (df["elevation_m"] - REFERENCE_ELEVATION_M), 0.75, 1.35)

    # b. Slope steepness / vertical updraft trigger
    f_slope = np.clip(1.0 + 0.004 * df["slope_deg"], 0.90, 1.25)

    # c. Vegetation canopy moisture feedback
    f_veg = np.clip(1.0 + 0.10 * (df["ndvi"] - 0.50), 0.90, 1.15)

    # Combined local multiplier
    f_local = np.clip(f_elev * f_slope * f_veg, 0.70, 1.45)

    # d. Multiplicative stochastic variation on rain days
    eps_rain = np.clip(np.random.normal(0.0, 0.06, n_rows), -0.15, 0.15)

    # Dry days remain strictly dry (rainfall = 0.0)
    synthetic_rain = np.where(
        df["coarse_rainfall_mm"] > 0.0,
        np.maximum(0.0, df["coarse_rainfall_mm"] * f_local * (1.0 + eps_rain)),
        0.0
    )
    synthetic_rain = np.round(synthetic_rain, 2)

    # 3. Assemble Output Target DataFrame
    # -------------------------------------------------------------
    target_df = pd.DataFrame({
        "panchayat_id": df["panchayat_id"],
        "panchayat_name": df["panchayat_name"],
        "block_name": df["block_name"],
        "date": df["date"],
        "coarse_rainfall_mm": df["coarse_rainfall_mm"],
        "coarse_tmax_c": df["coarse_tmax_c"],
        "coarse_tmin_c": df["coarse_tmin_c"],
        "synthetic_rainfall_mm": synthetic_rain,
        "synthetic_tmax_c": synthetic_tmax,
        "synthetic_tmin_c": synthetic_tmin,
        "target_source": "synthetic",
        "generation_version": GENERATION_VERSION,
        "random_seed": RANDOM_SEED
    })

    # Sort deterministically
    target_df.sort_values(by=["panchayat_id", "date"], inplace=True)
    target_df.reset_index(drop=True, inplace=True)

    # 4. Rigorous Automated Validation Checks
    # -------------------------------------------------------------
    print("\nRunning comprehensive target validation checks...")
    assert len(target_df) == n_rows, f"Row count mismatch: expected {n_rows}, got {len(target_df)}"
    assert target_df.duplicated(subset=["panchayat_id", "date"]).sum() == 0, "Duplicate Panchayat-date combinations found"
    assert target_df["panchayat_id"].nunique() == 31, f"Expected 31 Panchayats, got {target_df['panchayat_id'].nunique()}"
    assert target_df["date"].nunique() == 16071, f"Expected 16,071 dates, got {target_df['date'].nunique()}"
    assert target_df["synthetic_rainfall_mm"].isnull().sum() == 0, "Null values in synthetic rainfall"
    assert target_df["synthetic_tmax_c"].isnull().sum() == 0, "Null values in synthetic Tmax"
    assert target_df["synthetic_tmin_c"].isnull().sum() == 0, "Null values in synthetic Tmin"
    assert (target_df["synthetic_rainfall_mm"] >= 0.0).all(), "Negative synthetic rainfall values found"
    assert (target_df["synthetic_tmax_c"] >= target_df["synthetic_tmin_c"]).all(), "Violations of synthetic Tmax >= Tmin"
    assert not np.isinf(target_df["synthetic_rainfall_mm"]).any(), "Infinite values in synthetic rainfall"
    assert not np.isinf(target_df["synthetic_tmax_c"]).any(), "Infinite values in synthetic Tmax"
    assert not np.isinf(target_df["synthetic_tmin_c"]).any(), "Infinite values in synthetic Tmin"

    # Verify dry day preservation
    dry_coarse_mask = target_df["coarse_rainfall_mm"] == 0.0
    assert (target_df.loc[dry_coarse_mask, "synthetic_rainfall_mm"] == 0.0).all(), "Non-zero synthetic rain on dry coarse days"

    print("All 13 validation checks PASSED successfully.")

    # 5. Save synthetic_local_weather_targets.csv
    # -------------------------------------------------------------
    csv_out_path = SIMULATED_DIR / "synthetic_local_weather_targets.csv"
    print(f"\nWriting synthetic local weather targets ({len(target_df):,} rows) to {csv_out_path}...")
    target_df.to_csv(csv_out_path, index=False)
    csv_size_mb = csv_out_path.stat().st_size / (1024 * 1024)
    print(f"Saved {csv_out_path.name} ({csv_size_mb:.2f} MB).")

    # 6. Save synthetic_weather_metadata.json
    # -------------------------------------------------------------
    metadata = {
        "dataset_name": "Panchayat Weather Intelligence - Synthetic Local Weather Targets",
        "dataset_type": "synthetic_downscaling_target",
        "generation_date": datetime.now(timezone.utc).isoformat(),
        "generation_version": GENERATION_VERSION,
        "random_seed": RANDOM_SEED,
        "spatial_extent": {
            "district": "Nilgiris",
            "state": "Tamil Nadu, India",
            "number_of_panchayats": int(target_df["panchayat_id"].nunique()),
            "panchayat_ids": sorted(target_df["panchayat_id"].unique().tolist())
        },
        "temporal_extent": {
            "start_date": date_min,
            "end_date": date_max,
            "total_days": int(target_df["date"].nunique()),
            "total_rows": int(len(target_df))
        },
        "variables_generated": {
            "synthetic_rainfall_mm": {
                "unit": "mm/day",
                "description": "Synthetic local precipitation target derived from INDmet with orographic and topographic scaling.",
                "min": float(target_df["synthetic_rainfall_mm"].min()),
                "max": float(target_df["synthetic_rainfall_mm"].max()),
                "mean": float(round(target_df["synthetic_rainfall_mm"].mean(), 3)),
                "median": float(round(target_df["synthetic_rainfall_mm"].median(), 3))
            },
            "synthetic_tmax_c": {
                "unit": "°C",
                "description": "Synthetic local daily maximum temperature target with vertical lapse rate and microclimate adjustments.",
                "min": float(target_df["synthetic_tmax_c"].min()),
                "max": float(target_df["synthetic_tmax_c"].max()),
                "mean": float(round(target_df["synthetic_tmax_c"].mean(), 3))
            },
            "synthetic_tmin_c": {
                "unit": "°C",
                "description": "Synthetic local daily minimum temperature target with vertical lapse rate and nocturnal canopy buffering.",
                "min": float(target_df["synthetic_tmin_c"].min()),
                "max": float(target_df["synthetic_tmin_c"].max()),
                "mean": float(round(target_df["synthetic_tmin_c"].mean(), 3))
            }
        },
        "source_datasets": [
            "backend/data/processed/ml_dataset/downscaling_base.csv",
            "backend/data/processed/historical_weather.csv (INDmet Zenodo 15430548)",
            "backend/data/processed/panchayat_master.csv (Copernicus DEM 30m, ESA WorldCover 10m, Sentinel-2 NDVI)"
        ],
        "formulas_and_adjustments_used": {
            "temperature_lapse_rate": f"Delta_T_elev = -{DEFAULT_LAPSE_RATE_C_PER_M} * (elevation_m - {REFERENCE_ELEVATION_M})",
            "solar_radiation_aspect": "Delta_T_rad = 0.35 * clip(cos(radians(aspect_deg - 135)) * (slope_deg / 45), -1, 1)",
            "vegetation_buffering": "Delta_Tmax_forest = -0.40 * forest_fraction, Delta_Tmin_forest = +0.25 * forest_fraction",
            "builtup_effect": "Delta_T_urban = +0.30 * builtup_fraction",
            "temperature_stochastic": "eps_T ~ Normal(0, 0.15) clipped to [-0.40, 0.40]",
            "diurnal_constraint": f"Tmax >= Tmin + {MIN_DIURNAL_RANGE_C} °C",
            "rainfall_orographic_scaling": "F_local = clip(f_elev * f_slope * f_veg, 0.70, 1.45)",
            "rainfall_stochastic": "eps_rain ~ Normal(0, 0.06) clipped to [-0.15, 0.15] (applied only on rain days)"
        },
        "distribution_comparison": {
            "rainfall": {
                "coarse_mean": float(round(df["coarse_rainfall_mm"].mean(), 3)),
                "synthetic_mean": float(round(target_df["synthetic_rainfall_mm"].mean(), 3)),
                "coarse_max": float(df["coarse_rainfall_mm"].max()),
                "synthetic_max": float(target_df["synthetic_rainfall_mm"].max())
            },
            "tmax": {
                "coarse_mean": float(round(df["coarse_tmax_c"].mean(), 3)),
                "synthetic_mean": float(round(target_df["synthetic_tmax_c"].mean(), 3)),
                "coarse_min": float(df["coarse_tmax_c"].min()),
                "synthetic_min": float(target_df["synthetic_tmax_c"].min()),
                "coarse_max": float(df["coarse_tmax_c"].max()),
                "synthetic_max": float(target_df["synthetic_tmax_c"].max())
            },
            "tmin": {
                "coarse_mean": float(round(df["coarse_tmin_c"].mean(), 3)),
                "synthetic_mean": float(round(target_df["synthetic_tmin_c"].mean(), 3)),
                "coarse_min": float(df["coarse_tmin_c"].min()),
                "synthetic_min": float(target_df["synthetic_tmin_c"].min()),
                "coarse_max": float(df["coarse_tmin_c"].max()),
                "synthetic_max": float(target_df["synthetic_tmin_c"].max())
            }
        },
        "scientific_integrity_statements": {
            "is_synthetic": True,
            "is_ground_truth": False,
            "statement": (
                "These target values are deterministically simulated using physical terrain downscaling heuristics "
                "(lapse rates, slope-aspect radiation, and land-cover buffering) solely for machine learning model "
                "architecture prototyping, pipeline verification, and bias-correction scaffolding. They are NOT "
                "empirical in-situ weather station observations and MUST NOT be claimed as real-world ground-truth "
                "measurements or used to claim validated real-world meteorological predictive skill."
            )
        }
    }

    json_out_path = SIMULATED_DIR / "synthetic_weather_metadata.json"
    with open(json_out_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    print(f"Saved {json_out_path.name}.")

    # 7. Save backend/data/simulated/README.md
    # -------------------------------------------------------------
    readme_content = """# Synthetic Local Weather Targets

## 1. Why Synthetic Targets Are Used
In the current prototype phase of **Panchayat Weather Intelligence**, long-term daily in-situ station observations across all 31 Panchayats in the Nilgiris are not freely downloadable via unrestricted public APIs (as established during the independent weather source audit, historical daily records from IMD observatories require administrative data requests via `dsp.imdpune.gov.in`).

To develop and test the **Random Forest downscaling pipeline, cold-start donor selection, and bias-correction architecture** without stalling, a clean, physically plausible synthetic target dataset is provided.

---

## 2. Real vs. Synthetic Data Provenance

| Component | Provenance | Source Dataset | Notes |
| :--- | :--- | :--- | :--- |
| **Coarse Weather Inputs** | **REAL** | INDmet 0.05° Gridded Data (`Zenodo 15430548`) | Real 1981–2024 daily precipitation, Tmax, and Tmin. |
| **Panchayat Topography** | **REAL** | Copernicus GLO-30 DEM (30m) | Real elevation (782m to 2234m), slope, aspect, and TRI. |
| **Panchayat Land Cover** | **REAL** | ESA WorldCover 2021 (10m) | Real cropland, forest, built-up, and water fractions. |
| **Panchayat Vegetation** | **REAL** | Sentinel-2 L2A (10m) | Real NDVI vegetation indices. |
| **Local Weather Targets** | **SYNTHETIC** | Generated via `build_synthetic_weather_targets.py` | `synthetic_rainfall_mm`, `synthetic_tmax_c`, `synthetic_tmin_c`. |

---

## 3. How the Synthetic Targets Are Generated

The synthetic local weather targets are computed deterministically from real coarse meteorology and high-resolution environmental features:

### A. Temperature (Tmax & Tmin)
$$\\Delta T_{\\text{elev}} = -0.0065 \\times (\\text{elevation\\_m} - 1600.0)$$
* **Lapse Rate:** Standard environmental lapse rate of $0.0065\\text{ }^\\circ\\text{C}/\\text{m}$ ($6.5\\text{ }^\\circ\\text{C}/\\text{km}$) applied relative to the regional mean elevation ($1600\\text{ m}$).
* **Solar Radiation:** Aspect and slope modulation (SE slopes receive enhanced daytime heating).
* **Canopy & Urban Effects:** Forest canopy cooling for $T_{\\text{max}}$ ($-0.40 \\times \\text{forest\\_fraction}$), night-time buffering for $T_{\\text{min}}$ ($+0.25 \\times \\text{forest\\_fraction}$), and built-up thermal retention ($+0.30 \\times \\text{builtup\\_fraction}$).
* **Physical Constraint:** $T_{\\text{max}} \\ge T_{\\text{min}} + 2.0\\text{ }^\\circ\\text{C}$ strictly enforced.

### B. Precipitation (Rainfall)
$$P_{\\text{syn}} = \\max\\left(0.0, P_{\\text{coarse}} \\times F_{\\text{local}} \\times (1.0 + \\eta)\\right)$$
* **Dry Day Preservation:** If $P_{\\text{coarse}} = 0.0$, $P_{\\text{syn}} = 0.0$ strictly.
* **Orographic Multiplier:** $F_{\\text{local}} = f_{\\text{elev}} \\times f_{\\text{slope}} \\times f_{\\text{veg}} \\in [0.70, 1.45]$.
* **Stochastic Perturbation:** $\\eta \\sim \\mathcal{N}(0, 0.06)$ clipped to $[-0.15, 0.15]$ using fixed random seed `42`.

---

## 4. How to Regenerate the Dataset
To deterministically reproduce the exact synthetic target table:

```bash
backend/.venv/bin/python backend/scripts/build_synthetic_weather_targets.py
```

---

## 5. Scientific Limitation Statement
> **IMPORTANT:** These targets are **simulated prototype placeholders**. They are **NOT real measured observations** and must **NEVER** be presented as empirical ground truth or used to claim validated real-world forecast accuracy.

---

## 6. Seamless Future Real-Data Drop-In
The ML training and evaluation pipelines are designed to ingest targets via a standardized target column interface. When authentic station observations (e.g. IMD Ooty `43317` and Coonoor `43318`) are procured from IMD NDC Pune, the target columns can be mapped to:
* `observed_rainfall_mm`
* `observed_tmax_c`
* `observed_tmin_c`
* `target_source = "observed_imd_station"`

without altering any downstream feature engineering or ML model code.
"""

    readme_path = SIMULATED_DIR / "README.md"
    with open(readme_path, "w", encoding="utf-8") as f:
        f.write(readme_content)
    print(f"Saved {readme_path.name}.")

    t_end = time.time()
    elapsed = t_end - t_start

    # 8. Print Terminal Summary
    print("\n" + "=" * 65)
    print("PANCHAYAT WEATHER INTELLIGENCE — SYNTHETIC TARGET SUMMARY")
    print("=" * 65)
    print(f"Total rows: {len(target_df):,}")
    print(f"Panchayats: {target_df['panchayat_id'].nunique()}")
    print(f"Date range: {date_min} to {date_max} ({target_df['date'].nunique():,} days)")
    print(f"Random seed: {RANDOM_SEED}")
    print(f"Target source tag: 'synthetic'")
    print(f"Generation time: {elapsed:.2f}s")
    print()
    print("--- Distribution Comparison (Coarse vs. Synthetic) ---")
    print(f"Rainfall (mm):")
    print(f"  Coarse    -> Min: {df['coarse_rainfall_mm'].min():.2f}, Max: {df['coarse_rainfall_mm'].max():.2f}, Mean: {df['coarse_rainfall_mm'].mean():.3f}, Median: {df['coarse_rainfall_mm'].median():.3f}")
    print(f"  Synthetic -> Min: {target_df['synthetic_rainfall_mm'].min():.2f}, Max: {target_df['synthetic_rainfall_mm'].max():.2f}, Mean: {target_df['synthetic_rainfall_mm'].mean():.3f}, Median: {target_df['synthetic_rainfall_mm'].median():.3f}")
    print(f"Tmax (°C):")
    print(f"  Coarse    -> Min: {df['coarse_tmax_c'].min():.2f}, Max: {df['coarse_tmax_c'].max():.2f}, Mean: {df['coarse_tmax_c'].mean():.3f}")
    print(f"  Synthetic -> Min: {target_df['synthetic_tmax_c'].min():.2f}, Max: {target_df['synthetic_tmax_c'].max():.2f}, Mean: {target_df['synthetic_tmax_c'].mean():.3f}")
    print(f"Tmin (°C):")
    print(f"  Coarse    -> Min: {df['coarse_tmin_c'].min():.2f}, Max: {df['coarse_tmin_c'].max():.2f}, Mean: {df['coarse_tmin_c'].mean():.3f}")
    print(f"  Synthetic -> Min: {target_df['synthetic_tmin_c'].min():.2f}, Max: {target_df['synthetic_tmin_c'].max():.2f}, Mean: {target_df['synthetic_tmin_c'].mean():.3f}")
    print()
    print("Validation checks:")
    print("  * Duplicate rows: 0")
    print("  * Missing target values: 0")
    print("  * Negative rainfall count: 0")
    print("  * Tmax < Tmin violations: 0")
    print("  * NaN / Inf count: 0")
    print("  * Dry day preservation (coarse rain=0 -> syn rain=0): 100% verified")
    print()
    print("Artifacts generated:")
    print(f"  * {csv_out_path}")
    print(f"  * {json_out_path}")
    print(f"  * {readme_path}")
    print()
    print("Model training performed: NO")
    print("Existing datasets modified: NO")
    print("=" * 65)

if __name__ == "__main__":
    build_synthetic_targets()
