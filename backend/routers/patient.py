from fastapi import APIRouter, Depends, HTTPException, status
from core.ml import get_registry
from core.deps import get_current_user
from models.user import User, Role
from models.schemas import PatientRecord

router = APIRouter(prefix="/patient", tags=["patient"])


@router.get("/me", response_model=PatientRecord)
def get_my_record(current_user: User = Depends(get_current_user)):
    if current_user.role != Role.patient or not current_user.patient_record_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint is for patients only",
        )
    registry = get_registry()
    rows = registry[registry["PATIENT"] == current_user.patient_record_id]
    if rows.empty:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient record not found")

    r = rows.iloc[0]
    return PatientRecord(
        patient_id=r["PATIENT"],
        risk_score=round(float(r["RISK_SCORE"]), 4),
        urgency_tier=r["URGENCY_TIER"],
        est_months=str(r["EST_MONTHS"]),
        age=float(r["AGE"]) if "AGE" in r and r["AGE"] == r["AGE"] else None,
        gender=r.get("GENDER"),
        pathway=r.get("PATHWAY"),
        proj_cost=float(r["PROJ_COST"]) if "PROJ_COST" in r and r["PROJ_COST"] == r["PROJ_COST"] else None,
    )
