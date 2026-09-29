"""Offline Model Training Script.
Trains a lightweight RandomForestRegressor for terrain-based weather downscaling.
Note: Run via CLI, not loaded into HTTP request handlers.
"""
from sklearn.ensemble import RandomForestRegressor
from backend.app.config import settings

def train_model():
    """Trains the baseline downscaler model and saves to backend/data/models/.
    TODO: Ingest training datasets from backend/data/processed/ or simulated/
    TODO: Fit RandomForestRegressor(n_estimators=50, max_depth=8, random_state=42)
    TODO: Export trained model as joblib/pickle artifact to settings.MODELS_DIR / 'rf_downscaler_v1.pkl'
    """
    pass

if __name__ == "__main__":
    train_model()
