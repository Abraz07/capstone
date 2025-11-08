#!/bin/bash

# Quick Start ML Service - Run this file

cd "$(dirname "$0")/ml_service"

echo "🚀 Starting FocusWave ML Service..."
echo ""

# Check if venv exists, if not create it
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate and install
source venv/bin/activate

# Install dependencies if needed
if [ ! -f "venv/.installed" ]; then
    echo "📦 Installing setuptools and wheel first..."
    pip install --upgrade setuptools wheel --quiet
    
    echo "📦 Installing dependencies..."
    pip install -r requirements.txt
    
    if [ $? -eq 0 ]; then
        touch venv/.installed
        echo "✅ Dependencies installed successfully"
    else
        echo "⚠️  Some dependencies may have failed, but continuing..."
    fi
fi

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

echo "✅ Setup complete!"
echo ""
echo "🚀 Starting ML Service on http://localhost:8001"
echo "📚 API docs: http://localhost:8001/docs"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Start the service
python3 run.py

