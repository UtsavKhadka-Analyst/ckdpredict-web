from pydantic import BaseModel
from models.user import Role


# ── Auth ────────────────────────────────────────────────────
class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: Role
    username: str


# ── Patient portal (UUID-prefix login) ─────────────────────
class PatientPortalLoginRequest(BaseModel):
    portal_id: str  # 8-char UUID prefix


# ── Patient record (returned to frontend) ──────────────────
class PatientRecord(BaseModel):
    patient_id: str
    risk_score: float
    urgency_tier: str
    est_months: str
    age: float | None = None
    gender: str | None = None
    pathway: str | None = None
    proj_cost: float | None = None


# ── Registry row (admin/neph view) ─────────────────────────
class RegistryRow(BaseModel):
    patient_id: str
    risk_score: float
    urgency_tier: str
    est_months: str
    age: float | None = None
    gender: str | None = None
    city: str | None = None
    pathway: str | None = None
    proj_cost: float | None = None
    potential_saving: float | None = None


class RegistryResponse(BaseModel):
    total: int
    patients: list[RegistryRow]


# ── ML Prediction ───────────────────────────────────────────
class PredictionInput(BaseModel):
    age: float
    gender: str
    race: str
    egfr: float
    uacr: float
    systolic_bp: float
    hba1c: float | None = None
    hemoglobin: float | None = None
    bmi: float | None = None


class PredictionResult(BaseModel):
    risk_score: float
    urgency_tier: str
    est_months: str
    model_a_score: float
    model_b_score: float


# ── Dashboard stats (admin) ─────────────────────────────────
class DashboardStats(BaseModel):
    total_patients: int
    urgent: int
    high: int
    moderate: int
    low: int
    total_proj_cost: float
    potential_savings: float
