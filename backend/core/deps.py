from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from core.database import get_db
from core.security import decode_token
from models.user import User, Role

bearer = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    payload = decode_token(credentials.credentials)
    username: str = payload.get("sub")
    if not username:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != Role.admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return current_user


def require_nephrologist(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in (Role.admin, Role.nephrologist):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Clinician access required")
    return current_user


def require_patient(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != Role.patient:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Patient access required")
    return current_user
