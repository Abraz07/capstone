import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from typing import Dict, Optional
from loguru import logger
from config.config import settings
from utils.data_loaders import DataLoader
from inference.sentiment_analyzer import SentimentAnalyzer

# Try importing OpenAI
try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    logger.warning("OpenAI library not available")

# Try importing Gemini
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    logger.warning("Google Generative AI library not available")

class CoachService:
    def __init__(self):
        self.data_loader = DataLoader()
        self.sentiment_analyzer = SentimentAnalyzer()
        self.openai_client = None
        self.gemini_client = None
        self.llm_provider = None
        
        # Determine which LLM provider to use
        self._initialize_llm()
    
    def _initialize_llm(self):
        """Initialize LLM client based on configuration"""
        provider_preference = settings.LLM_PROVIDER.lower()
        
        # Clean up API keys
        openai_key = None
        if settings.OPENAI_API_KEY:
            openai_key = settings.OPENAI_API_KEY.strip().strip('"').strip("'")
            if openai_key == "" or openai_key == "your_openai_api_key_here":
                openai_key = None
        
        gemini_key = None
        if settings.GEMINI_API_KEY:
            gemini_key = settings.GEMINI_API_KEY.strip().strip('"').strip("'")
            if gemini_key == "" or gemini_key == "your_gemini_api_key_here":
                gemini_key = None
        
        # Initialize based on preference
        if provider_preference == "gemini" or (provider_preference == "auto" and gemini_key):
            # Try Gemini first
            if GEMINI_AVAILABLE and gemini_key:
                try:
                    genai.configure(api_key=gemini_key)
                    # Try the configured model, with fallback to common models
                    model_name = settings.GEMINI_MODEL
                    models_to_try = [model_name, "gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"]
                    
                    for model in models_to_try:
                        try:
                            self.gemini_client = genai.GenerativeModel(model)
                            self.llm_provider = "gemini"
                            logger.info("✅ Gemini client initialized successfully")
                            logger.info(f"   Using model: {model}")
                            return
                        except Exception as model_error:
                            logger.debug(f"Model {model} failed: {model_error}")
                            continue
                    
                    # If all models failed, log and continue
                    logger.warning(f"⚠️ All Gemini models failed, falling back")
                    self.gemini_client = None
                except Exception as e:
                    logger.warning(f"⚠️ Gemini initialization failed: {e}")
                    self.gemini_client = None
        
        # Fall back to OpenAI
        if provider_preference == "openai" or (provider_preference == "auto" and openai_key):
            if OPENAI_AVAILABLE and openai_key:
                try:
                    self.openai_client = OpenAI(api_key=openai_key)
                    self.llm_provider = "openai"
                    logger.info("✅ OpenAI client initialized successfully")
                    logger.info(f"   Using model: {settings.OPENAI_MODEL}")
                    return
                except Exception as e:
                    logger.warning(f"⚠️ OpenAI initialization failed: {e}")
                    self.openai_client = None
        
        # Try Gemini if OpenAI failed
        if provider_preference == "auto" and not self.llm_provider:
            if GEMINI_AVAILABLE and gemini_key:
                try:
                    genai.configure(api_key=gemini_key)
                    self.gemini_client = genai.GenerativeModel(settings.GEMINI_MODEL)
                    self.llm_provider = "gemini"
                    logger.info("✅ Gemini client initialized successfully (fallback)")
                    logger.info(f"   Using model: {settings.GEMINI_MODEL}")
                    return
                except Exception as e:
                    logger.warning(f"⚠️ Gemini initialization failed: {e}")
        
        # No LLM available
        if not self.llm_provider:
            logger.info("Using rule-based coach (no LLM API key provided)")
            self.llm_provider = "rule-based"
    
    def get_coaching(self, user_id: int, context: Optional[Dict] = None) -> Dict:
        """
        Get AI coaching suggestions
        
        Returns:
            {
                "message": str,
                "suggested_action": str
            }
        """
        try:
            # Get user context
            user_features = self.data_loader.get_user_features(user_id)
            
            # Get recent mood logs for context
            moods = self.data_loader.get_user_moods(user_id=user_id, days=1)
            recent_mood_text = ""
            if not moods.empty and 'note' in moods.columns:
                recent_notes = moods['note'].dropna().tolist()
                if recent_notes:
                    recent_mood_text = " ".join(recent_notes[-3:])  # Last 3 mood notes
            
            # Extract user message from context
            user_message = None
            if context:
                user_message = context.get('user_message') or context.get('message') or context.get('question')
                # Merge other context into user_features
                for key, value in context.items():
                    if key not in ['user_message', 'message', 'question']:
                        user_features[key] = value
            
            # Generate coaching message
            if self.llm_provider == "gemini" and self.gemini_client:
                message, action = self._gemini_coach(user_features, recent_mood_text, user_message)
            elif self.llm_provider == "openai" and self.openai_client:
                message, action = self._openai_coach(user_features, recent_mood_text, user_message)
            else:
                # Enhanced rule-based coach that handles user questions
                message, action = self._rule_based_coach(user_features, recent_mood_text, user_message)
            
            return {
                "message": message,
                "suggested_action": action
            }
            
        except Exception as e:
            logger.error(f"Error in coaching service: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return {
                "message": "Keep up the great work! Remember to take breaks and stay hydrated. 💪",
                "suggested_action": "Take a 5-minute break"
            }
    
    def _gemini_coach(self, features: Dict, mood_text: str, user_message: str = None) -> tuple:
        """Generate coaching using Gemini"""
        try:
            context_prompt = self._build_context_prompt(features, mood_text, user_message)
            
            system_instruction = """You are a supportive, ADHD-friendly productivity coach for FocusWave. 
- Answer questions directly and helpfully
- Provide short, encouraging, actionable advice
- Be empathetic and understanding
- Keep responses under 150 words
- Focus on one clear suggestion
- Use the user's data (streak, tasks, mood) to personalize your response"""
            
            # Combine system instruction with user prompt
            full_prompt = f"{system_instruction}\n\n{context_prompt}"
            
            # Generate response with updated API
            generation_config = {
                "temperature": 0.7,
                "max_output_tokens": 200,
            }
            
            # Try to generate content - handle different model API versions
            try:
                response = self.gemini_client.generate_content(
                    full_prompt,
                    generation_config=generation_config
                )
                message = response.text.strip()
            except Exception as api_error:
                # If model name is wrong, try to list available models and use the first one
                logger.warning(f"Model API error: {api_error}. Trying alternative approach...")
                # Re-initialize with correct model name
                import google.generativeai as genai
                model_name = settings.GEMINI_MODEL
                # Try common model names if the configured one doesn't work
                for alt_model in ["gemini-1.5-flash", "gemini-pro", "gemini-1.5-pro"]:
                    try:
                        temp_client = genai.GenerativeModel(alt_model)
                        response = temp_client.generate_content(
                            full_prompt,
                            generation_config=generation_config
                        )
                        message = response.text.strip()
                        logger.info(f"✅ Using alternative model: {alt_model}")
                        # Update the client for future use
                        self.gemini_client = temp_client
                        break
                    except:
                        continue
                else:
                    raise api_error
            
            # Extract suggested action (simple heuristic)
            action = self._extract_action(message, features)
            
            return message, action
            
        except Exception as e:
            logger.error(f"Gemini coaching error: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return self._rule_based_coach(features, mood_text, user_message)
    
    def _openai_coach(self, features: Dict, mood_text: str, user_message: str = None) -> tuple:
        """Generate coaching using OpenAI"""
        try:
            context_prompt = self._build_context_prompt(features, mood_text, user_message)
            
            system_prompt = """You are a supportive, ADHD-friendly productivity coach for FocusWave. 
- Answer questions directly and helpfully
- Provide short, encouraging, actionable advice
- Be empathetic and understanding
- Keep responses under 150 words
- Focus on one clear suggestion
- Use the user's data (streak, tasks, mood) to personalize your response"""
            
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": context_prompt}
            ]
            
            response = self.openai_client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=messages,
                max_tokens=200,
                temperature=0.7
            )
            
            message = response.choices[0].message.content.strip()
            
            # Extract suggested action (simple heuristic)
            action = self._extract_action(message, features)
            
            return message, action
            
        except Exception as e:
            logger.error(f"OpenAI coaching error: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return self._rule_based_coach(features, mood_text, user_message)
    
    def _build_context_prompt(self, features: Dict, mood_text: str, user_message: str = None) -> str:
        """Build context prompt for LLM"""
        prompt = f"""You are a supportive, ADHD-friendly productivity coach for FocusWave.

User Profile:
- Current streak: {features.get('current_streak', 0)} days
- Level: {features.get('level', 1)}
- Completion rate: {features.get('completion_rate', 50):.1f}%
- Pending tasks: {features.get('pending_tasks', 0)}
- Recent mood: {features.get('recent_mood', 'neutral')}
- Sessions today: {features.get('sessions_today', 0)}
"""
        
        if mood_text:
            prompt += f"\nRecent mood notes: {mood_text[:200]}\n"
        
        if user_message:
            prompt += f"\nUser's question/message: {user_message}\n"
            prompt += "\nPlease answer the user's question directly and provide helpful, actionable advice based on their profile. Be empathetic, encouraging, and ADHD-friendly. Keep your response under 150 words."
        else:
            prompt += "\nProvide one encouraging, actionable coaching message and suggest a concrete action based on their profile."
        
        return prompt
    
    def _rule_based_coach(self, features: Dict, mood_text: str, user_message: str = None) -> tuple:
        """Rule-based coaching fallback with question handling"""
        streak = features.get('current_streak', 0)
        mood = features.get('recent_mood', 'neutral')
        completion_rate = features.get('completion_rate', 50)
        pending_tasks = features.get('pending_tasks', 0)
        sessions_today = features.get('sessions_today', 0)
        
        # If user asked a question, try to answer it
        if user_message:
            user_lower = user_message.lower()
            
            # Handle common questions
            if any(word in user_lower for word in ['how', 'help', 'what', 'why', 'when', 'where', 'can you', 'tell me']):
                # Answer based on question type
                if any(word in user_lower for word in ['focus', 'concentrate', 'distracted']):
                    message = f"Based on your profile (streak: {streak} days, {pending_tasks} pending tasks), here's what helps:\n\n"
                    if pending_tasks > 5:
                        message += "Break your tasks into smaller pieces. Start with just ONE task for 25 minutes using Pomodoro. "
                    if mood in ['anxious', 'tired']:
                        message += f"Since you're feeling {mood}, take a 5-minute break first - breathe deeply. "
                    message += "Remove distractions, set a timer, and commit to just one task. You've got this! 💪"
                    action = "Start a 25-minute Pomodoro"
                    return message, action
                
                elif any(word in user_lower for word in ['task', 'todo', 'overwhelmed']):
                    message = f"You have {pending_tasks} tasks. Let's tackle this:\n\n"
                    message += "1. Pick the MOST important task\n"
                    message += "2. Break it into 3 tiny steps\n"
                    message += "3. Do just the first step now\n"
                    message += "Progress, not perfection! Start small. 🎯"
                    action = "Pick one task and break it down"
                    return message, action
                
                elif any(word in user_lower for word in ['streak', 'motivation', 'motivated']):
                    message = f"Your {streak}-day streak shows you CAN do this! 🎉\n\n"
                    if streak >= 3:
                        message += "You're building great momentum. Keep going - consistency beats intensity. "
                    message += "Remember why you started. Each day adds up. You're stronger than you think! 💪"
                    action = "Continue your streak"
                    return message, action
                
                elif any(word in user_lower for word in ['tired', 'exhausted', 'burnout', 'rest']):
                    message = "Rest is productive! 🧘\n\n"
                    message += "Take a 15-20 minute break. Step away from your screen. "
                    message += f"Rest recharges your focus. You'll come back stronger. Your {streak}-day streak shows your dedication - now rest! 😴"
                    action = "Take a 15-minute break"
                    return message, action
                
                elif any(word in user_lower for word in ['break', 'pomodoro', 'timer']):
                    message = "Pomodoro technique works! ⏱️\n\n"
                    message += f"You've done {sessions_today} sessions today. "
                    message += "Focus for 25 minutes, then take a REAL 5-minute break (walk, stretch, breathe). "
                    message += "This rhythm prevents burnout and maintains focus. Ready to start? 🚀"
                    action = "Start a Pomodoro session"
                    return message, action
                
                else:
                    # Generic helpful response
                    message = f"Great question! Based on your profile:\n\n"
                    message += f"- You're on a {streak}-day streak (amazing! 🔥)\n"
                    message += f"- You have {pending_tasks} tasks pending\n"
                    message += f"- Completion rate: {completion_rate}%\n\n"
                    message += "My advice: Start small, take breaks, celebrate wins. Progress over perfection! 💪"
                    action = "Start with one small task"
                    return message, action
        
        # Original rule-based messages if no question
        messages = []
        actions = []
        
        # Streak-based messages
        if streak >= 7:
            messages.append(f"🔥 Amazing {streak}-day streak! You're building incredible momentum!")
            actions.append("Continue your streak")
        elif streak >= 3:
            messages.append(f"Great job on your {streak}-day streak! Keep it going! 💪")
            actions.append("Maintain your streak")
        elif streak == 0:
            messages.append("Ready to start fresh? Every journey begins with a single step! 🌟")
            actions.append("Start a new streak")
        
        # Mood-based messages
        if mood == 'anxious':
            messages.append("I notice you're feeling anxious. Take a deep breath. You've got this! 💙")
            actions.append("Try a 5-minute breathing exercise")
        elif mood == 'tired':
            messages.append("You seem tired. Remember, rest is productive too. Take care of yourself! 😴")
            actions.append("Take a 15-minute break")
        elif mood == 'happy':
            messages.append("Love seeing that positive energy! Channel it into your tasks! ✨")
            actions.append("Start a focus session")
        elif mood == 'sad':
            messages.append("I'm here for you. Sometimes slowing down helps us move forward better. 💜")
            actions.append("Take a gentle walk")
        
        # Task-based messages
        if pending_tasks > 10:
            messages.append(f"You have {pending_tasks} tasks. Let's break them down - focus on just one right now! 📋")
            actions.append("Pick one task to complete")
        elif pending_tasks == 0:
            messages.append("All clear! Great job staying on top of things! 🎉")
            actions.append("Celebrate your accomplishment")
        
        # Productivity messages
        if completion_rate > 80:
            messages.append("Your completion rate is excellent! You're in the zone! 🎯")
            actions.append("Tackle a challenging task")
        elif completion_rate < 50:
            messages.append("Let's focus on smaller wins. Break tasks into tiny steps! 📝")
            actions.append("Complete one small task")
        
        # Session-based messages
        if sessions_today == 0:
            messages.append("Ready to start your first focus session today? Let's do this! ⏱️")
            actions.append("Start a 25-minute Pomodoro")
        elif sessions_today >= 8:
            messages.append(f"Wow, {sessions_today} sessions today! You're a productivity champion! 🏆")
            actions.append("Take a well-deserved break")
        
        # Default if no specific message
        if not messages:
            messages.append("You're doing great! Keep taking it one step at a time. 💫")
            actions.append("Continue your current activity")
        
        # Return first message and action
        return messages[0], actions[0]
    
    def _extract_action(self, message: str, features: Dict) -> str:
        """Extract suggested action from message"""
        message_lower = message.lower()
        
        # Simple keyword matching
        if 'break' in message_lower or 'rest' in message_lower:
            return "Take a break"
        elif 'session' in message_lower or 'pomodoro' in message_lower or 'focus' in message_lower:
            return "Start a focus session"
        elif 'task' in message_lower:
            return "Work on a task"
        elif 'breathe' in message_lower or 'breathing' in message_lower:
            return "Do a breathing exercise"
        elif 'walk' in message_lower:
            return "Take a walk"
        else:
            # Default based on context
            if features.get('sessions_today', 0) == 0:
                return "Start a focus session"
            elif features.get('pending_tasks', 0) > 0:
                return "Complete a task"
            else:
                return "Take a break"
