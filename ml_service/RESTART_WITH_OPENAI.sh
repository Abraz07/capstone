#!/bin/bash

# Restart ML Service with OpenAI Key

cd "$(dirname "$0")"

echo "🔄 Restarting ML Service with OpenAI..."
echo ""

# Kill existing service
echo "🛑 Stopping existing service..."
lsof -ti:8001 | xargs kill -9 2>/dev/null
pkill -f "python.*start.py" 2>/dev/null
pkill -f "python.*run.py" 2>/dev/null
sleep 2

# Check venv
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found!"
    exit 1
fi

# Activate venv
source venv/bin/activate

# Verify OpenAI key is set
if [ -f "config/.env" ]; then
    if grep -q "OPENAI_API_KEY=sk-" config/.env; then
        echo "✅ OpenAI API Key found in config/.env"
    else
        echo "⚠️  OpenAI API Key not found or invalid"
    fi
else
    echo "⚠️  config/.env file not found"
fi

echo ""
echo "🚀 Starting ML Service on http://localhost:8001"
echo "📚 API docs: http://localhost:8001/docs"
echo ""
echo "💡 Watch for: '✅ OpenAI client initialized successfully'"
echo ""

# Start service
python3 start.py

