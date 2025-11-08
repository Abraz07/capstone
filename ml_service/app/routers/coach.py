import os
import sys

# Add ml_service root to path
ml_service_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if ml_service_root not in sys.path:
    sys.path.insert(0, ml_service_root)

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Dict
from loguru import logger

from inference.coach_service import CoachService

router = APIRouter()

# Initialize coach (singleton)
coach = None

def get_coach():
    global coach
    if coach is None:
        coach = CoachService()
    return coach

class CoachRequest(BaseModel):
    user_id: int = Field(..., description="User ID", example=1)
    context: Optional[Dict] = Field(None, description="Additional context including user_message", example={"user_message": "How can I focus better?", "current_task": "Write report"})

class CoachResponse(BaseModel):
    message: str = Field(..., description="Coaching message", example="Great job on your 5-day streak! Keep it going! 💪")
    suggested_action: str = Field(..., description="Suggested action", example="Start a 25-minute Pomodoro")

@router.post("/coach", response_model=CoachResponse)
async def get_coaching(request: CoachRequest):
    """
    Get AI coaching suggestions
    
    - **user_id**: User ID to get coaching for
    - **context**: Optional additional context (e.g., current task, timer state)
    
    Returns personalized coaching message and suggested action.
    """
    try:
        logger.info(f"Coaching requested for user {request.user_id}")
        
        coach_service = get_coach()
        result = coach_service.get_coaching(request.user_id, request.context)
        
        return CoachResponse(
            message=result["message"],
            suggested_action=result["suggested_action"]
        )
        
    except Exception as e:
        logger.error(f"Error in coaching service: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating coaching: {str(e)}")

