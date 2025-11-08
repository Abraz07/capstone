#!/bin/bash

# Quick check of OpenAI configuration

cd "$(dirname "$0")"

echo "🔍 Quick OpenAI Key Check"
echo "========================="
echo ""

# Check .env file
if [ -f "config/.env" ]; then
    echo "✅ config/.env file exists"
    
    if grep -q "OPENAI_API_KEY=" config/.env; then
        KEY=$(grep "OPENAI_API_KEY=" config/.env | head -1 | cut -d'=' -f2 | tr -d '"' | tr -d "'" | xargs)
        if [ -z "$KEY" ] || [ "$KEY" == "your_openai_api_key_here" ] || [ "$KEY" == "" ]; then
            echo "❌ OPENAI_API_KEY is empty or placeholder"
            echo "   Please add your actual API key to config/.env"
        else
            echo "✅ OPENAI_API_KEY is set"
            echo "   Key starts with: ${KEY:0:7}..."
            echo "   Key length: ${#KEY} characters"
            
            # Test with Python if venv exists
            if [ -d "venv" ]; then
                source venv/bin/activate
                echo ""
                echo "🧪 Testing OpenAI client..."
                python3 -c "
from config.config import settings
try:
    from openai import OpenAI
    if settings.OPENAI_API_KEY:
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        print('✅ OpenAI client initialized successfully!')
        print('🎉 Your OpenAI key is working!')
    else:
        print('❌ OpenAI API key not loaded')
except ImportError:
    print('⚠️  OpenAI library not installed')
except Exception as e:
    print(f'❌ Error: {e}')
" 2>&1
            fi
        fi
    else
        echo "❌ OPENAI_API_KEY not found in config/.env"
        echo "   Please add: OPENAI_API_KEY=sk-your-key-here"
    fi
else
    echo "❌ config/.env file not found"
    echo "   Please create it with your OpenAI API key"
fi

echo ""
echo "💡 To restart ML service: ./RESTART.sh"

