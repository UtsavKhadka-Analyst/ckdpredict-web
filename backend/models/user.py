from sqlalchemy import Column, Integer, String, Enum as SAEnum, Boolean, DateTime
from sqlalchemy.sql import func
from core.database import Base
import enum


class Role(str, enum.Enum):
    admin = "admin"
    nephrologist = "nephrologist"
    patient = "patient"


class User(Base):
    __tablename__ = "users"

    id                = Column(Integer, primary_key=True, index=True)
    username          = Column(String, unique=True, index=True, nullable=False)
    hashed_password   = Column(String, nullable=False)
    role              = Column(SAEnum(Role), nullable=False, default=Role.patient)
    patient_record_id = Column(String, nullable=True)

    # Patient enrollment flow
    activation_code   = Column(String, nullable=True)   # portal ID — one-time enrollment
    is_enrolled       = Column(Boolean, default=False)   # True after patient sets credentials
    failed_attempts   = Column(Integer, default=0)       # lockout after 5
    locked_until      = Column(DateTime, nullable=True)  # account lockout expiry
    created_at        = Column(DateTime, server_default=func.now())


class AccessLog(Base):
    __tablename__ = "access_log"

    id           = Column(Integer, primary_key=True, index=True)
    user_id      = Column(Integer, nullable=True)
    username     = Column(String, nullable=True)
    patient_id   = Column(String, nullable=True)
    action       = Column(String, nullable=False)   # login / view_record / logout / failed_login / locked
    ip_address   = Column(String, nullable=True)
    accessed_at  = Column(DateTime, server_default=func.now())
