#!/bin/bash

# FocusWave ML Service Startup Script

cd "$(dirname "$0")"

echo "🚀 Setting up and starting FocusWave ML Service..."

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.11 or higher."
    exit 1
fi

echo "✅ Python 3 found: $(python3 --version)"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "✅ Activating virtual environment..."
source venv/bin/activate

# Install/upgrade pip
echo "📦 Upgrading pip..."
pip install --upgrade pip --quiet

# Install dependencies
echo "📦 Installing dependencies..."
pip install -r requirements.txt --quiet

# Create models directory
mkdir -p models

# Create .env if it doesn't exist
if [ ! -f "config/.env" ]; then
    echo "⚙️  Creating config/.env..."
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
    echo "✅ Created config/.env - Update with your database credentials if needed"
fi

# Train models (will use fallback if training fails)
echo "🧠 Training models (this may take a moment)..."
python3 training/train_pomodoro_model.py 2>&1 | grep -E "(✅|❌|Error|Training)" || echo "Using fallback model"
python3 training/train_distraction_model.py 2>&1 | grep -E "(✅|❌|Error|Training)" || echo "Using fallback model"

# Start the service
echo ""
echo "🚀 Starting ML Service on http://localhost:8001"
echo "📚 API docs available at http://localhost:8001/docs"
echo ""
echo "Press Ctrl+C to stop the service"
echo ""

python3 run.py

