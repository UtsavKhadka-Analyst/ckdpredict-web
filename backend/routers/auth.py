from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import verify_password, create_access_token
from core.ml import get_registry
from models.user import User, Role
from models.schemas import LoginRequest, TokenResponse, PatientPortalLoginRequest
import secrets

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == body.username).first()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    token = create_access_token({"sub": user.username, "role": user.role})
    return TokenResponse(access_token=token, role=user.role, username=user.username)


@router.post("/patient-portal", response_model=TokenResponse)
def patient_portal_login(body: PatientPortalLoginRequest, db: Session = Depends(get_db)):
    pid = body.portal_id.strip().lower().replace("-", "")
    if len(pid) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Enter at least 6 characters of your Patient Portal ID",
        )

    registry = get_registry()
    matches = registry[
        registry["PATIENT"].str.lower()
        .str.replace("-", "", regex=False)
        .str.startswith(pid)
    ]

    if len(matches) == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient Portal ID not found. Check your care letter.",
        )
    if len(matches) > 1:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"{len(matches)} records matched — enter more characters.",
        )

    record_id = matches.iloc[0]["PATIENT"]

    # Find or auto-create a patient user for this record
    username = f"pt_{record_id[:8]}"
    user = db.query(User).filter(User.username == username).first()
    if not user:
        from core.security import hash_password
        user = User(
            username=username,
            hashed_password=hash_password(secrets.token_hex(16)),  # random pw — login is portal-id only
            role=Role.patient,
            patient_record_id=record_id,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token(
        {"sub": user.username, "role": user.role, "record_id": record_id},
        # 10-minute session for patients
        __import__("datetime").timedelta(minutes=10),
    )
    return TokenResponse(access_token=token, role=user.role, username=username)
