from sqlalchemy import Column, Integer, String, Enum as SAEnum
from core.database import Base
import enum


class Role(str, enum.Enum):
    admin = "admin"
    nephrologist = "nephrologist"
    patient = "patient"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(SAEnum(Role), nullable=False, default=Role.patient)
    # For patient role: links to registry PATIENT uuid
    patient_record_id = Column(String, nullable=True)
