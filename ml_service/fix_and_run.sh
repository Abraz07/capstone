#!/bin/bash

# Fix and Run ML Service

cd "$(dirname "$0")"

echo "🔧 Fixing ML Service setup..."

# Remove old venv if it exists and has issues
if [ -d "venv" ]; then
    echo "🗑️  Removing old virtual environment..."
    rm -rf venv
fi

# Create fresh virtual environment
echo "📦 Creating fresh virtual environment..."
python3 -m venv venv

# Activate
source venv/bin/activate

# Upgrade pip and install build tools first
echo "📦 Installing build tools..."
pip install --upgrade pip setuptools wheel

# Install dependencies
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
echo "✅ Setup complete!"
echo ""
echo "🚀 Starting ML Service on http://localhost:8001"
echo "📚 API docs: http://localhost:8001/docs"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Start the service
python3 run.py

