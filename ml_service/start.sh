#!/bin/bash

# Start ML Service Script

echo "🚀 Starting FocusWave ML Service..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found. Please run setup.sh first."
    exit 1
fi

# Activate virtual environment
source venv/bin/activate

# Check if .env exists
if [ ! -f "config/.env" ]; then
    echo "⚠️  config/.env not found. Creating from example..."
    cp config/.env.example config/.env
    echo "✅ Created config/.env - Please update with your credentials!"
fi

# Run the service
echo "✅ Starting ML service on port 8001..."
python3 run.py

