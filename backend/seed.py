"""
Run once to create tables and seed admin + nephrologist accounts.
Usage: python seed.py
"""
from core.database import engine, Base, SessionLocal
from core.security import hash_password
from models.user import User, Role

# Import all models so Base knows about them
import models.user  # noqa

Base.metadata.create_all(bind=engine)

db = SessionLocal()

SEED_USERS = [
    {"username": "admin", "password": "Admin@CKD2024", "role": Role.admin},
    {"username": "dr_smith", "password": "Neph@CKD2024", "role": Role.nephrologist},
]

for u in SEED_USERS:
    exists = db.query(User).filter(User.username == u["username"]).first()
    if not exists:
        db.add(User(
            username=u["username"],
            hashed_password=hash_password(u["password"]),
            role=u["role"],
        ))
        print(f"Created user: {u['username']} ({u['role']})")
    else:
        print(f"Already exists: {u['username']}")

db.commit()
db.close()
print("Seed complete.")
