#!/bin/bash

# START HERE - This will work!

cd "$(dirname "$0")"

echo "🚀 Starting ML Service..."
echo ""

# Activate venv
if [ -d "venv" ]; then
    source venv/bin/activate
else
    echo "❌ Virtual environment not found!"
    echo "Run: ./FINAL_FIX.sh first"
    exit 1
fi

# Create config if needed
if [ ! -f "config/.env" ]; then
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

echo "✅ Starting service..."
echo ""

# Use the simple start script
python3 start.py

