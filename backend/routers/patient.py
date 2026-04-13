from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from core.database import get_db
from core.ml import get_registry
from core.deps import get_current_user
from models.user import User, Role, AccessLog
from models.schemas import PatientRecord, AccessLogEntry

router = APIRouter(prefix="/patient", tags=["patient"])


def _log(db: Session, action: str, request: Request, user: User):
    db.add(AccessLog(
        user_id    = user.id,
        username   = user.username,
        patient_id = user.patient_record_id,
        action     = action,
        ip_address = request.client.host if request.client else None,
    ))
    db.commit()


@router.get("/me", response_model=PatientRecord)
def get_my_record(request: Request,
                  current_user: User = Depends(get_current_user),
                  db: Session = Depends(get_db)):
    if current_user.role != Role.patient or not current_user.patient_record_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="This endpoint is for patients only")

    registry = get_registry()
    rows = registry[registry["PATIENT"] == current_user.patient_record_id]
    if rows.empty:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="Patient record not found")

    # HIPAA audit log — every record view is recorded
    _log(db, "view_record", request, current_user)

    r = rows.iloc[0]
    return PatientRecord(
        patient_id  = r["PATIENT"],
        risk_score  = round(float(r["RISK_SCORE"]), 4),
        urgency_tier= r["URGENCY_TIER"],
        est_months  = str(r["EST_MONTHS"]),
        age         = float(r["AGE"]) if "AGE" in r and r["AGE"] == r["AGE"] else None,
        gender      = r.get("GENDER"),
        pathway     = r.get("PATHWAY"),
        proj_cost   = float(r["PROJ_COST"]) if "PROJ_COST" in r and r["PROJ_COST"] == r["PROJ_COST"] else None,
    )


@router.get("/my-access-log", response_model=list[AccessLogEntry])
def get_my_access_log(current_user: User = Depends(get_current_user),
                      db: Session = Depends(get_db)):
    """Patient can view their own access history — HIPAA transparency."""
    if current_user.role != Role.patient:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Patients only")
    logs = (
        db.query(AccessLog)
        .filter(AccessLog.user_id == current_user.id)
        .order_by(AccessLog.accessed_at.desc())
        .limit(20)
        .all()
    )
    return logs
