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

class PomodoroRecommender:
    def __init__(self):
        self.model = None
        self.feature_scaler = None
        self.versioning = ModelVersioning()
        self.data_loader = DataLoader()
        self.load_model()
    
    def load_model(self):
        """Load the trained model"""
        try:
            model_path = self.versioning.get_model_path("pomodoro_recommender")
            
            if model_path and os.path.exists(model_path):
                model_data = joblib.load(model_path)
                self.model = model_data.get('model')
                self.feature_scaler = model_data.get('scaler')
                self.feature_mean = model_data.get('feature_mean')
                self.feature_std = model_data.get('feature_std')
                logger.info(f"✅ Loaded Pomodoro model from {model_path}")
            else:
                logger.warning("⚠️ Model not found, using fallback defaults")
                self.model = None
                
        except Exception as e:
            logger.error(f"❌ Error loading model: {e}")
            self.model = None
    
    def recommend(self, user_id: int, task_priority: str = 'medium') -> Dict:
        """
        Recommend personalized Pomodoro durations based on daily patterns and trends
        
        Returns:
            {
                "focus_minutes": int,
                "break_minutes": int,
                "confidence": float,
                "explanation": str
            }
        """
        try:
            # Get user features
            user_features = self.data_loader.get_user_features(user_id)
            
            # Check if we have daily trend data for trend-based prediction
            yesterday_focus = user_features.get('focus_time_yesterday', 0)
            day_before_focus = user_features.get('focus_time_day_before', 0)
            daily_trend = user_features.get('daily_trend', 0)
            avg_focus_3days = user_features.get('avg_focus_last_3_days', 25)
            
            # Trend-based prediction: if we have at least 2 days of data, use trend analysis
            if yesterday_focus > 0 and day_before_focus > 0:
                # Calculate predicted focus time based on trend
                # If trend is positive (increasing), predict continuation
                # If yesterday was 30min and day before was 20min (trend +10), predict ~40min
                predicted_focus_minutes = self._predict_from_trend(
                    yesterday_focus, day_before_focus, daily_trend, avg_focus_3days
                )
                
                # Prepare features for model (for break time and other adjustments)
                features = FeatureEngineer.prepare_pomodoro_features(user_features, task_priority)
                
                # Normalize features if scaler available
                if self.feature_scaler:
                    features = self.feature_scaler.transform(features)
                elif hasattr(self, 'feature_mean') and hasattr(self, 'feature_std'):
                    features, _, _ = FeatureEngineer.normalize_features(
                        features, self.feature_mean, self.feature_std
                    )
                
                # Use model for break time prediction, or calculate based on focus time
                if self.model:
                    prediction = self.model.predict(features)[0]
                    # Use trend-based focus time, but model's break time
                    focus_minutes = predicted_focus_minutes
                    break_minutes = max(1, min(30, int(round(prediction[1]))))
                    confidence = 0.9  # High confidence for trend-based predictions
                else:
                    # Calculate break time as ratio of focus time (standard is 1:5)
                    focus_minutes = predicted_focus_minutes
                    break_minutes = max(3, min(15, int(round(focus_minutes / 5))))
                    confidence = 0.8
                
                explanation = self._generate_trend_explanation(
                    user_features, focus_minutes, break_minutes, daily_trend
                )
                
            else:
                # Not enough historical data, use standard model prediction
                features = FeatureEngineer.prepare_pomodoro_features(user_features, task_priority)
                
                # Normalize features if scaler available
                if self.feature_scaler:
                    features = self.feature_scaler.transform(features)
                elif hasattr(self, 'feature_mean') and hasattr(self, 'feature_std'):
                    features, _, _ = FeatureEngineer.normalize_features(
                        features, self.feature_mean, self.feature_std
                    )
                
                # Predict if model available
                if self.model:
                    prediction = self.model.predict(features)[0]
                    focus_minutes = max(5, min(60, int(round(prediction[0]))))
                    break_minutes = max(1, min(30, int(round(prediction[1]))))
                    confidence = 0.75
                    
                    # Generate explanation
                    explanation = self._generate_explanation(
                        user_features, focus_minutes, break_minutes
                    )
                else:
                    # Fallback to defaults with slight adjustments
                    focus_minutes, break_minutes, explanation = self._fallback_recommendation(user_features)
                    confidence = 0.5
            
            return {
                "focus_minutes": focus_minutes,
                "break_minutes": break_minutes,
                "confidence": confidence,
                "explanation": explanation
            }
            
        except Exception as e:
            logger.error(f"Error in recommendation: {e}")
            return {
                "focus_minutes": 25,
                "break_minutes": 5,
                "confidence": 0.0,
                "explanation": "Using default Pomodoro timing due to error"
            }
    
    def _predict_from_trend(self, yesterday: float, day_before: float, trend: float, avg_3days: float) -> int:
        """
        Predict today's focus time based on daily trends
        
        Logic:
        - If yesterday = 30min, day before = 20min (trend +10), predict ~40min
        - If trend is consistent, continue the pattern
        - Cap predictions between 15-60 minutes
        - Use moving average as baseline to smooth predictions
        """
        # Calculate predicted value based on trend
        if trend > 0:
            # Increasing trend: predict continuation with slight acceleration
            predicted = yesterday + (trend * 0.8)  # Slightly conservative
        elif trend < 0:
            # Decreasing trend: predict slower decrease (might be temporary)
            predicted = yesterday + (trend * 0.5)  # More conservative
        else:
            # No trend or first day: use yesterday's value or average
            predicted = yesterday if yesterday > 0 else avg_3days
        
        # Smooth with moving average to avoid wild swings
        if avg_3days > 0:
            predicted = (predicted * 0.6) + (avg_3days * 0.4)
        
        # Ensure reasonable bounds
        predicted = max(15, min(60, predicted))
        
        # Round to nearest 5 minutes for cleaner values
        predicted = round(predicted / 5) * 5
        
        return int(predicted)
    
    def _generate_trend_explanation(self, features: Dict, focus: int, break_min: int, trend: float) -> str:
        """Generate explanation based on trend analysis"""
        explanations = []
        
        yesterday = features.get('focus_time_yesterday', 0)
        day_before = features.get('focus_time_day_before', 0)
        
        if trend > 5:
            explanations.append(f"📈 Your focus time is increasing! (from {int(day_before)}min to {int(yesterday)}min)")
            explanations.append(f"Predicted: {focus} minutes to continue building momentum.")
        elif trend < -5:
            explanations.append(f"📉 Your focus time decreased recently ({int(day_before)}min → {int(yesterday)}min)")
            explanations.append(f"Recommended {focus} minutes to help you rebuild focus gradually.")
        else:
            explanations.append(f"📊 Based on your recent pattern ({int(yesterday)}min yesterday),")
            explanations.append(f"recommended {focus} minutes for today.")
        
        # Add context
        if features.get('current_streak', 0) > 3:
            explanations.append(f"🎯 You're on a {features['current_streak']}-day streak!")
        
        return " ".join(explanations)
    
    def _generate_explanation(self, features: Dict, focus: int, break_min: int) -> str:
        """Generate human-readable explanation"""
        explanations = []
        
        if features.get('current_streak', 0) > 7:
            explanations.append(f"You're on a {features['current_streak']}-day streak! 🎉")
        
        if features.get('completion_rate', 50) > 80:
            explanations.append("Your high completion rate suggests you can handle longer focus sessions.")
        elif features.get('completion_rate', 50) < 50:
            explanations.append("Shorter sessions might help improve your focus.")
        
        mood = features.get('recent_mood', 'neutral')
        if mood in ['tired', 'anxious']:
            explanations.append("Since you're feeling a bit low, shorter sessions are recommended.")
        elif mood == 'happy':
            explanations.append("Your positive mood suggests you're ready for productive work!")
        
        if features.get('sessions_today', 0) > 5:
            explanations.append("You've done many sessions today - consider longer breaks.")
        
        hour = features.get('hour_of_day', 12)
        if hour >= 22 or hour < 6:
            explanations.append("It's late - shorter sessions are better for your rest.")
        
        base_explanation = f"Recommended {focus}-minute focus sessions with {break_min}-minute breaks"
        
        if explanations:
            return f"{base_explanation}. {' '.join(explanations[:2])}"
        else:
            return base_explanation
    
    def _fallback_recommendation(self, features: Dict) -> tuple:
        """Generate fallback recommendation based on heuristics"""
        base_focus = 25
        base_break = 5
        
        # Adjust based on user history
        avg_focus = features.get('avg_focus_duration', 25)
        avg_break = features.get('avg_break_duration', 5)
        
        # Adjust based on streak
        streak = features.get('current_streak', 0)
        if streak > 5:
            base_focus = min(35, base_focus + 5)
        
        # Adjust based on mood
        mood = features.get('recent_mood', 'neutral')
        if mood in ['tired', 'anxious']:
            base_focus = max(15, base_focus - 5)
            base_break = min(10, base_break + 2)
        elif mood == 'happy':
            base_focus = min(30, base_focus + 5)
        
        # Adjust based on time of day
        hour = features.get('hour_of_day', 12)
        if hour >= 22 or hour < 6:
            base_focus = max(15, base_focus - 5)
        
        explanation = f"Based on your activity pattern: {int(avg_focus)}min avg focus, {int(avg_break)}min avg break"
        
        return int(base_focus), int(base_break), explanation

