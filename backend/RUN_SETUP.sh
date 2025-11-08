#!/bin/bash

# FocusWave Database Setup Script
# Run this script to set up everything

set -e  # Exit on error

echo "🚀 Starting FocusWave Backend Setup"
echo "===================================="
echo ""

# Navigate to backend directory
cd "$(dirname "$0")"
BACKEND_DIR=$(pwd)
echo "📁 Backend directory: $BACKEND_DIR"
echo ""

# Step 1: Create .env file
echo "📝 Step 1: Creating .env file..."
if [ -f .env ]; then
    echo "⚠️  .env file already exists. Backing up to .env.backup"
    cp .env .env.backup
fi

cat > .env << 'ENVEOF'
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=focuswave
DB_USER=postgres
DB_PASSWORD=
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_12345
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:3000
ENVEOF

echo "✅ .env file created"
echo ""
echo "⚠️  IMPORTANT: If you have a PostgreSQL password, edit .env and add it to DB_PASSWORD"
echo "   File location: $BACKEND_DIR/.env"
echo ""

# Step 2: Install dependencies
echo "📦 Step 2: Installing dependencies..."
if [ ! -d node_modules ]; then
    npm install
    echo "✅ Dependencies installed"
else
    echo "✅ Dependencies already installed"
fi
echo ""

# Step 3: Run migrations
echo "🔄 Step 3: Running database migrations..."
npm run migrate

if [ $? -eq 0 ]; then
    echo "✅ Migrations completed successfully!"
else
    echo "❌ Migration failed!"
    echo ""
    echo "Please check:"
    echo "  1. PostgreSQL is running"
    echo "  2. Database 'focuswave' exists"
    echo "  3. .env file has correct credentials"
    exit 1
fi

echo ""
echo "🎉 Setup Complete!"
echo ""
echo "Next steps:"
echo "  1. Start the backend server: npm run dev"
echo "  2. In another terminal, start the frontend: cd .. && npm run dev"
echo "  3. Open http://localhost:3000 in your browser"
echo ""

