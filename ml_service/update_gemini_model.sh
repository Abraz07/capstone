#!/bin/bash

# Update Gemini model name in config

cd "$(dirname "$0")"

ENV_FILE="config/.env"

echo "🔄 Updating Gemini model name..."

if [ -f "$ENV_FILE" ]; then
    # Update model name to gemini-1.5-flash
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|^GEMINI_MODEL=.*|GEMINI_MODEL=gemini-1.5-flash|" "$ENV_FILE"
    else
        sed -i "s|^GEMINI_MODEL=.*|GEMINI_MODEL=gemini-1.5-flash|" "$ENV_FILE"
    fi
    echo "✅ Updated GEMINI_MODEL to gemini-1.5-flash"
else
    echo "❌ config/.env not found"
    exit 1
fi

echo ""
echo "✅ Model updated! Please restart the ML service:"
echo "   ./RESTART.sh"

