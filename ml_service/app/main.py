import os
import sys

# Add parent directory to path
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Dict
from loguru import logger
import uvicorn

from config.config import settings
from app.routers import pomodoro, sentiment, coach, distraction

# Configure logging
logger.remove()
logger.add(
    sys.stdout,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan> - <level>{message}</level>",
    level=settings.LOG_LEVEL
)

app = FastAPI(
    title="FocusWave ML Service",
    description="Machine Learning microservice for FocusWave productivity platform",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(pomodoro.router, prefix="/ml", tags=["Pomodoro"])
app.include_router(sentiment.router, prefix="/ml", tags=["Sentiment"])
app.include_router(coach.router, prefix="/ml", tags=["Coach"])
app.include_router(distraction.router, prefix="/ml", tags=["Distraction"])

@app.get("/")
async def root():
    return {
        "service": "FocusWave ML Service",
        "status": "running",
        "version": "1.0.0",
        "endpoints": {
            "pomodoro": "/ml/recommend-pomodoro",
            "sentiment": "/ml/sentiment",
            "coach": "/ml/coach",
            "distraction": "/ml/distraction-predict"
        }
    }

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": "ml-service"
    }

if __name__ == "__main__":
    uvicorn.run(
        app,
        host=settings.ML_SERVICE_HOST,
        port=settings.ML_SERVICE_PORT,
        reload=False
    )

