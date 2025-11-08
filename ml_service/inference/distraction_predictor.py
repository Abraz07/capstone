import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import joblib
import numpy as np
from typing import Dict, Optional
from loguru import logger
from config.config import settings
from utils.feature_engineering import FeatureEngineer
from utils.data_loaders import DataLoader
from utils.model_versioning import ModelVersioning

class DistractionPredictor:
    def __init__(self):
        self.model = None
        self.feature_scaler = None
        self.versioning = ModelVersioning()
        self.data_loader = DataLoader()
        self.distraction_triggers = [
            "high_task_load",
            "low_mood",
            "late_hour",
            "weekend",
            "low_streak",
            "stress"
        ]
        self.load_model()
    
    def load_model(self):
        """Load the trained model"""
        try:
            model_path = self.versioning.get_model_path("distraction_predictor")
            
            if model_path and os.path.exists(model_path):
                model_data = joblib.load(model_path)
                self.model = model_data.get('model')
                self.feature_scaler = model_data.get('scaler')
                self.feature_mean = model_data.get('feature_mean')
                self.feature_std = model_data.get('feature_std')
                logger.info(f"✅ Loaded distraction predictor from {model_path}")
            else:
                logger.warning("⚠️ Model not found, using heuristic fallback")
                self.model = None
                
        except Exception as e:
            logger.error(f"❌ Error loading model: {e}")
            self.model = None
    
    def predict(self, user_id: int, session_duration: int = 25) -> Dict:
        """
        Predict distraction probability
        
        Returns:
            {
                "distraction_probability": float (0-1),
                "top_trigger": str
            }
        """
        try:
            # Get user features
            user_features = self.data_loader.get_user_features(user_id)
            
            # Prepare features
            features = FeatureEngineer.prepare_distraction_features(user_features, session_duration)
            
            # Normalize if scaler available
            if self.feature_scaler:
                features = self.feature_scaler.transform(features)
            elif hasattr(self, 'feature_mean') and hasattr(self, 'feature_std'):
                features, _, _ = FeatureEngineer.normalize_features(
                    features, self.feature_mean, self.feature_std
                )
            
            # Predict if model available
            if self.model:
                probability = self.model.predict_proba(features)[0][1]  # Probability of distraction
                probability = float(np.clip(probability, 0, 1))
            else:
                # Fallback: heuristic-based prediction
                probability = self._heuristic_prediction(user_features, session_duration)
            
            # Determine top trigger
            top_trigger = self._identify_trigger(user_features, session_duration)
            
            return {
                "distraction_probability": round(probability, 3),
                "top_trigger": top_trigger
            }
            
        except Exception as e:
            logger.error(f"Error in distraction prediction: {e}")
            return {
                "distraction_probability": 0.5,
                "top_trigger": "unknown"
            }
    
    def _heuristic_prediction(self, features: Dict, session_duration: int) -> float:
        """Heuristic-based distraction prediction"""
        probability = 0.3  # Base probability
        
        # Adjust based on mood
        mood = features.get('recent_mood', 'neutral')
        if mood in ['anxious', 'tired', 'sad']:
            probability += 0.2
        elif mood == 'happy':
            probability -= 0.1
        
        # Adjust based on time
        hour = features.get('hour_of_day', 12)
        if hour >= 22 or hour < 6:
            probability += 0.15
        elif 14 <= hour <= 16:  # Afternoon slump
            probability += 0.1
        
        # Adjust based on weekend
        if features.get('is_weekend', 0):
            probability += 0.1
        
        # Adjust based on task load
        pending_tasks = features.get('pending_tasks', 0)
        if pending_tasks > 5:
            probability += 0.15
        elif pending_tasks > 10:
            probability += 0.1
        
        # Adjust based on streak
        streak = features.get('current_streak', 0)
        if streak < 2:
            probability += 0.1
        elif streak > 7:
            probability -= 0.1
        
        # Adjust based on session duration
        if session_duration > 30:
            probability += 0.1
        elif session_duration < 15:
            probability -= 0.05
        
        # Adjust based on sessions today
        sessions_today = features.get('sessions_today', 0)
        if sessions_today > 8:
            probability += 0.15
        
        return np.clip(probability, 0, 1)
    
    def _identify_trigger(self, features: Dict, session_duration: int) -> str:
        """Identify the top distraction trigger"""
        triggers = {}
        
        # High task load
        pending_tasks = features.get('pending_tasks', 0)
        if pending_tasks > 5:
            triggers['high_task_load'] = min(pending_tasks / 10, 1.0)
        
        # Low mood
        mood = features.get('recent_mood', 'neutral')
        if mood in ['anxious', 'tired', 'sad']:
            triggers['low_mood'] = 0.8
        
        # Late hour
        hour = features.get('hour_of_day', 12)
        if hour >= 22 or hour < 6:
            triggers['late_hour'] = 0.7
        
        # Weekend
        if features.get('is_weekend', 0):
            triggers['weekend'] = 0.6
        
        # Low streak
        streak = features.get('current_streak', 0)
        if streak < 2:
            triggers['low_streak'] = 0.5
        
        # Stress (composite)
        stress_score = (
            (1 if mood in ['anxious', 'tired'] else 0) * 0.5 +
            (pending_tasks > 5) * 0.3 +
            (features.get('high_priority_tasks', 0) > 3) * 0.2
        )
        if stress_score > 0.5:
            triggers['stress'] = stress_score
        
        if triggers:
            return max(triggers.items(), key=lambda x: x[1])[0]
        else:
            return "none"

