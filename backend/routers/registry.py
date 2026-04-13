from fastapi import APIRouter, Depends, Query
from core.ml import get_registry
from core.deps import require_admin, require_nephrologist
from models.user import User
from models.schemas import RegistryRow, RegistryResponse, DashboardStats

router = APIRouter(prefix="/registry", tags=["registry"])

COLS = {
    "PATIENT": "patient_id",
    "RISK_SCORE": "risk_score",
    "URGENCY_TIER": "urgency_tier",
    "EST_MONTHS": "est_months",
    "AGE": "age",
    "GENDER": "gender",
    "CITY": "city",
    "PATHWAY": "pathway",
    "PROJ_COST": "proj_cost",
    "POTENTIAL_SAVING": "potential_saving",
}


def _to_row(r) -> RegistryRow:
    return RegistryRow(
        patient_id=r.get("PATIENT", ""),
        risk_score=round(float(r.get("RISK_SCORE", 0)), 4),
        urgency_tier=r.get("URGENCY_TIER", ""),
        est_months=str(r.get("EST_MONTHS", "")),
        age=float(r["AGE"]) if "AGE" in r and r["AGE"] == r["AGE"] else None,
        gender=r.get("GENDER"),
        city=r.get("CITY"),
        pathway=r.get("PATHWAY"),
        proj_cost=float(r["PROJ_COST"]) if "PROJ_COST" in r and r["PROJ_COST"] == r["PROJ_COST"] else None,
        potential_saving=float(r["POTENTIAL_SAVING"]) if "POTENTIAL_SAVING" in r and r["POTENTIAL_SAVING"] == r["POTENTIAL_SAVING"] else None,
    )


@router.get("/", response_model=RegistryResponse)
def get_registry_list(
    tier: str | None = Query(None, description="Filter by URGENCY_TIER"),
    min_risk: float = Query(0.0, ge=0, le=1),
    limit: int = Query(100, le=20000),
    offset: int = Query(0, ge=0),
    _: User = Depends(require_nephrologist),
):
    df = get_registry()
    if tier:
        df = df[df["URGENCY_TIER"] == tier.upper()]
    df = df[df["RISK_SCORE"] >= min_risk]
    df = df.sort_values("RISK_SCORE", ascending=False)
    total = len(df)
    page = df.iloc[offset: offset + limit]
    return RegistryResponse(total=total, patients=[_to_row(r) for _, r in page.iterrows()])


@router.get("/stats", response_model=DashboardStats)
def dashboard_stats(_: User = Depends(require_admin)):
    df = get_registry()
    return DashboardStats(
        total_patients=len(df),
        urgent=int((df["URGENCY_TIER"] == "URGENT").sum()),
        high=int((df["URGENCY_TIER"] == "HIGH").sum()),
        moderate=int((df["URGENCY_TIER"] == "MODERATE").sum()),
        low=int((df["URGENCY_TIER"] == "LOW").sum()),
        total_proj_cost=float(df["PROJ_COST"].sum()) if "PROJ_COST" in df else 0.0,
        potential_savings=float(df["POTENTIAL_SAVING"].sum()) if "POTENTIAL_SAVING" in df else 0.0,
    )


@router.get("/export")
def export_csv(_: User = Depends(require_admin)):
    from fastapi.responses import StreamingResponse
    import io
    df = get_registry()
    stream = io.StringIO()
    df.to_csv(stream, index=False)
    stream.seek(0)
    return StreamingResponse(
        iter([stream.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=ckd_registry.csv"},
    )
