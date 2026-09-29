"""Data loader utilities for reading processed datasets and provenance records.
Isolates storage mechanics from service layers.
"""
from typing import Any, Dict, List, Optional
import json
from pathlib import Path
import pandas as pd
from backend.app.config import settings

def load_panchayats() -> pd.DataFrame:
    """Load processed master panchayat list with real terrain and environmental features."""
    master_path = settings.PROCESSED_DATA_DIR / "panchayat_master.csv"
    if master_path.exists():
        return pd.read_csv(master_path)
    return pd.DataFrame()

# Backward-compatibility alias
load_panchayats_table = load_panchayats

def load_historical_weather() -> pd.DataFrame:
    """Load processed real INDmet 0.05° gridded daily weather dataset (1981-2024)."""
    weather_path = settings.PROCESSED_DATA_DIR / "historical_weather.csv"
    if weather_path.exists():
        return pd.read_csv(weather_path)
    return pd.DataFrame()

def load_panchayat_weather_mapping() -> pd.DataFrame:
    """Load mapping between Panchayats and their nearest authentic INDmet 0.05° weather grid cell."""
    mapping_path = settings.PROCESSED_DATA_DIR / "panchayat_weather_grid_mapping.csv"
    if mapping_path.exists():
        return pd.read_csv(mapping_path)
    return pd.DataFrame()

def load_soil_moisture() -> Optional[pd.DataFrame]:
    """Load processed soil moisture dataset if available, else returns None (SOURCE_PENDING)."""
    sm_path = settings.PROCESSED_DATA_DIR / "soil_moisture.csv"
    if sm_path.exists():
        return pd.read_csv(sm_path)
    return None

def load_data_sources() -> Dict[str, Any]:
    """Load full dataset provenance and attribution metadata."""
    sources_path = settings.PROCESSED_DATA_DIR / "data_sources.json"
    if sources_path.exists():
        with open(sources_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}

def load_simulated_block_forecasts() -> Dict[str, Any]:
    """Load mock IMD block-level weather forecasts.
    TODO: In future phase, replace with live IMD API connector.
    """
    sim_path = settings.SIMULATED_DATA_DIR / "demo_block_forecasts.json"
    if sim_path.exists():
        with open(sim_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}
