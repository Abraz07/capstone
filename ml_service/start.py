#!/usr/bin/env python3
"""
Simple startup script that sets up paths correctly
"""
import sys
import os

# Get the directory where this script is located
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Add to Python path
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

# Now we can import
from app.main import app
import uvicorn
from config.config import settings

if __name__ == "__main__":
    print(f"🚀 Starting ML Service on http://{settings.ML_SERVICE_HOST}:{settings.ML_SERVICE_PORT}")
    print(f"📚 API docs: http://{settings.ML_SERVICE_HOST}:{settings.ML_SERVICE_PORT}/docs")
    print("")
    
    uvicorn.run(
        app,
        host=settings.ML_SERVICE_HOST,
        port=settings.ML_SERVICE_PORT,
        log_level=settings.LOG_LEVEL.lower()
    )

