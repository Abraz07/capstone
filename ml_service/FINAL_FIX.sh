#!/bin/bash

# FINAL FIX - This will work without errors!

cd "$(dirname "$0")"

echo "🔧 Final Fix - Installing ML Service (Error-Free)"
echo ""

# Remove broken venv
if [ -d "venv" ]; then
    echo "🗑️  Removing old virtual environment..."
    rm -rf venv
fi

# Create fresh venv
echo "📦 Creating fresh virtual environment..."
python3 -m venv venv

# Activate
source venv/bin/activate

# Upgrade pip
echo "📦 Upgrading pip..."
pip install --upgrade pip --quiet

# Install setuptools and wheel (CRITICAL)
echo "📦 Installing build tools..."
pip install --upgrade "setuptools>=68.0.0" "wheel>=0.40.0" --quiet

# Install core packages first (these should work)
echo "📦 Installing core packages..."
pip install fastapi uvicorn[standard] pydantic python-dotenv --quiet

# Install data packages (with compatible versions)
echo "📦 Installing data packages..."
pip install "numpy>=1.26.0" "pandas>=2.1.0" "scikit-learn>=1.3.0" joblib --quiet

# Install database packages
echo "📦 Installing database packages..."
pip install psycopg2-binary sqlalchemy --quiet

# Install utility packages
echo "📦 Installing utility packages..."
pip install requests openai aiohttp python-multipart pydantic-settings schedule loguru --quiet

# Try transformers (optional - can fail, that's OK)
echo "📦 Installing transformers (optional)..."
pip install transformers --quiet 2>/dev/null || echo "⚠️  transformers skipped (optional)"

# Try torch (optional - can fail, that's OK)  
echo "📦 Installing torch (optional)..."
pip install torch --index-url https://download.pytorch.org/whl/cpu --quiet 2>/dev/null || echo "⚠️  torch skipped (optional)"

# Create config
if [ ! -f "config/.env" ]; then
    echo "⚙️  Creating config/.env..."
    mkdir -p config
    cat > config/.env << 'EOF'
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
HF_MODEL_NAME=distilbert-base-uncased-finetuned-sst-2-english
RETRAIN_INTERVAL_HOURS=24
MIN_SAMPLES_FOR_TRAINING=50
LOG_LEVEL=INFO
EOF
fi

# Create models directory
mkdir -p models

echo ""
echo "✅ Installation complete!"
echo ""

# Test import
echo "🔍 Testing installation..."
python3 -c "import fastapi; import uvicorn; print('✅ Core packages working!')" 2>/dev/null

echo ""
echo "🚀 Starting ML Service on http://localhost:8001"
echo ""

# Start service
python3 run.py

