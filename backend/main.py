import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.database import engine, Base
import models.user  # noqa — ensures table is registered
from routers import auth, registry, patient, predict, chat

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="CKDPredict API",
    description="Early CKD Detection — Saint Louis University MRP 2026",
    version="1.0.0",
)

# In production FRONTEND_URL is set to the Vercel URL
FRONTEND_URL = os.getenv("FRONTEND_URL", "")
allowed_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
]
if FRONTEND_URL:
    allowed_origins.append(FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(registry.router)
app.include_router(patient.router)
app.include_router(predict.router)
app.include_router(chat.router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "CKDPredict API"}
