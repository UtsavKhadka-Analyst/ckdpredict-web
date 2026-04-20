from pydantic import BaseModel, field_validator
from models.user import Role
from datetime import datetime


# ── Auth ────────────────────────────────────────────────────
class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: Role
    username: str


# ── Patient enrollment (Epic MyChart pattern) ───────────────
class PatientPortalLoginRequest(BaseModel):
    portal_id: str   # activation code / UUID prefix


class PatientRegisterRequest(BaseModel):
    activation_code: str
    username: str
    password: str

    @field_validator('password')
    @classmethod
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one number')
        return v

    @field_validator('username')
    @classmethod
    def username_valid(cls, v):
        if len(v) < 4:
            raise ValueError('Username must be at least 4 characters')
        if ' ' in v:
            raise ValueError('Username cannot contain spaces')
        return v.lower()


# ── Patient record ──────────────────────────────────────────
class PatientRecord(BaseModel):
    patient_id: str
    risk_score: float
    urgency_tier: str
    est_months: str
    age: float | None = None
    gender: str | None = None
    pathway: str | None = None
    proj_cost: float | None = None


# ── Registry ────────────────────────────────────────────────
class RegistryRow(BaseModel):
    patient_id: str
    risk_score: float
    urgency_tier: str
    est_months: str
    first: str | None = None
    last: str | None = None
    age: float | None = None
    gender: str | None = None
    city: str | None = None
    state: str | None = None
    pathway: str | None = None
    model: str | None = None
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


# ── Dashboard stats ─────────────────────────────────────────
class DashboardStats(BaseModel):
    total_patients: int
    urgent: int
    high: int
    moderate: int
    low: int
    total_proj_cost: float
    potential_savings: float


# ── Audit log ───────────────────────────────────────────────
class AccessLogEntry(BaseModel):
    action: str
    ip_address: str | None
    accessed_at: datetime

    class Config:
        from_attributes = True
