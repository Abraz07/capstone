#!/bin/bash

# Simple script to run ML service from capstone directory

echo "🚀 Starting ML Service..."
echo ""

# Navigate to ml_service directory
cd ml_service

# Activate existing venv
source venv/bin/activate

# Install dependencies (setuptools/wheel already installed)
echo "📦 Installing dependencies..."
pip install -r requirements.txt

# Create config if needed
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

# Create models directory
mkdir -p models

echo ""
echo "✅ Ready!"
echo "🚀 Starting ML Service on http://localhost:8001"
echo ""

# Start the service
python3 run.py

