import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, r2_score
import joblib
from loguru import logger

from utils.data_loaders import DataLoader
from utils.feature_engineering import FeatureEngineer
from utils.model_versioning import ModelVersioning
from config.config import settings

def train_pomodoro_model():
    """Train the Pomodoro recommendation model"""
    logger.info("🚀 Starting Pomodoro model training...")
    
    # Load data
    data_loader = DataLoader()
    
    try:
        # Get sessions data
        sessions_df = data_loader.get_user_sessions(days=90)
        
        if len(sessions_df) < settings.MIN_SAMPLES_FOR_TRAINING:
            logger.warning(f"⚠️ Insufficient data: {len(sessions_df)} samples (need {settings.MIN_SAMPLES_FOR_TRAINING})")
            logger.info("Using synthetic data for initial training...")
            sessions_df = generate_synthetic_data()
        
        # Get additional features
        tasks_df = data_loader.get_user_tasks(days=90)
        moods_df = data_loader.get_user_moods(days=90)
        gamification_df = data_loader.get_user_gamification()
        
        # Prepare training data
        X = []
        y_focus = []
        y_break = []
        
        for _, session in sessions_df.iterrows():
            user_id = session['user_id']
            
            # Get user features
            user_features = {
                'user_id': user_id,
                'avg_focus_duration': 25,
                'avg_break_duration': 5,
                'completion_rate': 50,
                'current_streak': 0,
                'level': 1,
                'total_sessions': 0,
                'sessions_today': 0,
                'recent_mood': 'neutral',
                'hour_of_day': session.get('hour', 12),
                'day_of_week': session.get('day_of_week', 0),
                'is_weekend': session.get('is_weekend', 0),
                'pending_tasks': 0,
                'high_priority_tasks': 0,
            }
            
            # Enhance with actual data
            user_tasks = tasks_df[tasks_df['user_id'] == user_id] if not tasks_df.empty else pd.DataFrame()
            if not user_tasks.empty:
                user_features['completion_rate'] = (user_tasks['is_completed'].mean() * 100) if 'is_completed' in user_tasks.columns else 50
                user_features['pending_tasks'] = len(user_tasks[user_tasks['status'] == 'pending'])
                user_features['high_priority_tasks'] = len(user_tasks[user_tasks['priority'] == 'high'])
            
            user_moods = moods_df[moods_df['user_id'] == user_id] if not moods_df.empty else pd.DataFrame()
            if not user_moods.empty:
                user_features['recent_mood'] = user_moods.iloc[0]['mood'] if 'mood' in user_moods.columns else 'neutral'
            
            user_gam = gamification_df[gamification_df['user_id'] == user_id] if not gamification_df.empty else pd.DataFrame()
            if not user_gam.empty:
                user_features['current_streak'] = user_gam.iloc[0].get('streak', 0)
                user_features['level'] = user_gam.iloc[0].get('level', 1)
            
            # Calculate averages from user's own sessions
            user_sessions = sessions_df[sessions_df['user_id'] == user_id]
            if not user_sessions.empty:
                work_sessions = user_sessions[user_sessions['session_type'] == 'work']
                break_sessions = user_sessions[user_sessions['session_type'].isin(['shortBreak', 'longBreak'])]
                
                if not work_sessions.empty:
                    user_features['avg_focus_duration'] = work_sessions['duration'].mean()
                if not break_sessions.empty:
                    user_features['avg_break_duration'] = break_sessions['duration'].mean()
                user_features['total_sessions'] = len(user_sessions)
            
            # Prepare features
            features = FeatureEngineer.prepare_pomodoro_features(user_features, 'medium')
            X.append(features[0])
            
            # Target: actual session duration
            if session['session_type'] == 'work':
                y_focus.append(session['duration'])
                y_break.append(5)  # Default break
            else:
                y_focus.append(25)  # Default focus
                y_break.append(session['duration'])
        
        X = np.array(X)
        y_focus = np.array(y_focus)
        y_break = np.array(y_break)
        
        if len(X) == 0:
            raise ValueError("No training data available")
        
        # Normalize features
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        
        # Split data
        X_train, X_test, y_focus_train, y_focus_test, y_break_train, y_break_test = train_test_split(
            X_scaled, y_focus, y_break, test_size=0.2, random_state=42
        )
        
        # Train focus duration model
        logger.info("Training focus duration model...")
        focus_model = RandomForestRegressor(n_estimators=100, random_state=42, max_depth=10)
        focus_model.fit(X_train, y_focus_train)
        focus_pred = focus_model.predict(X_test)
        focus_mae = mean_absolute_error(y_focus_test, focus_pred)
        focus_r2 = r2_score(y_focus_test, focus_pred)
        logger.info(f"Focus model - MAE: {focus_mae:.2f}, R²: {focus_r2:.3f}")
        
        # Train break duration model
        logger.info("Training break duration model...")
        break_model = RandomForestRegressor(n_estimators=100, random_state=42, max_depth=10)
        break_model.fit(X_train, y_break_train)
        break_pred = break_model.predict(X_test)
        break_mae = mean_absolute_error(y_break_test, break_pred)
        break_r2 = r2_score(y_break_test, break_pred)
        logger.info(f"Break model - MAE: {break_mae:.2f}, R²: {break_r2:.3f}")
        
        # Combine models (predict both together)
        # For simplicity, we'll use separate models but predict together
        class CombinedModel:
            def __init__(self, focus_model, break_model):
                self.focus_model = focus_model
                self.break_model = break_model
            
            def predict(self, X):
                focus_pred = self.focus_model.predict(X)
                break_pred = self.break_model.predict(X)
                # Clip to reasonable ranges
                focus_pred = np.clip(focus_pred, 5, 60)
                break_pred = np.clip(break_pred, 1, 30)
                return np.column_stack([focus_pred, break_pred])
        
        combined_model = CombinedModel(focus_model, break_model)
        
        # Save model
        model_data = {
            'model': combined_model,
            'scaler': scaler,
            'feature_mean': X.mean(axis=0),
            'feature_std': X.std(axis=0),
            'metrics': {
                'focus_mae': float(focus_mae),
                'focus_r2': float(focus_r2),
                'break_mae': float(break_mae),
                'break_r2': float(break_r2),
            }
        }
        
        os.makedirs(settings.MODEL_DIR, exist_ok=True)
        model_path = settings.POMODORO_MODEL_PATH
        
        joblib.dump(model_data, model_path)
        logger.info(f"✅ Model saved to {model_path}")
        
        # Register with versioning
        versioning = ModelVersioning()
        version = versioning.register_model("pomodoro_recommender", model_path, model_data['metrics'])
        logger.info(f"✅ Model version {version} registered")
        
        data_loader.close()
        return model_path
        
    except Exception as e:
        logger.error(f"❌ Training failed: {e}")
        data_loader.close()
        raise

def generate_synthetic_data():
    """Generate synthetic training data when real data is insufficient"""
    np.random.seed(42)
    n_samples = settings.MIN_SAMPLES_FOR_TRAINING
    
    data = []
    for i in range(n_samples):
        data.append({
            'id': i + 1,
            'user_id': np.random.randint(1, 10),
            'session_type': np.random.choice(['work', 'shortBreak', 'longBreak'], p=[0.7, 0.2, 0.1]),
            'duration': np.random.randint(15, 45) if np.random.random() > 0.5 else np.random.randint(3, 15),
            'completed_at': pd.Timestamp.now() - pd.Timedelta(days=np.random.randint(0, 90)),
            'hour': np.random.randint(0, 24),
            'day_of_week': np.random.randint(0, 7),
            'is_weekend': 1 if np.random.random() > 0.7 else 0,
        })
    
    return pd.DataFrame(data)

if __name__ == "__main__":
    train_pomodoro_model()

