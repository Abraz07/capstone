import numpy as np
import pandas as pd
from typing import Dict, List
from datetime import datetime

class FeatureEngineer:
    @staticmethod
    def encode_mood(mood: str) -> int:
        """Encode mood to numeric value"""
        mood_map = {
            'happy': 2,
            'calm': 1,
            'neutral': 0,
            'tired': -1,
            'anxious': -2,
            'sad': -2
        }
        return mood_map.get(mood.lower(), 0)
    
    @staticmethod
    def encode_priority(priority: str) -> int:
        """Encode priority to numeric value"""
        priority_map = {
            'high': 3,
            'medium': 2,
            'low': 1
        }
        return priority_map.get(priority.lower(), 2)
    
    @staticmethod
    def encode_session_type(session_type: str) -> int:
        """Encode session type"""
        type_map = {
            'work': 1,
            'shortBreak': 2,
            'longBreak': 3
        }
        return type_map.get(session_type, 1)
    
    @staticmethod
    def get_time_features(hour: int, day_of_week: int) -> Dict:
        """Extract time-based features"""
        return {
            'hour': hour,
            'day_of_week': day_of_week,
            'is_weekend': 1 if day_of_week >= 5 else 0,
            'is_morning': 1 if 6 <= hour < 12 else 0,
            'is_afternoon': 1 if 12 <= hour < 18 else 0,
            'is_evening': 1 if 18 <= hour < 22 else 0,
            'is_night': 1 if hour >= 22 or hour < 6 else 0,
        }
    
    @staticmethod
    def prepare_pomodoro_features(user_features: Dict, task_priority: str = 'medium') -> np.ndarray:
        """Prepare features for Pomodoro recommendation model"""
        features = []
        
        # User stats
        features.append(user_features.get('avg_focus_duration', 25))
        features.append(user_features.get('avg_break_duration', 5))
        features.append(user_features.get('completion_rate', 50))
        features.append(user_features.get('current_streak', 0))
        features.append(user_features.get('level', 1))
        features.append(user_features.get('total_sessions', 0))
        features.append(user_features.get('sessions_today', 0))
        
        # Daily trend features (NEW - for learning from daily patterns)
        features.append(user_features.get('focus_time_yesterday', 0))
        features.append(user_features.get('focus_time_day_before', 0))
        features.append(user_features.get('focus_time_three_days_ago', 0))
        features.append(user_features.get('daily_trend', 0))  # Positive = increasing, negative = decreasing
        features.append(user_features.get('avg_focus_last_3_days', 25))
        
        # Mood encoding
        mood = user_features.get('recent_mood', 'neutral')
        features.append(FeatureEngineer.encode_mood(mood))
        
        # Time features
        hour = user_features.get('hour_of_day', datetime.now().hour)
        day_of_week = user_features.get('day_of_week', datetime.now().weekday())
        time_feats = FeatureEngineer.get_time_features(hour, day_of_week)
        features.extend([
            time_feats['hour'],
            time_feats['day_of_week'],
            time_feats['is_weekend'],
            time_feats['is_morning'],
            time_feats['is_afternoon'],
            time_feats['is_evening'],
        ])
        
        # Task features
        features.append(user_features.get('pending_tasks', 0))
        features.append(user_features.get('high_priority_tasks', 0))
        features.append(FeatureEngineer.encode_priority(task_priority))
        
        # Productivity score (composite)
        productivity_score = (
            user_features.get('completion_rate', 50) * 0.4 +
            user_features.get('current_streak', 0) * 2 * 0.3 +
            (user_features.get('level', 1) / 10) * 0.3
        )
        features.append(productivity_score)
        
        return np.array(features).reshape(1, -1)
    
    @staticmethod
    def prepare_distraction_features(user_features: Dict, session_duration: int) -> np.ndarray:
        """Prepare features for distraction prediction"""
        features = []
        
        # Session features
        features.append(session_duration)
        features.append(user_features.get('sessions_today', 0))
        features.append(user_features.get('avg_session_duration', 25))
        
        # User state
        features.append(user_features.get('current_streak', 0))
        features.append(user_features.get('level', 1))
        features.append(user_features.get('completion_rate', 50))
        
        # Mood
        mood = user_features.get('recent_mood', 'neutral')
        features.append(FeatureEngineer.encode_mood(mood))
        
        # Time features
        hour = user_features.get('hour_of_day', datetime.now().hour)
        day_of_week = user_features.get('day_of_week', datetime.now().weekday())
        time_feats = FeatureEngineer.get_time_features(hour, day_of_week)
        features.extend([
            time_feats['hour'],
            time_feats['is_weekend'],
            time_feats['is_afternoon'],  # Afternoon distraction is common
        ])
        
        # Task load
        features.append(user_features.get('pending_tasks', 0))
        features.append(user_features.get('high_priority_tasks', 0))
        
        # Stress indicator
        stress_score = (
            (1 if mood in ['anxious', 'tired'] else 0) * 0.5 +
            (user_features.get('high_priority_tasks', 0) > 3) * 0.3 +
            (user_features.get('pending_tasks', 0) > 5) * 0.2
        )
        features.append(stress_score)
        
        return np.array(features).reshape(1, -1)
    
    @staticmethod
    def normalize_features(features: np.ndarray, mean: np.ndarray = None, std: np.ndarray = None) -> np.ndarray:
        """Normalize features using z-score"""
        if mean is None or std is None:
            mean = np.mean(features, axis=0)
            std = np.std(features, axis=0) + 1e-8
        
        normalized = (features - mean) / std
        return normalized, mean, std

