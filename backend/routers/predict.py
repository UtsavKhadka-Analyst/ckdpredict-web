from fastapi import APIRouter, Depends
from core.ml import predict
from core.deps import require_nephrologist
from models.user import User
from models.schemas import PredictionInput, PredictionResult

router = APIRouter(prefix="/predict", tags=["predict"])


@router.post("/", response_model=PredictionResult)
def run_prediction(
    body: PredictionInput,
    _: User = Depends(require_nephrologist),
):
    result = predict(body.model_dump())
    return PredictionResult(**result)
