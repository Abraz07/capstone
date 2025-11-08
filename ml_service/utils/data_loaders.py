import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import psycopg2
from psycopg2.extras import RealDictCursor
from typing import List, Dict, Optional
import pandas as pd
from datetime import datetime, timedelta
from config.config import settings
from loguru import logger

class DataLoader:
    def __init__(self):
        self.conn = None
        self.connect()
    
    def connect(self):
        """Establish database connection"""
        try:
            # Get password from settings, default to "postgres" if not set
            password = settings.DB_PASSWORD
            if not password or password == '':
                password = "postgres"  # Default PostgreSQL password
            
            # Build connection parameters
            conn_params = {
                'host': settings.DB_HOST,
                'port': settings.DB_PORT,
                'database': settings.DB_NAME,
                'user': settings.DB_USER,
            }
            
            # Only add password if it's not None
            if password:
                conn_params['password'] = password
            
            self.conn = psycopg2.connect(**conn_params)
            logger.info("✅ Connected to database")
        except Exception as e:
            logger.error(f"❌ Database connection failed: {e}")
            logger.error(f"   Trying to connect to: {settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME} as {settings.DB_USER}")
            raise
    
    def close(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()
            logger.info("Database connection closed")
    
    def get_user_sessions(self, user_id: Optional[int] = None, days: int = 30) -> pd.DataFrame:
        """Load timer sessions for training"""
        try:
            query = """
                SELECT 
                    ts.id,
                    ts.user_id,
                    ts.session_type,
                    ts.duration,
                    ts.completed_at,
                    u.id as user_id_ref
                FROM timer_sessions ts
                JOIN users u ON ts.user_id = u.id
                WHERE ts.completed_at >= NOW() - INTERVAL '%s days'
            """ % days
            
            if user_id:
                query += " AND ts.user_id = %s" % user_id
            
            query += " ORDER BY ts.completed_at DESC"
            
            df = pd.read_sql_query(query, self.conn)
            
            if not df.empty:
                df['completed_at'] = pd.to_datetime(df['completed_at'])
                df['hour'] = df['completed_at'].dt.hour
                df['day_of_week'] = df['completed_at'].dt.dayofweek
                df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)
            
            logger.info(f"Loaded {len(df)} timer sessions")
            return df
            
        except Exception as e:
            logger.error(f"Error loading sessions: {e}")
            return pd.DataFrame()
    
    def get_user_tasks(self, user_id: Optional[int] = None, days: int = 30) -> pd.DataFrame:
        """Load tasks for training"""
        try:
            query = """
                SELECT 
                    t.id,
                    t.user_id,
                    t.title,
                    t.description,
                    t.priority,
                    t.status,
                    t.tag,
                    t.due_date,
                    t.created_at,
                    t.updated_at,
                    CASE 
                        WHEN t.status = 'completed' THEN t.updated_at 
                        ELSE NULL 
                    END as completed_at
                FROM tasks t
                JOIN users u ON t.user_id = u.id
                WHERE t.created_at >= NOW() - INTERVAL '%s days'
            """ % days
            
            if user_id:
                query += " AND t.user_id = %s" % user_id
            
            query += " ORDER BY t.created_at DESC"
            
            df = pd.read_sql_query(query, self.conn)
            
            if not df.empty:
                df['created_at'] = pd.to_datetime(df['created_at'])
                df['updated_at'] = pd.to_datetime(df['updated_at'])
                df['completed_at'] = pd.to_datetime(df['completed_at'], errors='coerce')
                df['completion_time'] = (df['completed_at'] - df['created_at']).dt.total_seconds() / 60
                df['is_completed'] = (df['status'] == 'completed').astype(int)
            
            logger.info(f"Loaded {len(df)} tasks")
            return df
            
        except Exception as e:
            logger.error(f"Error loading tasks: {e}")
            return pd.DataFrame()
    
    def get_user_moods(self, user_id: Optional[int] = None, days: int = 30) -> pd.DataFrame:
        """Load mood logs for training"""
        try:
            query = """
                SELECT 
                    ml.id,
                    ml.user_id,
                    ml.mood,
                    ml.note,
                    ml.created_at
                FROM mood_logs ml
                JOIN users u ON ml.user_id = u.id
                WHERE ml.created_at >= NOW() - INTERVAL '%s days'
            """ % days
            
            if user_id:
                query += " AND ml.user_id = %s" % user_id
            
            query += " ORDER BY ml.created_at DESC"
            
            df = pd.read_sql_query(query, self.conn)
            
            if not df.empty:
                df['created_at'] = pd.to_datetime(df['created_at'])
            
            logger.info(f"Loaded {len(df)} mood logs")
            return df
            
        except Exception as e:
            logger.error(f"Error loading moods: {e}")
            return pd.DataFrame()
    
    def get_user_gamification(self, user_id: Optional[int] = None) -> pd.DataFrame:
        """Load gamification data"""
        try:
            query = """
                SELECT 
                    ug.user_id,
                    ug.level,
                    ug.points,
                    ug.total_points,
                    ug.streak,
                    ug.last_activity_date
                FROM user_gamification ug
                JOIN users u ON ug.user_id = u.id
            """
            
            if user_id:
                query += " WHERE ug.user_id = %s" % user_id
            
            df = pd.read_sql_query(query, self.conn)
            
            logger.info(f"Loaded {len(df)} gamification records")
            return df
            
        except Exception as e:
            logger.error(f"Error loading gamification: {e}")
            return pd.DataFrame()
    
    def get_daily_focus_time(self, user_id: int, days: int = 7) -> pd.DataFrame:
        """Get daily total focus time for trend analysis"""
        try:
            # Use parameterized query - days is safe as it's always an integer from code
            # PostgreSQL INTERVAL can be constructed using make_interval
            query = """
                SELECT 
                    DATE(completed_at) as date,
                    SUM(duration) / 60.0 as total_focus_minutes
                FROM timer_sessions
                WHERE user_id = %s 
                    AND session_type = 'work' 
                    AND completed_at >= NOW() - make_interval(days => %s)
                GROUP BY DATE(completed_at)
                ORDER BY date DESC
                LIMIT %s
            """
            
            df = pd.read_sql_query(query, self.conn, params=[user_id, days, days])
            
            if not df.empty:
                df['date'] = pd.to_datetime(df['date'])
                df = df.sort_values('date')
                df['total_focus_minutes'] = df['total_focus_minutes'].fillna(0)
            
            logger.info(f"Loaded daily focus time for user {user_id}: {len(df)} days")
            return df
            
        except Exception as e:
            logger.error(f"Error loading daily focus time: {e}")
            return pd.DataFrame(columns=['date', 'total_focus_minutes'])
    
    def get_user_features(self, user_id: int) -> Dict:
        """Get comprehensive user features for inference"""
        try:
            # Get recent data
            sessions = self.get_user_sessions(user_id=user_id, days=7)
            tasks = self.get_user_tasks(user_id=user_id, days=7)
            moods = self.get_user_moods(user_id=user_id, days=7)
            gamification = self.get_user_gamification(user_id=user_id)
            
            # Get daily focus time patterns for trend analysis
            daily_focus = self.get_daily_focus_time(user_id=user_id, days=7)
            
            features = {
                'user_id': user_id,
                'total_sessions': len(sessions),
                'avg_session_duration': sessions['duration'].mean() if not sessions.empty else 25,
                'completion_rate': (tasks['is_completed'].mean() * 100) if not tasks.empty and 'is_completed' in tasks.columns else 50,
                'current_streak': gamification['streak'].iloc[0] if not gamification.empty else 0,
                'level': gamification['level'].iloc[0] if not gamification.empty else 1,
                'recent_mood': moods['mood'].iloc[0] if not moods.empty else 'neutral',
                'hour_of_day': datetime.now().hour,
                'day_of_week': datetime.now().weekday(),
                'is_weekend': 1 if datetime.now().weekday() >= 5 else 0,
            }
            
            # Task-related features
            if not tasks.empty:
                features['pending_tasks'] = len(tasks[tasks['status'] == 'pending'])
                features['high_priority_tasks'] = len(tasks[tasks['priority'] == 'high'])
                features['avg_task_completion_time'] = tasks['completion_time'].mean() if 'completion_time' in tasks.columns else 0
            else:
                features['pending_tasks'] = 0
                features['high_priority_tasks'] = 0
                features['avg_task_completion_time'] = 0
            
            # Session-related features
            if not sessions.empty:
                features['avg_focus_duration'] = sessions[sessions['session_type'] == 'work']['duration'].mean() if 'work' in sessions['session_type'].values else 25
                features['avg_break_duration'] = sessions[sessions['session_type'] == 'shortBreak']['duration'].mean() if 'shortBreak' in sessions['session_type'].values else 5
                features['sessions_today'] = len(sessions[sessions['completed_at'].dt.date == datetime.now().date()])
            else:
                features['avg_focus_duration'] = 25
                features['avg_break_duration'] = 5
                features['sessions_today'] = 0
            
            # Daily focus time trend features
            if not daily_focus.empty and len(daily_focus) >= 1:
                # Get last 3 days of focus time (excluding today)
                today = datetime.now().date()
                daily_focus['date_only'] = daily_focus['date'].dt.date
                
                # Get yesterday's focus time
                yesterday = today - timedelta(days=1)
                yesterday_data = daily_focus[daily_focus['date_only'] == yesterday]
                features['focus_time_yesterday'] = yesterday_data['total_focus_minutes'].iloc[0] if not yesterday_data.empty else 0
                
                # Get day before yesterday's focus time
                day_before = today - timedelta(days=2)
                day_before_data = daily_focus[daily_focus['date_only'] == day_before]
                features['focus_time_day_before'] = day_before_data['total_focus_minutes'].iloc[0] if not day_before_data.empty else 0
                
                # Get 3 days ago focus time
                three_days_ago = today - timedelta(days=3)
                three_days_ago_data = daily_focus[daily_focus['date_only'] == three_days_ago]
                features['focus_time_three_days_ago'] = three_days_ago_data['total_focus_minutes'].iloc[0] if not three_days_ago_data.empty else 0
                
                # Calculate trend (positive if increasing, negative if decreasing)
                if features['focus_time_yesterday'] > 0 and features['focus_time_day_before'] > 0:
                    features['daily_trend'] = features['focus_time_yesterday'] - features['focus_time_day_before']
                elif features['focus_time_yesterday'] > 0:
                    features['daily_trend'] = features['focus_time_yesterday']  # New pattern starting
                else:
                    features['daily_trend'] = 0
                
                # Average of last 3 days (for baseline)
                last_3_days = [features['focus_time_yesterday'], features['focus_time_day_before'], features['focus_time_three_days_ago']]
                last_3_days = [x for x in last_3_days if x > 0]
                features['avg_focus_last_3_days'] = sum(last_3_days) / len(last_3_days) if last_3_days else 25
            else:
                # No historical data
                features['focus_time_yesterday'] = 0
                features['focus_time_day_before'] = 0
                features['focus_time_three_days_ago'] = 0
                features['daily_trend'] = 0
                features['avg_focus_last_3_days'] = 25
            
            return features
            
        except Exception as e:
            logger.error(f"Error getting user features: {e}")
            return {
                'user_id': user_id,
                'avg_focus_duration': 25,
                'avg_break_duration': 5,
                'completion_rate': 50,
                'current_streak': 0,
                'level': 1,
                'hour_of_day': datetime.now().hour,
                'day_of_week': datetime.now().weekday(),
                'is_weekend': 0,
                'pending_tasks': 0,
                'high_priority_tasks': 0,
                'focus_time_yesterday': 0,
                'focus_time_day_before': 0,
                'focus_time_three_days_ago': 0,
                'daily_trend': 0,
                'avg_focus_last_3_days': 25,
            }

