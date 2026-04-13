"""
Run once to create tables and seed admin + nephrologist accounts.
Usage: python seed.py
"""
from core.database import engine, Base, SessionLocal
from core.security import hash_password
from models.user import User, Role
from sqlalchemy import text

# Import all models so Base knows about them
import models.user  # noqa

Base.metadata.create_all(bind=engine)

# Migrate existing 'users' table — add columns introduced in Phase F
# ADD COLUMN IF NOT EXISTS is a no-op when the column already exists (Postgres 9.6+)
_migrations = [
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS activation_code VARCHAR",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_enrolled BOOLEAN DEFAULT FALSE",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_attempts INTEGER DEFAULT 0",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW()",
]

with engine.connect() as conn:
    for stmt in _migrations:
        try:
            conn.execute(text(stmt))
            conn.commit()
        except Exception as e:
            print(f"Migration skipped ({e})")
print("Schema migration complete.")

db = SessionLocal()

SEED_USERS = [
    {"username": "admin", "password": "Admin@CKD2024", "role": Role.admin},
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
