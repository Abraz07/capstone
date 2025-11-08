import os
from pathlib import Path
from pydantic_settings import BaseSettings
from typing import Optional

# Find .env file - check config/ and root
base_dir = Path(__file__).parent.parent
env_file_config = base_dir / "config" / ".env"
env_file_root = base_dir / ".env"

# Load .env file if it exists - do this BEFORE creating Settings
try:
    from dotenv import load_dotenv
    # Try config/.env first, then root .env
    if env_file_config.exists():
        load_dotenv(env_file_config, override=True)
        print(f"📁 Loaded .env from: {env_file_config}")
    elif env_file_root.exists():
        load_dotenv(env_file_root, override=True)
        print(f"📁 Loaded .env from: {env_file_root}")
except ImportError:
    print("⚠️  python-dotenv not installed, using environment variables only")

class Settings(BaseSettings):
    # Database
    DB_HOST: str = os.getenv("DB_HOST", "localhost")
    DB_PORT: int = int(os.getenv("DB_PORT", "5432"))
    DB_NAME: str = os.getenv("DB_NAME", "focuswave")
    DB_USER: str = os.getenv("DB_USER", "postgres")
    DB_PASSWORD: Optional[str] = os.getenv("DB_PASSWORD") or "postgres"  # Default to "postgres" if not set
    
    # ML Service
    ML_SERVICE_PORT: int = int(os.getenv("ML_SERVICE_PORT", "8001"))
    ML_SERVICE_HOST: str = os.getenv("ML_SERVICE_HOST", "0.0.0.0")
    
    # Model Paths
    MODEL_DIR: str = os.getenv("MODEL_DIR", "./models")
    POMODORO_MODEL_PATH: str = os.path.join(MODEL_DIR, "pomodoro_recommender.joblib")
    DISTRACTION_MODEL_PATH: str = os.path.join(MODEL_DIR, "distraction_predictor.joblib")
    SENTIMENT_MODEL_PATH: str = os.path.join(MODEL_DIR, "sentiment_analyzer")
    
    # OpenAI API (for AI Coach) - read from environment after .env is loaded
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY") or None
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-3.5-turbo")
    
    # Gemini API (for AI Coach) - alternative to OpenAI
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY") or None
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")  # Updated to current model name
    
    # LLM Provider preference (openai, gemini, or auto - uses Gemini if available, else OpenAI)
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "auto")
    
    # Hugging Face
    HF_MODEL_NAME: str = os.getenv("HF_MODEL_NAME", "distilbert-base-uncased-finetuned-sst-2-english")
    
    # Retraining
    RETRAIN_INTERVAL_HOURS: int = int(os.getenv("RETRAIN_INTERVAL_HOURS", "24"))
    MIN_SAMPLES_FOR_TRAINING: int = int(os.getenv("MIN_SAMPLES_FOR_TRAINING", "50"))
    
    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()

