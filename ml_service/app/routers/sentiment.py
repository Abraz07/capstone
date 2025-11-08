import os
import sys

# Add ml_service root to path
ml_service_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if ml_service_root not in sys.path:
    sys.path.insert(0, ml_service_root)

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
from loguru import logger

from inference.sentiment_analyzer import SentimentAnalyzer
from inference.mood_suggestions import MoodSuggestionsService

router = APIRouter()

# Initialize analyzer (singleton)
analyzer = None

def get_analyzer():
    global analyzer
    if analyzer is None:
        analyzer = SentimentAnalyzer()
    return analyzer

# Initialize mood suggestions service (singleton)
mood_suggestions_service = None

def get_mood_suggestions_service():
    global mood_suggestions_service
    if mood_suggestions_service is None:
        mood_suggestions_service = MoodSuggestionsService()
    return mood_suggestions_service

class SentimentRequest(BaseModel):
    text: str = Field(..., description="Text to analyze", example="I'm feeling great today and accomplished a lot!")

class SentimentResponse(BaseModel):
    sentiment_score: float = Field(..., description="Sentiment score from -1 (negative) to 1 (positive)", example=0.85)
    label: str = Field(..., description="Sentiment label: negative, neutral, or positive", example="positive")

class MoodSuggestionsRequest(BaseModel):
    user_id: int = Field(..., description="User ID", example=1)
    mood: str = Field(..., description="Mood value", example="happy")
    note: Optional[str] = Field("", description="Optional mood description/note", example="Feeling great today!")

class MoodSuggestionsResponse(BaseModel):
    suggestions: List[str] = Field(..., description="List of actionable suggestions")
    insights: str = Field(..., description="AI-generated insight about the mood")
    recommended_activities: List[str] = Field(..., description="Specific activities to try")
    affirmation: str = Field(..., description="Positive affirmation")
    sentiment_analysis: dict = Field(..., description="Sentiment analysis of the note")

@router.post("/sentiment", response_model=SentimentResponse)
async def analyze_sentiment(request: SentimentRequest):
    """
    Analyze sentiment of text
    
    - **text**: Text to analyze (e.g., mood journal notes)
    
    Returns sentiment score and label.
    """
    try:
        logger.info(f"Sentiment analysis requested for text: {request.text[:50]}...")
        
        analyzer = get_analyzer()
        result = analyzer.analyze(request.text)
        
        return SentimentResponse(
            sentiment_score=result["sentiment_score"],
            label=result["label"]
        )
        
    except Exception as e:
        logger.error(f"Error in sentiment analysis: {e}")
        raise HTTPException(status_code=500, detail=f"Error analyzing sentiment: {str(e)}")

@router.post("/mood-suggestions", response_model=MoodSuggestionsResponse)
async def get_mood_suggestions(request: MoodSuggestionsRequest):
    """
    Get AI-powered personalized suggestions based on mood and description
    
    - **user_id**: User ID
    - **mood**: Current mood (happy, calm, neutral, tired, anxious, sad)
    - **note**: Optional description of how the user is feeling
    
    Returns personalized suggestions, insights, activities, and affirmation.
    """
    try:
        logger.info(f"Mood suggestions requested for user {request.user_id}, mood: {request.mood}")
        
        service = get_mood_suggestions_service()
        result = service.get_mood_suggestions(
            user_id=request.user_id,
            mood=request.mood,
            note=request.note or ""
        )
        
        return MoodSuggestionsResponse(
            suggestions=result["suggestions"],
            insights=result["insights"],
            recommended_activities=result["recommended_activities"],
            affirmation=result["affirmation"],
            sentiment_analysis=result["sentiment_analysis"]
        )
        
    except Exception as e:
        logger.error(f"Error in mood suggestions: {e}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error generating mood suggestions: {str(e)}")

