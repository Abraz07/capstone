import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from typing import Dict, Optional
from loguru import logger
from config.config import settings

# Try to import transformers (optional)
try:
    from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
    import torch
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    TRANSFORMERS_AVAILABLE = False
    logger.warning("Transformers library not available - will use fallback sentiment analysis")

class SentimentAnalyzer:
    def __init__(self):
        self.model = None
        self.tokenizer = None
        self.pipeline = None
        self.load_model()
    
    def load_model(self):
        """Load the sentiment analysis model"""
        if not TRANSFORMERS_AVAILABLE:
            logger.info("⚠️  Transformers not available, using fallback sentiment analysis")
            self.pipeline = None
            return
            
        try:
            
            model_path = settings.SENTIMENT_MODEL_PATH
            
            # Try to load from local path first
            if os.path.exists(model_path) and os.path.isdir(model_path):
                logger.info(f"Loading model from local path: {model_path}")
                self.tokenizer = AutoTokenizer.from_pretrained(model_path)
                self.model = AutoModelForSequenceClassification.from_pretrained(model_path)
            else:
                # Load from Hugging Face
                logger.info(f"Loading model from Hugging Face: {settings.HF_MODEL_NAME}")
                try:
                    self.tokenizer = AutoTokenizer.from_pretrained(settings.HF_MODEL_NAME)
                    self.model = AutoModelForSequenceClassification.from_pretrained(settings.HF_MODEL_NAME)
                except Exception as e:
                    logger.warning(f"⚠️  Could not load model from Hugging Face: {e}")
                    self.pipeline = None
                    return
            
            # Create pipeline
            self.pipeline = pipeline(
                "sentiment-analysis",
                model=self.model,
                tokenizer=self.tokenizer,
                device=0 if torch.cuda.is_available() else -1
            )
            
            logger.info("✅ Sentiment analyzer loaded successfully")
            
        except Exception as e:
            logger.error(f"❌ Error loading sentiment model: {e}")
            # Fallback to basic sentiment analysis
            self.pipeline = None
    
    def analyze(self, text: str) -> Dict:
        """
        Analyze sentiment of text
        
        Returns:
            {
                "sentiment_score": float (-1 to 1),
                "label": "negative" | "neutral" | "positive"
            }
        """
        if not text or not text.strip():
            return {
                "sentiment_score": 0.0,
                "label": "neutral"
            }
        
        try:
            if self.pipeline:
                # Use transformer model
                result = self.pipeline(text, truncation=True, max_length=512)[0]
                
                label = result['label'].lower()
                score = result['score']
                
                # Convert to our format
                if 'positive' in label:
                    sentiment_score = score
                    sentiment_label = "positive"
                elif 'negative' in label:
                    sentiment_score = -score
                    sentiment_label = "negative"
                else:
                    sentiment_score = 0.0
                    sentiment_label = "neutral"
                
            else:
                # Fallback: simple keyword-based sentiment
                sentiment_score, sentiment_label = self._simple_sentiment(text)
            
            return {
                "sentiment_score": round(sentiment_score, 3),
                "label": sentiment_label
            }
            
        except Exception as e:
            logger.error(f"Error in sentiment analysis: {e}")
            return {
                "sentiment_score": 0.0,
                "label": "neutral"
            }
    
    def _simple_sentiment(self, text: str) -> tuple:
        """Simple keyword-based sentiment analysis fallback"""
        text_lower = text.lower()
        
        positive_words = [
            'happy', 'great', 'good', 'excellent', 'amazing', 'wonderful',
            'fantastic', 'love', 'enjoy', 'excited', 'proud', 'accomplished',
            'grateful', 'blessed', 'calm', 'peaceful', 'relaxed', 'content'
        ]
        
        negative_words = [
            'sad', 'bad', 'terrible', 'awful', 'hate', 'angry', 'frustrated',
            'anxious', 'worried', 'stressed', 'tired', 'exhausted', 'overwhelmed',
            'depressed', 'lonely', 'disappointed', 'upset'
        ]
        
        positive_count = sum(1 for word in positive_words if word in text_lower)
        negative_count = sum(1 for word in negative_words if word in text_lower)
        
        if positive_count > negative_count:
            return 0.6, "positive"
        elif negative_count > positive_count:
            return -0.6, "negative"
        else:
            return 0.0, "neutral"

