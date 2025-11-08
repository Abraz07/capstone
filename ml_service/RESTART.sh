#!/bin/bash

# Restart ML Service Script

cd "$(dirname "$0")"

echo "🔄 Restarting ML Service..."
echo ""

# Kill any existing ML service process
echo "🛑 Stopping existing service..."
lsof -ti:8001 | xargs kill -9 2>/dev/null
pkill -f "python.*start.py" 2>/dev/null
pkill -f "python.*run.py" 2>/dev/null
pkill -f "uvicorn.*ml" 2>/dev/null
sleep 2

# Check if venv exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found!"
    echo "Please run: ./FINAL_FIX.sh first"
    exit 1
fi

# Activate venv
source venv/bin/activate

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
GEMINI_API_KEY=${GEMINI_API_KEY:-your_gemini_api_key_here}
GEMINI_MODEL=gemini-1.5-flash
LLM_PROVIDER=gemini
HF_MODEL_NAME=distilbert-base-uncased-finetuned-sst-2-english
RETRAIN_INTERVAL_HOURS=24
MIN_SAMPLES_FOR_TRAINING=50
LOG_LEVEL=INFO
EOF
fi

mkdir -p models

# Start service
echo "🚀 Starting ML Service on http://localhost:8001"
echo ""

python3 start.py

