#!/usr/bin/env python3
"""
Main entry point for running the ML service
"""
import sys
import os

# Add project root to path
project_root = os.path.dirname(os.path.abspath(__file__))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# Now import after path is set
from app.main import app
import uvicorn
from config.config import settings

if __name__ == "__main__":
    # Run uvicorn directly with the app
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.ML_SERVICE_HOST,
        port=settings.ML_SERVICE_PORT,
        reload=False,
        log_level=settings.LOG_LEVEL.lower()
    )

