import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
import joblib
from loguru import logger

from utils.data_loaders import DataLoader
from utils.feature_engineering import FeatureEngineer
from utils.model_versioning import ModelVersioning
from config.config import settings

def train_distraction_model():
    """Train the distraction prediction model"""
    logger.info("🚀 Starting distraction prediction model training...")
    
    # Load data
    data_loader = DataLoader()
    
    try:
        # Get sessions data
        sessions_df = data_loader.get_user_sessions(days=90)
        
        if len(sessions_df) < settings.MIN_SAMPLES_FOR_TRAINING:
            logger.warning(f"⚠️ Insufficient data: {len(sessions_df)} samples")
            logger.info("Using synthetic data for initial training...")
            sessions_df = generate_synthetic_distraction_data()
        
        # Get additional features
        tasks_df = data_loader.get_user_tasks(days=90)
        moods_df = data_loader.get_user_moods(days=90)
        gamification_df = data_loader.get_user_gamification()
        
        # Prepare training data
        # For distraction, we'll simulate based on session patterns
        X = []
        y = []
        
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
            
            user_sessions = sessions_df[sessions_df['user_id'] == user_id]
            if not user_sessions.empty:
                user_features['total_sessions'] = len(user_sessions)
                user_features['sessions_today'] = len(user_sessions[user_sessions['completed_at'].dt.date == pd.Timestamp.now().date()])
            
            # Prepare features
            session_duration = session['duration']
            features = FeatureEngineer.prepare_distraction_features(user_features, session_duration)
            X.append(features[0])
            
            # Simulate distraction label based on heuristics
            # In real scenario, this would come from interruption data
            distraction_prob = calculate_distraction_probability(user_features, session_duration)
            distraction_label = 1 if distraction_prob > 0.5 else 0
            y.append(distraction_label)
        
        X = np.array(X)
        y = np.array(y)
        
        if len(X) == 0:
            raise ValueError("No training data available")
        
        # Normalize features
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X_scaled, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Train model
        logger.info("Training distraction prediction model...")
        model = RandomForestClassifier(n_estimators=100, random_state=42, max_depth=10, class_weight='balanced')
        model.fit(X_train, y_train)
        
        # Evaluate
        y_pred = model.predict(X_test)
        y_pred_proba = model.predict_proba(X_test)[:, 1]
        
        accuracy = accuracy_score(y_test, y_pred)
        precision = precision_score(y_test, y_pred, zero_division=0)
        recall = recall_score(y_test, y_pred, zero_division=0)
        f1 = f1_score(y_test, y_pred, zero_division=0)
        auc = roc_auc_score(y_test, y_pred_proba) if len(np.unique(y_test)) > 1 else 0.5
        
        logger.info(f"Model metrics - Accuracy: {accuracy:.3f}, Precision: {precision:.3f}, Recall: {recall:.3f}, F1: {f1:.3f}, AUC: {auc:.3f}")
        
        # Save model
        model_data = {
            'model': model,
            'scaler': scaler,
            'feature_mean': X.mean(axis=0),
            'feature_std': X.std(axis=0),
            'metrics': {
                'accuracy': float(accuracy),
                'precision': float(precision),
                'recall': float(recall),
                'f1': float(f1),
                'auc': float(auc),
            }
        }
        
        os.makedirs(settings.MODEL_DIR, exist_ok=True)
        model_path = settings.DISTRACTION_MODEL_PATH
        
        joblib.dump(model_data, model_path)
        logger.info(f"✅ Model saved to {model_path}")
        
        # Register with versioning
        versioning = ModelVersioning()
        version = versioning.register_model("distraction_predictor", model_path, model_data['metrics'])
        logger.info(f"✅ Model version {version} registered")
        
        data_loader.close()
        return model_path
        
    except Exception as e:
        logger.error(f"❌ Training failed: {e}")
        data_loader.close()
        raise

def calculate_distraction_probability(features: dict, session_duration: int) -> float:
    """Calculate distraction probability based on features"""
    prob = 0.3  # Base probability
    
    # Mood factors
    mood = features.get('recent_mood', 'neutral')
    if mood in ['anxious', 'tired']:
        prob += 0.2
    elif mood == 'happy':
        prob -= 0.1
    
    # Time factors
    hour = features.get('hour_of_day', 12)
    if hour >= 22 or hour < 6:
        prob += 0.15
    elif 14 <= hour <= 16:
        prob += 0.1
    
    # Task load
    if features.get('pending_tasks', 0) > 5:
        prob += 0.15
    
    # Streak
    if features.get('current_streak', 0) < 2:
        prob += 0.1
    
    # Session duration
    if session_duration > 30:
        prob += 0.1
    
    return np.clip(prob, 0, 1)

def generate_synthetic_distraction_data():
    """Generate synthetic distraction training data"""
    np.random.seed(42)
    n_samples = settings.MIN_SAMPLES_FOR_TRAINING
    
    data = []
    for i in range(n_samples):
        data.append({
            'id': i + 1,
            'user_id': np.random.randint(1, 10),
            'session_type': 'work',
            'duration': np.random.randint(15, 45),
            'completed_at': pd.Timestamp.now() - pd.Timedelta(days=np.random.randint(0, 90)),
            'hour': np.random.randint(0, 24),
            'day_of_week': np.random.randint(0, 7),
            'is_weekend': 1 if np.random.random() > 0.7 else 0,
        })
    
    return pd.DataFrame(data)

if __name__ == "__main__":
    train_distraction_model()

