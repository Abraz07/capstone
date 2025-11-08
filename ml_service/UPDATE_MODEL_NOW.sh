#!/bin/bash

# Quick script to update Gemini model name

cd "$(dirname "$0")"

ENV_FILE="config/.env"

if [ ! -f "$ENV_FILE" ]; then
    echo "❌ config/.env not found"
    exit 1
fi

echo "🔄 Updating GEMINI_MODEL to gemini-1.5-flash..."

if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|^GEMINI_MODEL=.*|GEMINI_MODEL=gemini-1.5-flash|" "$ENV_FILE"
else
    # Linux
    sed -i "s|^GEMINI_MODEL=.*|GEMINI_MODEL=gemini-1.5-flash|" "$ENV_FILE"
fi

echo "✅ Updated!"
echo ""
echo "Current GEMINI_MODEL setting:"
grep "GEMINI_MODEL=" "$ENV_FILE"
echo ""
echo "Now restart the service: ./RESTART.sh"

