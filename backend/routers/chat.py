from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from groq import Groq
from core.config import settings
from core.deps import require_admin
from core.ml import get_registry
from models.user import User

router = APIRouter(prefix="/chat", tags=["chat"])

GROQ_MODEL = "llama-3.3-70b-versatile"


class ChatMessage(BaseModel):
    role: str    # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]


def _build_system_prompt() -> str:
    df = get_registry()
    total    = len(df)
    urgent   = int((df["URGENCY_TIER"] == "URGENT").sum())
    high     = int((df["URGENCY_TIER"] == "HIGH").sum())
    moderate = int((df["URGENCY_TIER"] == "MODERATE").sum())
    low      = int((df["URGENCY_TIER"] == "LOW").sum())
    avg_risk   = round(float(df["RISK_SCORE"].mean()), 3)
    total_cost = round(float(df["PROJ_COST"].sum()) / 1_000_000, 1)
    savings    = round(float(df["POTENTIAL_SAVING"].sum()) / 1_000_000, 1)
    model_a    = int((df["MODEL"] == "A").sum())
    model_b    = int((df["MODEL"] == "B").sum())

    # City breakdowns
    city_urgent = (
        df[df["URGENCY_TIER"] == "URGENT"]
        .groupby("CITY").size().sort_values(ascending=False).head(10)
    )
    city_total = df.groupby("CITY").size().sort_values(ascending=False).head(10)
    city_urgent_str = "\n".join(f"  {city}: {cnt} urgent" for city, cnt in city_urgent.items())
    city_total_str  = "\n".join(f"  {city}: {cnt} total" for city, cnt in city_total.items())

    # Age stats by tier
    age_by_tier = df.groupby("URGENCY_TIER")["AGE"].mean().round(1).to_dict()

    # Gender breakdown
    gender = df["GENDER"].value_counts().to_dict()
    male   = gender.get("M", 0)
    female = gender.get("F", 0)

    # Cost by tier
    cost_by_tier = df.groupby("URGENCY_TIER")["PROJ_COST"].mean().round(0).to_dict()

    return f"""You are CKD Assist — a clinical decision-support AI embedded in CKDPredict,
a kidney disease risk management application built for Saint Louis University MRP 2026.

CURRENT PATIENT POPULATION (live data):
- Total patients: {total:,}
- URGENT (risk ≥ 0.85, < 3 months): {urgent:,}
- HIGH (risk 0.65–0.84, 3–6 months): {high:,}
- MODERATE (risk 0.40–0.64, 6–12 months): {moderate:,}
- LOW (risk < 0.40, > 12 months): {low:,}
- Average risk score: {avg_risk}
- Male patients: {male:,} | Female patients: {female:,}
- Model A (Diabetic pathway): {model_a:,} patients
- Model B (Non-Diabetic pathway): {model_b:,} patients
- Total projected cost: ${total_cost}M
- Potential savings from early intervention: ${savings}M

AVERAGE AGE BY TIER:
- URGENT: {age_by_tier.get('URGENT', 'N/A')} years
- HIGH: {age_by_tier.get('HIGH', 'N/A')} years
- MODERATE: {age_by_tier.get('MODERATE', 'N/A')} years
- LOW: {age_by_tier.get('LOW', 'N/A')} years

AVERAGE PROJECTED COST BY TIER:
- URGENT: ${int(cost_by_tier.get('URGENT', 0)):,}
- HIGH: ${int(cost_by_tier.get('HIGH', 0)):,}
- MODERATE: ${int(cost_by_tier.get('MODERATE', 0)):,}
- LOW: ${int(cost_by_tier.get('LOW', 0)):,}

TOP 10 CITIES BY URGENT PATIENTS:
{city_urgent_str}

TOP 10 CITIES BY TOTAL PATIENTS:
{city_total_str}

PREDICTION MODEL:
- Algorithm: XGBoost ensemble (Model A + Model B, equal-weight average)
- Risk score: 0.00 (no risk) to 1.00 (certain progression)
- Model A trained on diabetic CKD patients
- Model B trained on non-diabetic CKD patients

CLINICAL GUIDELINES (KDIGO 2024):
- URGENT: Contact within 24-48 hrs, consider SGLT2 inhibitors, refer to nephrology if eGFR < 30
- HIGH: Schedule within 2 weeks, review ACE inhibitor/ARB therapy
- MODERATE: Routine follow-up 3-6 months, lifestyle intervention
- LOW: Annual screening

YOUR ROLE:
- Answer questions about the patient population and risk scores
- Explain clinical decisions and risk tier meanings
- Help prioritize outreach and resource allocation
- Keep responses concise (2-4 sentences max unless detailed explanation is needed)
- Always remind that this is decision-support only — final clinical judgment belongs to the physician
- Do not make up specific patient data you are not given
"""


@router.post("/")
def chat(
    req: ChatRequest,
    _: User = Depends(require_admin),
):
    if not settings.GROQ_API_KEY:
        raise HTTPException(status_code=503, detail="Chat service not configured — GROQ_API_KEY missing")

    client = Groq(api_key=settings.GROQ_API_KEY)

    messages = [{"role": "system", "content": _build_system_prompt()}]
    messages += [{"role": m.role, "content": m.content} for m in req.messages]

    try:
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=messages,
            max_tokens=512,
            temperature=0.3,
        )
        return {"reply": response.choices[0].message.content}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"LLM error: {str(e)}")
