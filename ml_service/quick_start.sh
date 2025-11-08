#!/bin/bash

# Quick start script - Run this from ml_service directory

cd "$(dirname "$0")"

echo "🚀 Quick Start ML Service"
echo ""

# Check if venv exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    
    echo "📦 Installing dependencies (this may take a few minutes)..."
    pip install --upgrade pip setuptools wheel
    pip install fastapi uvicorn[standard] pydantic python-dotenv numpy pandas scikit-learn joblib psycopg2-binary sqlalchemy requests openai aiohttp python-multipart pydantic-settings schedule loguru
    
    # Try transformers/torch separately (optional, can fail)
    pip install transformers || echo "⚠️  transformers failed, will use fallback"
    pip install torch --index-url https://download.pytorch.org/whl/cpu || echo "⚠️  torch failed, sentiment analysis may not work"
else
    echo "✅ Virtual environment exists"
    source venv/bin/activate
fi

# Create config
if [ ! -f "config/.env" ]; then
    echo "⚙️  Creating config/.env..."
    mkdir -p config
    cat > config/.env << 'EOF'
DB_HOST=localhost
DB_PORT=5432
DB_NAME=focuswave
DB_USER=postgres
DB_PASSWORD=postgres
ML_SERVICE_PORT=8001
ML_SERVICE_HOST=0.0.0.0
MODEL_DIR=./models
OPENAI_API_KEY=
OPENAI_MODEL=gpt-3.5-turbo
HF_MODEL_NAME=distilbert-base-uncased-finetuned-sst-2-english
RETRAIN_INTERVAL_HOURS=24
MIN_SAMPLES_FOR_TRAINING=50
LOG_LEVEL=INFO
EOF
fi

mkdir -p models

echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 Starting ML Service on http://localhost:8001"
echo ""

python3 run.py

