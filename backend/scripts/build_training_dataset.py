#!/usr/bin/env python3
"""Build Unified Training Dataset for Panchayat Weather Intelligence.

Joins the full ML feature base table (Copernicus DEM 30m, ESA WorldCover 10m,
Sentinel-2 NDVI, cyclical temporal encodings, and coarse INDmet meteorology)
with the validated synthetic local weather target dataset.

Outputs in backend/data/processed/ml_dataset/:
- training_dataset.csv
"""

import time
from pathlib import Path
from datetime import datetime, timezone
import pandas as pd
import numpy as np

# Project root paths
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
PROCESSED_DIR = PROJECT_ROOT / "backend" / "data" / "processed"
SIMULATED_DIR = PROJECT_ROOT / "backend" / "data" / "simulated"
ML_DATASET_DIR = PROCESSED_DIR / "ml_dataset"
ML_DATASET_DIR.mkdir(parents=True, exist_ok=True)

def build_training_dataset():
    t_start = time.time()
    print("=" * 65)
    print("BUILDING UNIFIED ML TRAINING DATASET")
    print("=" * 65)

    base_path = ML_DATASET_DIR / "downscaling_base.csv"
    targets_path = SIMULATED_DIR / "synthetic_local_weather_targets.csv"

    if not base_path.exists():
        raise FileNotFoundError(f"Missing base ML dataset: {base_path}")
    if not targets_path.exists():
        raise FileNotFoundError(f"Missing synthetic targets dataset: {targets_path}")

    print(f"Loading features from {base_path.name}...")
    base_df = pd.read_csv(base_path)
    print(f"Loading targets from {targets_path.name}...")
    targets_df = pd.read_csv(targets_path)

    # Exclude reference_* columns from base_df to avoid redundancy with targets
    drop_cols = [c for c in base_df.columns if c.startswith("reference_")]
    feature_df = base_df.drop(columns=drop_cols)

    # Target columns to merge
    target_cols = [
        "panchayat_id", "date",
        "synthetic_rainfall_mm", "synthetic_tmax_c", "synthetic_tmin_c"
    ]

    print("Merging features and targets on (panchayat_id, date)...")
    train_df = feature_df.merge(targets_df[target_cols], on=["panchayat_id", "date"], how="inner")

    # Sort deterministically
    train_df.sort_values(by=["panchayat_id", "date"], inplace=True)
    train_df.reset_index(drop=True, inplace=True)

    n_rows = len(train_df)
    n_panchayats = train_df["panchayat_id"].nunique()
    date_min, date_max = train_df["date"].min(), train_df["date"].max()

    # Integrity Validations
    print("\nRunning integrity validations on training dataset...")
    assert n_rows == 498201, f"Expected 498,201 rows, got {n_rows}"
    assert n_panchayats == 31, f"Expected 31 Panchayats, got {n_panchayats}"
    assert train_df.duplicated(subset=["panchayat_id", "date"]).sum() == 0, "Duplicate rows detected"
    assert train_df.isnull().sum().sum() == 0, "Null values detected"
    assert (train_df["synthetic_rainfall_mm"] >= 0.0).all(), "Negative synthetic rainfall detected"
    assert (train_df["synthetic_tmax_c"] >= train_df["synthetic_tmin_c"]).all(), "Tmax < Tmin violations detected"
    print("All training dataset validations PASSED.")

    # Save training_dataset.csv
    out_path = ML_DATASET_DIR / "training_dataset.csv"
    print(f"\nWriting training dataset ({n_rows:,} rows x {len(train_df.columns)} cols) to {out_path}...")
    train_df.to_csv(out_path, index=False)
    csv_size_mb = out_path.stat().st_size / (1024 * 1024)
    print(f"Saved {out_path.name} ({csv_size_mb:.2f} MB).")

    t_end = time.time()
    elapsed = t_end - t_start
    print(f"Completed in {elapsed:.2f}s.")
    print("=" * 65)

if __name__ == "__main__":
    build_training_dataset()
