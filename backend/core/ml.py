import joblib
import numpy as np
import pandas as pd
from pathlib import Path

MODEL_DIR = Path(__file__).parent.parent / "models"

_model_a = None
_model_b = None
_feat_a = None
_feat_b = None
_registry = None


def _load():
    global _model_a, _model_b, _feat_a, _feat_b, _registry
    if _model_a is None:
        _model_a = joblib.load(MODEL_DIR / "model_a_xgboost.pkl")
        _model_b = joblib.load(MODEL_DIR / "model_b_xgboost.pkl")
        _feat_a = joblib.load(MODEL_DIR / "feature_cols_a.pkl")
        _feat_b = joblib.load(MODEL_DIR / "feature_cols_b.pkl")
        _registry = pd.read_csv(MODEL_DIR / "patient_registry.csv")


def get_registry() -> pd.DataFrame:
    _load()
    return _registry


def get_tier(score: float) -> str:
    if score >= 0.85:
        return "URGENT"
    if score >= 0.65:
        return "HIGH"
    if score >= 0.40:
        return "MODERATE"
    return "LOW"


def get_est_months(score: float) -> str:
    if score >= 0.85:
        return "< 3 months"
    if score >= 0.65:
        return "3 – 6 months"
    if score >= 0.40:
        return "6 – 12 months"
    return "> 12 months"


def predict(input_dict: dict) -> dict:
    _load()
    row = pd.DataFrame([input_dict])

    # Model A
    row_a = row.reindex(columns=_feat_a, fill_value=0)
    score_a = float(_model_a.predict_proba(row_a)[0][1])

    # Model B
    row_b = row.reindex(columns=_feat_b, fill_value=0)
    score_b = float(_model_b.predict_proba(row_b)[0][1])

    # Ensemble (equal weight)
    ensemble = (score_a + score_b) / 2

    return {
        "risk_score": round(ensemble, 4),
        "urgency_tier": get_tier(ensemble),
        "est_months": get_est_months(ensemble),
        "model_a_score": round(score_a, 4),
        "model_b_score": round(score_b, 4),
    }
