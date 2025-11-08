#!/bin/bash

# FocusWave ML Service Setup Script

echo "🚀 Setting up FocusWave ML Service..."

# Check Python version
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.11 or higher."
    exit 1
fi

python_version=$(python3 --version 2>&1 | awk '{print $2}')
echo "📦 Python version: $python_version"

# Create virtual environment
echo "📦 Creating virtual environment..."
python3 -m venv venv

# Activate virtual environment
echo "✅ Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📦 Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Create models directory
echo "📁 Creating models directory..."
mkdir -p models

# Create .env file if it doesn't exist
if [ ! -f config/.env ]; then
    echo "⚙️  Creating .env file..."
    cat > config/.env << EOF
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=focuswave
DB_USER=postgres
DB_PASSWORD=postgres

# ML Service Configuration
ML_SERVICE_PORT=8001
ML_SERVICE_HOST=0.0.0.0
MODEL_DIR=./models

# OpenAI API (for AI Coach)
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-3.5-turbo

# Hugging Face Model
HF_MODEL_NAME=distilbert-base-uncased-finetuned-sst-2-english

# Retraining Configuration
RETRAIN_INTERVAL_HOURS=24
MIN_SAMPLES_FOR_TRAINING=50

# Logging
LOG_LEVEL=INFO
EOF
    echo "✅ Created config/.env - Please update with your credentials!"
else
    echo "✅ config/.env already exists"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update config/.env with your database credentials"
echo "2. Train initial models: python3 training/train_pomodoro_model.py"
echo "3. Run the service: python3 run.py"
echo ""
echo "For more information, see README.md"

