import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from typing import Dict, List
from loguru import logger
from config.config import settings
from utils.data_loaders import DataLoader
from inference.sentiment_analyzer import SentimentAnalyzer
from inference.coach_service import CoachService

# Try importing OpenAI
try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

# Try importing Gemini
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False

class MoodSuggestionsService:
    def __init__(self):
        self.data_loader = DataLoader()
        self.sentiment_analyzer = SentimentAnalyzer()
        self.coach_service = CoachService()
        self.openai_client = self.coach_service.openai_client
        self.gemini_client = self.coach_service.gemini_client
        self.llm_provider = self.coach_service.llm_provider
    
    def get_mood_suggestions(self, user_id: int, mood: str, note: str = "") -> Dict:
        """
        Get AI-powered personalized suggestions based on mood and description
        
        Returns:
            {
                "suggestions": List[str],  # List of actionable suggestions
                "insights": str,  # AI-generated insight about the mood
                "recommended_activities": List[str],  # Specific activities to try
                "affirmation": str,  # Positive affirmation
                "sentiment_analysis": Dict  # Sentiment analysis of the note
            }
        """
        try:
            # Analyze sentiment of the note if provided
            sentiment_result = {
                "sentiment_score": 0.0,
                "label": "neutral"
            }
            if note:
                sentiment_result = self.sentiment_analyzer.analyze(note)
            
            # Get user context for personalized suggestions
            user_features = self.data_loader.get_user_features(user_id)
            
            # Get recent mood history for pattern detection
            moods = self.data_loader.get_user_moods(user_id=user_id, days=7)
            mood_history = []
            if not moods.empty:
                mood_history = moods['mood'].tolist()[:5]  # Last 5 moods
            
            # Generate AI suggestions
            if self.llm_provider == "gemini" and self.gemini_client:
                result = self._gemini_mood_suggestions(mood, note, sentiment_result, user_features, mood_history)
            elif self.llm_provider == "openai" and self.openai_client:
                result = self._openai_mood_suggestions(mood, note, sentiment_result, user_features, mood_history)
            else:
                # Enhanced rule-based suggestions
                result = self._rule_based_mood_suggestions(mood, note, sentiment_result, user_features, mood_history)
            
            return result
            
        except Exception as e:
            logger.error(f"Error in mood suggestions: {e}")
            import traceback
            logger.error(traceback.format_exc())
            # Return fallback suggestions
            return self._get_fallback_suggestions(mood, note)
    
    def _gemini_mood_suggestions(self, mood: str, note: str, sentiment: Dict, features: Dict, mood_history: List) -> Dict:
        """Generate mood suggestions using Gemini"""
        try:
            prompt = self._build_mood_prompt(mood, note, sentiment, features, mood_history)
            
            system_instruction = """You are a compassionate, empathetic AI wellness coach for FocusWave. 
- Provide personalized, actionable suggestions based on the user's mood and description
- Be supportive, understanding, and encouraging
- Give 3-5 specific, practical suggestions
- Include insights about their mood pattern if relevant
- Suggest 2-3 concrete activities they can do right now
- Provide a warm, positive affirmation
- Keep responses concise and helpful
- Be ADHD-friendly (simple, clear, actionable)"""
            
            full_prompt = f"{system_instruction}\n\n{prompt}\n\nFormat your response as:\nSUGGESTIONS:\n1. [suggestion]\n2. [suggestion]\n3. [suggestion]\n\nINSIGHT:\n[insight about their mood]\n\nACTIVITIES:\n1. [activity]\n2. [activity]\n\nAFFIRMATION:\n[positive affirmation]"
            
            generation_config = {
                "temperature": 0.8,
                "max_output_tokens": 400,
            }
            
            try:
                response = self.gemini_client.generate_content(
                    full_prompt,
                    generation_config=generation_config
                )
                message = response.text.strip()
            except Exception as api_error:
                logger.warning(f"Gemini API error: {api_error}")
                return self._rule_based_mood_suggestions(mood, note, sentiment, features, mood_history)
            
            # Parse the response
            return self._parse_ai_response(message, mood, sentiment)
            
        except Exception as e:
            logger.error(f"Gemini mood suggestions error: {e}")
            return self._rule_based_mood_suggestions(mood, note, sentiment, features, mood_history)
    
    def _openai_mood_suggestions(self, mood: str, note: str, sentiment: Dict, features: Dict, mood_history: List) -> Dict:
        """Generate mood suggestions using OpenAI"""
        try:
            prompt = self._build_mood_prompt(mood, note, sentiment, features, mood_history)
            
            system_prompt = """You are a compassionate, empathetic AI wellness coach for FocusWave. 
- Provide personalized, actionable suggestions based on the user's mood and description
- Be supportive, understanding, and encouraging
- Give 3-5 specific, practical suggestions
- Include insights about their mood pattern if relevant
- Suggest 2-3 concrete activities they can do right now
- Provide a warm, positive affirmation
- Keep responses concise and helpful
- Be ADHD-friendly (simple, clear, actionable)

Format your response as:
SUGGESTIONS:
1. [suggestion]
2. [suggestion]
3. [suggestion]

INSIGHT:
[insight about their mood]

ACTIVITIES:
1. [activity]
2. [activity]

AFFIRMATION:
[positive affirmation]"""
            
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ]
            
            response = self.openai_client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=messages,
                max_tokens=400,
                temperature=0.8
            )
            
            message = response.choices[0].message.content.strip()
            
            # Parse the response
            return self._parse_ai_response(message, mood, sentiment)
            
        except Exception as e:
            logger.error(f"OpenAI mood suggestions error: {e}")
            return self._rule_based_mood_suggestions(mood, note, sentiment, features, mood_history)
    
    def _build_mood_prompt(self, mood: str, note: str, sentiment: Dict, features: Dict, mood_history: List) -> str:
        """Build prompt for mood suggestions"""
        prompt = f"""User's Current Mood: {mood}
"""
        
        if note:
            prompt += f"User's Description: {note}\n"
            prompt += f"Sentiment Analysis: {sentiment['label']} (score: {sentiment['sentiment_score']:.2f})\n"
        
        prompt += f"""
User Context:
- Current streak: {features.get('current_streak', 0)} days
- Sessions today: {features.get('sessions_today', 0)}
- Pending tasks: {features.get('pending_tasks', 0)}
- Completion rate: {features.get('completion_rate', 50):.1f}%
"""
        
        if mood_history:
            prompt += f"Recent mood pattern: {', '.join(mood_history[-3:])}\n"
        
        prompt += "\nBased on this information, provide personalized suggestions, insights, activities, and an affirmation to help them."
        
        return prompt
    
    def _parse_ai_response(self, message: str, mood: str, sentiment: Dict) -> Dict:
        """Parse AI response into structured format"""
        suggestions = []
        insight = ""
        activities = []
        affirmation = ""
        
        # Simple parsing
        lines = message.split('\n')
        current_section = None
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            if 'SUGGESTIONS:' in line.upper() or 'SUGGESTION:' in line.upper():
                current_section = 'suggestions'
                continue
            elif 'INSIGHT:' in line.upper():
                current_section = 'insight'
                continue
            elif 'ACTIVITIES:' in line.upper() or 'ACTIVITY:' in line.upper():
                current_section = 'activities'
                continue
            elif 'AFFIRMATION:' in line.upper():
                current_section = 'affirmation'
                continue
            
            if current_section == 'suggestions':
                # Remove numbering if present
                line = line.lstrip('1234567890.-) ')
                if line:
                    suggestions.append(line)
            elif current_section == 'insight':
                insight += line + " "
            elif current_section == 'activities':
                line = line.lstrip('1234567890.-) ')
                if line:
                    activities.append(line)
            elif current_section == 'affirmation':
                affirmation += line + " "
        
        # Clean up
        insight = insight.strip()
        affirmation = affirmation.strip()
        
        # If parsing failed, use fallback
        if not suggestions and not insight:
            return self._get_fallback_suggestions(mood, "")
        
        # Ensure we have at least some suggestions
        if not suggestions:
            suggestions = self._get_mood_specific_suggestions(mood)
        if not activities:
            activities = self._get_mood_specific_activities(mood)
        if not affirmation:
            affirmation = self._get_mood_affirmation(mood)
        
        return {
            "suggestions": suggestions[:5],  # Limit to 5
            "insights": insight,
            "recommended_activities": activities[:3],  # Limit to 3
            "affirmation": affirmation,
            "sentiment_analysis": sentiment
        }
    
    def _rule_based_mood_suggestions(self, mood: str, note: str, sentiment: Dict, features: Dict, mood_history: List) -> Dict:
        """Rule-based mood suggestions with pattern detection"""
        suggestions = []
        activities = []
        insight_parts = []
        
        # Mood-specific suggestions
        mood_suggestions = self._get_mood_specific_suggestions(mood)
        suggestions.extend(mood_suggestions)
        
        # Mood-specific activities
        mood_activities = self._get_mood_specific_activities(mood)
        activities.extend(mood_activities)
        
        # Pattern detection
        if len(mood_history) >= 3:
            recent_moods = mood_history[-3:]
            if all(m == mood for m in recent_moods):
                if mood in ['anxious', 'sad', 'tired']:
                    insight_parts.append(f"You've been feeling {mood} for a few days. This is valid, and it's okay to slow down.")
                elif mood == 'happy':
                    insight_parts.append("You've been consistently positive! This is great momentum.")
        
        # Sentiment-based insights
        if sentiment['label'] == 'negative' and mood in ['anxious', 'sad', 'tired']:
            insight_parts.append("I notice your description has negative sentiment. Remember, difficult emotions are temporary and valid.")
        elif sentiment['label'] == 'positive' and mood == 'happy':
            insight_parts.append("Your positive energy shines through! Channel this into your tasks.")
        
        # Task-based suggestions
        pending_tasks = features.get('pending_tasks', 0)
        if pending_tasks > 5 and mood in ['anxious', 'tired']:
            suggestions.append(f"You have {pending_tasks} tasks. Break them into smaller pieces - start with just one.")
        elif pending_tasks == 0 and mood == 'happy':
            suggestions.append("Great job staying on top of tasks! Use this energy to tackle something new.")
        
        # Streak-based insights
        streak = features.get('current_streak', 0)
        if streak > 0:
            insight_parts.append(f"You're on a {streak}-day streak - that shows resilience!")
        
        # Build insight
        insight = " ".join(insight_parts) if insight_parts else f"Your {mood} mood is completely valid. Remember to be kind to yourself."
        
        return {
            "suggestions": suggestions[:5],
            "insights": insight,
            "recommended_activities": activities[:3],
            "affirmation": self._get_mood_affirmation(mood),
            "sentiment_analysis": sentiment
        }
    
    def _get_mood_specific_suggestions(self, mood: str) -> List[str]:
        """Get mood-specific suggestions"""
        suggestions_map = {
            'happy': [
                "Channel this positive energy into a productive task!",
                "Use this momentum to tackle something challenging.",
                "Share your good mood - help someone else feel better too.",
                "Take a moment to appreciate this feeling and what brought it."
            ],
            'calm': [
                "This is a great state for focused work - start a Pomodoro session.",
                "Use this peaceful energy to plan your day thoughtfully.",
                "Practice mindfulness - this calm state is valuable.",
                "Take on tasks that require steady, sustained attention."
            ],
            'neutral': [
                "Neutral is okay! Start with a small task to build momentum.",
                "Try a quick 5-minute activity to shift your energy.",
                "Break down one task into tiny steps - progress matters.",
                "Sometimes neutral is the perfect state for getting things done."
            ],
            'tired': [
                "Rest is productive! Take a 15-20 minute break if you can.",
                "Hydrate and have a healthy snack - low energy often means basic needs.",
                "Do just ONE small task, then rest. Progress over perfection.",
                "Consider a short walk or gentle stretching to re-energize."
            ],
            'anxious': [
                "Take 5 deep breaths - in through your nose, out through your mouth.",
                "Break tasks into tiny, manageable pieces. You don't need to do everything at once.",
                "Write down what's making you anxious - getting it out helps.",
                "Try a 5-minute grounding exercise: name 5 things you see, 4 you hear, 3 you feel."
            ],
            'sad': [
                "Your feelings are valid. Be gentle with yourself today.",
                "Do one small thing that usually brings you joy - even if it's tiny.",
                "Connect with someone you trust - you don't have to go through this alone.",
                "Remember: emotions are temporary. This feeling will pass."
            ]
        }
        return suggestions_map.get(mood, [
            "Take a moment to check in with yourself.",
            "Be kind to yourself today.",
            "Small steps forward are still progress."
        ])
    
    def _get_mood_specific_activities(self, mood: str) -> List[str]:
        """Get mood-specific activities"""
        activities_map = {
            'happy': [
                "Start a focus session on a challenging task",
                "Help a friend or colleague with something",
                "Plan and organize for tomorrow"
            ],
            'calm': [
                "Begin a 25-minute Pomodoro session",
                "Practice 5 minutes of meditation",
                "Work on a task that requires deep focus"
            ],
            'neutral': [
                "Complete one small task to build momentum",
                "Take a 5-minute walk to refresh",
                "Start a short Pomodoro session"
            ],
            'tired': [
                "Take a 15-20 minute rest break",
                "Do gentle stretching or yoga",
                "Have a healthy snack and hydrate"
            ],
            'anxious': [
                "Try a 5-minute breathing exercise",
                "Write in a journal about what's on your mind",
                "Do a quick 5-minute meditation"
            ],
            'sad': [
                "Listen to your favorite music",
                "Call or text someone you care about",
                "Do one small act of self-care"
            ]
        }
        return activities_map.get(mood, [
            "Take a moment to breathe",
            "Do something kind for yourself",
            "Check in with how you're feeling"
        ])
    
    def _get_mood_affirmation(self, mood: str) -> str:
        """Get mood-specific affirmation"""
        affirmations_map = {
            'happy': "Your positive energy is contagious! Keep spreading that good vibe. ✨",
            'calm': "This peaceful state is a gift - use it wisely. You're doing great. 🌊",
            'neutral': "Neutral is perfectly fine. Every day doesn't need to be extraordinary. You're enough. 💙",
            'tired': "Rest is not weakness - it's self-care. You're allowed to slow down. 😴",
            'anxious': "You're stronger than your anxiety. Take it one breath, one moment at a time. You've got this. 💪",
            'sad': "Your feelings are valid and temporary. Be gentle with yourself - this too shall pass. 💜"
        }
        return affirmations_map.get(mood, "You're doing your best, and that's enough. Be kind to yourself today. 💙")
    
    def _get_fallback_suggestions(self, mood: str, note: str) -> Dict:
        """Fallback suggestions when AI fails"""
        return {
            "suggestions": self._get_mood_specific_suggestions(mood)[:3],
            "insights": f"Your {mood} mood is valid. Remember to be kind to yourself.",
            "recommended_activities": self._get_mood_specific_activities(mood)[:2],
            "affirmation": self._get_mood_affirmation(mood),
            "sentiment_analysis": {
                "sentiment_score": 0.0,
                "label": "neutral"
            }
        }

