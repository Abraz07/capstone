#!/bin/bash

# Script to add Gemini API Key to ml_service/config/.env

cd "$(dirname "$0")"

GEMINI_KEY="AIzaSyDUfPQElmw-ourPMbsSmsZAMnvAGznWO6Q"
ENV_FILE="config/.env"

echo "🔑 Adding Gemini API Key to $ENV_FILE..."

# Ensure config directory exists
mkdir -p config

# Check if .env file exists, if not, create it with default content
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
GEMINI_API_KEY=
GEMINI_MODEL=gemini-pro
LLM_PROVIDER=gemini
HF_MODEL_NAME=distilbert-base-uncased-finetuned-sst-2-english
RETRAIN_INTERVAL_HOURS=24
MIN_SAMPLES_FOR_TRAINING=50
LOG_LEVEL=INFO
EOF
    echo "Created default $ENV_FILE."
fi

# Update or add the GEMINI_API_KEY
if grep -q "GEMINI_API_KEY=" "$ENV_FILE"; then
    # Update existing key
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s|^GEMINI_API_KEY=.*|GEMINI_API_KEY=$GEMINI_KEY|" "$ENV_FILE"
    else
        # Linux
        sed -i "s|^GEMINI_API_KEY=.*|GEMINI_API_KEY=$GEMINI_KEY|" "$ENV_FILE"
    fi
    echo "✅ Updated GEMINI_API_KEY in $ENV_FILE."
else
    # Add new key
    echo "GEMINI_API_KEY=$GEMINI_KEY" >> "$ENV_FILE"
    echo "✅ Added GEMINI_API_KEY to $ENV_FILE."
fi

# Update or add LLM_PROVIDER to use Gemini
if grep -q "LLM_PROVIDER=" "$ENV_FILE"; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|^LLM_PROVIDER=.*|LLM_PROVIDER=gemini|" "$ENV_FILE"
    else
        sed -i "s|^LLM_PROVIDER=.*|LLM_PROVIDER=gemini|" "$ENV_FILE"
    fi
    echo "✅ Updated LLM_PROVIDER to 'gemini'."
else
    echo "LLM_PROVIDER=gemini" >> "$ENV_FILE"
    echo "✅ Added LLM_PROVIDER='gemini'."
fi

# Ensure GEMINI_MODEL is set
if ! grep -q "GEMINI_MODEL=" "$ENV_FILE"; then
    echo "GEMINI_MODEL=gemini-pro" >> "$ENV_FILE"
    echo "✅ Added GEMINI_MODEL='gemini-pro'."
fi

# Set secure permissions
chmod 600 "$ENV_FILE"
echo "✅ Set secure permissions for $ENV_FILE."

echo ""
echo "🔍 Verifying configuration..."
if [ -d "venv" ]; then
    source venv/bin/activate
    python3 -c "
import os
from dotenv import load_dotenv
load_dotenv('$ENV_FILE', override=True)
key = os.getenv('GEMINI_API_KEY')
provider = os.getenv('LLM_PROVIDER', 'auto')
print(f'✅ Gemini Key loaded: {key[:10]}...' if key else '❌ Gemini Key not found')
print(f'✅ LLM Provider: {provider}')
"
    deactivate
else
    echo "⚠️  Virtual environment not found. Please install dependencies first."
fi

echo ""
echo "✅ Gemini API Key configured successfully!"
echo ""
echo "📝 Next steps:"
echo "1. Install Google Generative AI library:"
echo "   cd ml_service && source venv/bin/activate && pip install google-generativeai"
echo ""
echo "2. Restart the ML service:"
echo "   ./RESTART.sh"
echo ""

