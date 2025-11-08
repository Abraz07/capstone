import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import schedule
import time
from loguru import logger
from config.config import settings

def retrain_models():
    """Retrain all models"""
    logger.info("🔄 Starting scheduled model retraining...")
    
    try:
        # Import training scripts
        from training.train_pomodoro_model import train_pomodoro_model
        from training.train_distraction_model import train_distraction_model
        
        # Train Pomodoro model
        logger.info("Training Pomodoro recommendation model...")
        train_pomodoro_model()
        
        # Train distraction model
        logger.info("Training distraction prediction model...")
        train_distraction_model()
        
        logger.info("✅ Model retraining completed successfully")
        
    except Exception as e:
        logger.error(f"❌ Error during retraining: {e}")

def run_scheduler():
    """Run the retraining scheduler"""
    logger.info(f"⏰ Starting retraining scheduler (interval: {settings.RETRAIN_INTERVAL_HOURS} hours)")
    
    # Schedule retraining
    schedule.every(settings.RETRAIN_INTERVAL_HOURS).hours.do(retrain_models)
    
    # Run initial training
    logger.info("Running initial training...")
    retrain_models()
    
    # Keep scheduler running
    while True:
        schedule.run_pending()
        time.sleep(3600)  # Check every hour

if __name__ == "__main__":
    run_scheduler()

