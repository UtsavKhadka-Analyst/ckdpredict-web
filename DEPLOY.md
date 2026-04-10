# Deployment Guide

## Backend → Render (Free)

1. Push this repo to GitHub
2. Go to https://render.com → New → Web Service
3. Connect your GitHub repo → select `ckdpredict-web`
4. Settings:
   - **Root directory:** `backend`
   - **Build command:** `pip install -r requirements.txt && python seed.py`
   - **Start command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add environment variable:
   - `SECRET_KEY` → any random string (32+ chars)
   - `DATABASE_URL` → auto-filled if you add a Render PostgreSQL DB
6. Deploy → copy your Render URL (e.g. `https://ckdpredict-api.onrender.com`)

---

## Frontend → Vercel (Free)

1. Go to https://vercel.com → New Project → Import GitHub repo
2. Settings:
   - **Root directory:** `frontend`
   - **Framework:** Vite
   - **Build command:** `npm run build`
   - **Output directory:** `dist`
3. Add environment variable:
   - `VITE_API_URL` → your Render backend URL
4. Update `vercel.json` → replace `ckdpredict-api.onrender.com` with your actual Render URL
5. Deploy → get your live URL

---

## Default Login Credentials (seed.py)

| Role           | Username  | Password        |
|----------------|-----------|-----------------|
| Administrator  | admin     | Admin@CKD2024   |
| Nephrologist   | dr_smith  | Neph@CKD2024    |
| Patient        | (portal)  | UUID prefix login|

**Change these passwords before sharing the live URL.**
