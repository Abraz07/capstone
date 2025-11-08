#!/bin/bash

# Add OpenAI API Key to config/.env

cd "$(dirname "$0")"

# Replace with your actual OpenAI API key
OPENAI_KEY="${OPENAI_API_KEY:-your_openai_api_key_here}"

echo "🔐 Adding OpenAI API Key to config/.env..."
echo ""

# Create config directory if it doesn't exist
mkdir -p config

# Create .env file if it doesn't exist
if [ ! -f "config/.env" ]; then
    echo "📝 Creating config/.env file..."
    cat > config/.env << 'EOF'
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=focuswave
DB_USER=postgres
DB_PASSWORD=postgres

# ML Service Configuration
ML_SERVICE_PORT=8001
ML_SERVICE_HOST=0.0.0.0

# Model Paths
MODEL_DIR=./models

# OpenAI API (for AI Coach)
OPENAI_API_KEY=
OPENAI_MODEL=gpt-3.5-turbo

# Hugging Face Model
HF_MODEL_NAME=distilbert-base-uncased-finetuned-sst-2-english

# Retraining Configuration
RETRAIN_INTERVAL_HOURS=24
MIN_SAMPLES_FOR_TRAINING=50

# Logging
LOG_LEVEL=INFO
EOF
fi

# Update or add OPENAI_API_KEY
if grep -q "OPENAI_API_KEY=" config/.env; then
    # Update existing key
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s|OPENAI_API_KEY=.*|OPENAI_API_KEY=$OPENAI_KEY|" config/.env
    else
        # Linux
        sed -i "s|OPENAI_API_KEY=.*|OPENAI_API_KEY=$OPENAI_KEY|" config/.env
    fi
    echo "✅ Updated OPENAI_API_KEY in config/.env"
else
    # Add new key
    echo "OPENAI_API_KEY=$OPENAI_KEY" >> config/.env
    echo "✅ Added OPENAI_API_KEY to config/.env"
fi

# Set secure permissions
chmod 600 config/.env

echo ""
echo "✅ OpenAI API Key added successfully!"
echo ""
echo "🔍 Verifying..."

# Test the key
if [ -d "venv" ]; then
    source venv/bin/activate
    python3 test_key_now.py
else
    echo "⚠️  Virtual environment not found. Run: ./FINAL_FIX.sh"
fi

echo ""
echo "💡 Now restart the ML service: ./RESTART.sh"

