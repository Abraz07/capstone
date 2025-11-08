import os
import sys

# Add ml_service root to path
ml_service_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if ml_service_root not in sys.path:
    sys.path.insert(0, ml_service_root)

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from loguru import logger

from inference.pomodoro_recommender import PomodoroRecommender

router = APIRouter()

# Initialize recommender (singleton)
recommender = None

def get_recommender():
    global recommender
    if recommender is None:
        recommender = PomodoroRecommender()
    return recommender

class PomodoroRequest(BaseModel):
    user_id: int = Field(..., description="User ID", example=1)
    task_priority: Optional[str] = Field("medium", description="Task priority: low, medium, high", example="high")

class PomodoroResponse(BaseModel):
    focus_minutes: int = Field(..., description="Recommended focus duration in minutes", example=25)
    break_minutes: int = Field(..., description="Recommended break duration in minutes", example=5)
    confidence: float = Field(..., description="Confidence score (0-1)", example=0.85)
    explanation: str = Field(..., description="Human-readable explanation", example="Recommended based on your activity pattern")

@router.post("/recommend-pomodoro", response_model=PomodoroResponse)
async def recommend_pomodoro(request: PomodoroRequest):
    """
    Get personalized Pomodoro timer recommendations
    
    - **user_id**: User ID to get recommendations for
    - **task_priority**: Priority of the current task (low, medium, high)
    
    Returns recommended focus and break durations with confidence and explanation.
    """
    try:
        logger.info(f"Pomodoro recommendation requested for user {request.user_id}")
        
        recommender = get_recommender()
        result = recommender.recommend(request.user_id, request.task_priority)
        
        return PomodoroResponse(
            focus_minutes=result["focus_minutes"],
            break_minutes=result["break_minutes"],
            confidence=result["confidence"],
            explanation=result["explanation"]
        )
        
    except Exception as e:
        logger.error(f"Error in pomodoro recommendation: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating recommendation: {str(e)}")

