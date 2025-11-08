import os
import sys

# Add ml_service root to path
ml_service_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if ml_service_root not in sys.path:
    sys.path.insert(0, ml_service_root)

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from loguru import logger

from inference.distraction_predictor import DistractionPredictor

router = APIRouter()

# Initialize predictor (singleton)
predictor = None

def get_predictor():
    global predictor
    if predictor is None:
        predictor = DistractionPredictor()
    return predictor

class DistractionRequest(BaseModel):
    user_id: int = Field(..., description="User ID", example=1)
    session_duration: int = Field(25, description="Planned session duration in minutes", example=25)

class DistractionResponse(BaseModel):
    distraction_probability: float = Field(..., description="Probability of distraction (0-1)", example=0.35)
    top_trigger: str = Field(..., description="Top distraction trigger", example="high_task_load")

@router.post("/distraction-predict", response_model=DistractionResponse)
async def predict_distraction(request: DistractionRequest):
    """
    Predict distraction probability for a user session
    
    - **user_id**: User ID
    - **session_duration**: Planned session duration in minutes
    
    Returns distraction probability and top trigger.
    """
    try:
        logger.info(f"Distraction prediction requested for user {request.user_id}")
        
        predictor = get_predictor()
        result = predictor.predict(request.user_id, request.session_duration)
        
        return DistractionResponse(
            distraction_probability=result["distraction_probability"],
            top_trigger=result["top_trigger"]
        )
        
    except Exception as e:
        logger.error(f"Error in distraction prediction: {e}")
        raise HTTPException(status_code=500, detail=f"Error predicting distraction: {str(e)}")

