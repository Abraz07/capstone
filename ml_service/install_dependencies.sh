#!/bin/bash

# Install dependencies with Python 3.13 compatibility

cd "$(dirname "$0")"

echo "🔧 Installing ML Service dependencies for Python 3.13..."
echo ""

# Remove old venv
if [ -d "venv" ]; then
    echo "🗑️  Removing old virtual environment..."
    rm -rf venv
fi

# Create fresh venv
echo "📦 Creating fresh virtual environment..."
python3 -m venv venv

# Activate
source venv/bin/activate

# Upgrade pip first
echo "📦 Upgrading pip..."
pip install --upgrade pip

# Install setuptools and wheel first (critical for Python 3.13)
echo "📦 Installing build tools..."
pip install --upgrade "setuptools>=68.0.0" wheel

# Install packages one by one to avoid issues
echo "📦 Installing core packages..."
pip install fastapi uvicorn[standard] pydantic python-dotenv

echo "📦 Installing data science packages..."
pip install numpy pandas scikit-learn joblib

echo "📦 Installing ML packages..."
pip install transformers torch --index-url https://download.pytorch.org/whl/cpu

echo "📦 Installing database packages..."
pip install psycopg2-binary sqlalchemy

echo "📦 Installing utility packages..."
pip install requests openai aiohttp python-multipart pydantic-settings schedule loguru

echo ""
echo "✅ All dependencies installed!"
echo ""

# Verify installation
echo "🔍 Verifying installation..."
python3 -c "import fastapi; import uvicorn; import transformers; print('✅ Core packages working!')" 2>/dev/null && echo "✅ Installation successful!" || echo "⚠️  Some packages may have issues"

echo ""
echo "🚀 Ready to start! Run: python3 run.py"

