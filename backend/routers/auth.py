from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import secrets

from core.database import get_db
from core.security import verify_password, create_access_token, hash_password
from core.ml import get_registry
from models.user import User, Role, AccessLog
from models.schemas import (
    LoginRequest, TokenResponse,
    PatientPortalLoginRequest, PatientRegisterRequest
)

router = APIRouter(prefix="/auth", tags=["auth"])

MAX_FAILED   = 5
LOCKOUT_MINS = 15


def _log(db: Session, action: str, request: Request,
         user: User | None = None, patient_id: str | None = None):
    db.add(AccessLog(
        user_id    = user.id if user else None,
        username   = user.username if user else None,
        patient_id = patient_id or (user.patient_record_id if user else None),
        action     = action,
        ip_address = request.client.host if request.client else None,
    ))
    db.commit()


def _get_patient_id_from_portal(portal_id: str):
    """Match portal ID prefix against registry. Returns record_id or raises."""
    pid = portal_id.strip().lower().replace("-", "")
    if len(pid) < 6:
        raise HTTPException(status.HTTP_400_BAD_REQUEST,
                            "Enter at least 6 characters of your Portal ID")
    registry = get_registry()
    matches = registry[
        registry["PATIENT"].str.lower()
        .str.replace("-", "", regex=False)
        .str.startswith(pid)
    ]
    if len(matches) == 0:
        raise HTTPException(status.HTTP_404_NOT_FOUND,
                            "Portal ID not found. Check your care letter.")
    if len(matches) > 1:
        raise HTTPException(status.HTTP_409_CONFLICT,
                            f"{len(matches)} records matched — enter more characters.")
    return matches.iloc[0]["PATIENT"]


# ── 1. Clinical staff login (admin / nephrologist) ──────────
@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == body.username).first()

    # Check lockout
    if user and user.locked_until and datetime.utcnow() < user.locked_until:
        mins = int((user.locked_until - datetime.utcnow()).total_seconds() / 60) + 1
        _log(db, "login_blocked", request, user)
        raise HTTPException(status.HTTP_423_LOCKED,
                            f"Account locked. Try again in {mins} minute(s).")

    if not user or not verify_password(body.password, user.hashed_password):
        if user:
            user.failed_attempts += 1
            if user.failed_attempts >= MAX_FAILED:
                user.locked_until = datetime.utcnow() + timedelta(minutes=LOCKOUT_MINS)
                db.commit()
                _log(db, "account_locked", request, user)
                raise HTTPException(status.HTTP_423_LOCKED,
                                    f"Account locked after {MAX_FAILED} failed attempts. "
                                    f"Try again in {LOCKOUT_MINS} minutes.")
            db.commit()
            _log(db, "failed_login", request, user)
        raise HTTPException(status.HTTP_401_UNAUTHORIZED,
                            "Incorrect username or password")

    # Successful login — reset counters
    user.failed_attempts = 0
    user.locked_until    = None
    db.commit()
    _log(db, "login", request, user)

    token = create_access_token({"sub": user.username, "role": user.role})
    return TokenResponse(access_token=token, role=user.role, username=user.username)


# ── 2. Patient — check if enrolled or new ──────────────────
@router.post("/patient-check")
def patient_check(body: PatientPortalLoginRequest, db: Session = Depends(get_db)):
    """
    Returns whether patient has enrolled (set credentials) or is first-time.
    Frontend uses this to show Login vs Register screen.
    """
    record_id = _get_patient_id_from_portal(body.portal_id)
    username  = f"pt_{record_id[:8]}"
    user      = db.query(User).filter(User.username == username).first()
    enrolled  = bool(user and user.is_enrolled)
    return {"enrolled": enrolled, "record_id": record_id}


# ── 3. Patient — first-time registration (Epic activation) ──
@router.post("/patient-register", response_model=TokenResponse)
def patient_register(body: PatientRegisterRequest,
                     request: Request, db: Session = Depends(get_db)):
    record_id = _get_patient_id_from_portal(body.activation_code)
    username  = f"pt_{record_id[:8]}"

    # Check not already enrolled
    existing = db.query(User).filter(User.username == username).first()
    if existing and existing.is_enrolled:
        raise HTTPException(status.HTTP_409_CONFLICT,
                            "This account is already registered. Please sign in.")

    # Check chosen username not taken by someone else
    taken = db.query(User).filter(
        User.username == body.username,
        User.username != username
    ).first()
    if taken:
        raise HTTPException(status.HTTP_409_CONFLICT,
                            "Username already taken. Choose another.")

    if existing:
        existing.username       = body.username
        existing.hashed_password = hash_password(body.password)
        existing.is_enrolled    = True
        user = existing
    else:
        user = User(
            username          = body.username,
            hashed_password   = hash_password(body.password),
            role              = Role.patient,
            patient_record_id = record_id,
            activation_code   = body.activation_code,
            is_enrolled       = True,
        )
        db.add(user)

    db.commit()
    db.refresh(user)
    _log(db, "patient_registered", request, user)

    token = create_access_token(
        {"sub": user.username, "role": user.role, "record_id": record_id},
        timedelta(minutes=10)
    )
    return TokenResponse(access_token=token, role=user.role, username=user.username)


# ── 4. Patient — returning login ────────────────────────────
@router.post("/patient-login", response_model=TokenResponse)
def patient_login(body: LoginRequest, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(
        User.username == body.username,
        User.role == Role.patient
    ).first()

    # Lockout check
    if user and user.locked_until and datetime.utcnow() < user.locked_until:
        mins = int((user.locked_until - datetime.utcnow()).total_seconds() / 60) + 1
        _log(db, "login_blocked", request, user)
        raise HTTPException(status.HTTP_423_LOCKED,
                            f"Account locked. Try again in {mins} minute(s).")

    if not user or not user.is_enrolled or not verify_password(body.password, user.hashed_password):
        if user:
            user.failed_attempts += 1
            if user.failed_attempts >= MAX_FAILED:
                user.locked_until = datetime.utcnow() + timedelta(minutes=LOCKOUT_MINS)
                db.commit()
                _log(db, "account_locked", request, user)
                raise HTTPException(status.HTTP_423_LOCKED,
                                    f"Account locked after {MAX_FAILED} failed attempts. "
                                    f"Try again in {LOCKOUT_MINS} minutes.")
            db.commit()
            _log(db, "failed_login", request, user)
        raise HTTPException(status.HTTP_401_UNAUTHORIZED,
                            "Incorrect username or password")

    user.failed_attempts = 0
    user.locked_until    = None
    db.commit()
    _log(db, "patient_login", request, user)

    token = create_access_token(
        {"sub": user.username, "role": user.role,
         "record_id": user.patient_record_id},
        timedelta(minutes=10)
    )
    return TokenResponse(access_token=token, role=user.role, username=user.username)
