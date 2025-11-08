#!/bin/bash

# Setup Gemini API for ML Service

cd "$(dirname "$0")"

echo "🚀 Setting up Gemini API for AI Coach..."
echo ""

# Check if venv exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found!"
    echo "Please run setup first."
    exit 1
fi

# Activate venv
source venv/bin/activate

# Install Google Generative AI library
echo "📦 Installing google-generativeai..."
pip install google-generativeai>=0.3.0

# Update config/.env
ENV_FILE="config/.env"
GEMINI_KEY="AIzaSyDUfPQElmw-ourPMbsSmsZAMnvAGznWO6Q"

echo ""
echo "🔑 Updating $ENV_FILE with Gemini API key..."

# Ensure config directory exists
mkdir -p config

# Create or update .env file
if [ ! -f "$ENV_FILE" ]; then
    cat > "$ENV_FILE" << 'EOF'
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
    echo "✅ Created $ENV_FILE with Gemini configuration."
else
    # Update existing .env file
    if grep -q "GEMINI_API_KEY=" "$ENV_FILE"; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|^GEMINI_API_KEY=.*|GEMINI_API_KEY=$GEMINI_KEY|" "$ENV_FILE"
        else
            sed -i "s|^GEMINI_API_KEY=.*|GEMINI_API_KEY=$GEMINI_KEY|" "$ENV_FILE"
        fi
        echo "✅ Updated GEMINI_API_KEY in $ENV_FILE."
    else
        echo "GEMINI_API_KEY=$GEMINI_KEY" >> "$ENV_FILE"
        echo "✅ Added GEMINI_API_KEY to $ENV_FILE."
    fi
    
    # Update LLM_PROVIDER
    if grep -q "LLM_PROVIDER=" "$ENV_FILE"; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|^LLM_PROVIDER=.*|LLM_PROVIDER=gemini|" "$ENV_FILE"
        else
            sed -i "s|^LLM_PROVIDER=.*|LLM_PROVIDER=gemini|" "$ENV_FILE"
        fi
    else
        echo "LLM_PROVIDER=gemini" >> "$ENV_FILE"
    fi
    
    # Ensure GEMINI_MODEL is set
    if ! grep -q "GEMINI_MODEL=" "$ENV_FILE"; then
        echo "GEMINI_MODEL=gemini-pro" >> "$ENV_FILE"
    fi
    
    echo "✅ Updated $ENV_FILE with Gemini settings."
fi

# Set secure permissions
chmod 600 "$ENV_FILE"

echo ""
echo "🔍 Verifying setup..."
python3 -c "
import os
import sys
sys.path.append('.')
from dotenv import load_dotenv
load_dotenv('$ENV_FILE', override=True)
key = os.getenv('GEMINI_API_KEY')
provider = os.getenv('LLM_PROVIDER', 'auto')
model = os.getenv('GEMINI_MODEL', 'gemini-pro')
print(f'✅ Gemini Key: {key[:15]}...' if key and len(key) > 15 else '❌ Gemini Key not found')
print(f'✅ LLM Provider: {provider}')
print(f'✅ Gemini Model: {model}')
"

echo ""
echo "✅ Gemini API setup complete!"
echo ""
echo "📝 Next step: Restart the ML service"
echo "   ./RESTART.sh"
echo ""

