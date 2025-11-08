#!/bin/bash

# Check OpenAI Key and Restart ML Service

cd "$(dirname "$0")"

echo "🔍 Checking OpenAI API Key Configuration..."
echo ""

# Check if .env file exists
if [ ! -f "config/.env" ]; then
    echo "❌ config/.env file not found!"
    echo "   Please create it first with your OpenAI API key"
    exit 1
fi

# Check if OPENAI_API_KEY is set
if grep -q "OPENAI_API_KEY=" config/.env; then
    KEY_LINE=$(grep "OPENAI_API_KEY=" config/.env | head -1)
    if [[ $KEY_LINE == *"your_openai_api_key_here"* ]] || [[ $KEY_LINE == *"OPENAI_API_KEY=$"* ]] || [[ $KEY_LINE == *"OPENAI_API_KEY=\"\""* ]]; then
        echo "⚠️  OPENAI_API_KEY found but appears to be empty or placeholder"
        echo "   Please add your actual API key to config/.env"
        exit 1
    else
        echo "✅ OpenAI API Key found in config/.env"
        # Don't print the actual key for security
        KEY_PREFIX=$(echo "$KEY_LINE" | cut -d'=' -f2 | cut -c1-7)
        echo "   Key starts with: $KEY_PREFIX..."
    fi
else
    echo "❌ OPENAI_API_KEY not found in config/.env"
    exit 1
fi

echo ""
echo "🧪 Testing OpenAI key with Python..."
echo ""

# Activate venv and test
if [ -d "venv" ]; then
    source venv/bin/activate
    python3 test_openai.py
    TEST_RESULT=$?
    echo ""
    
    if [ $TEST_RESULT -eq 0 ]; then
        echo "✅ OpenAI key is configured correctly!"
        echo ""
        echo "🔄 Restarting ML Service..."
        echo ""
        
        # Kill existing service
        lsof -ti:8001 | xargs kill -9 2>/dev/null
        sleep 2
        
        # Start service
        python3 start.py
    else
        echo "❌ OpenAI key test failed. Please check your configuration."
        exit 1
    fi
else
    echo "❌ Virtual environment not found!"
    echo "   Please run: ./FINAL_FIX.sh first"
    exit 1
fi

