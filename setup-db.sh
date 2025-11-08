#!/bin/bash

# FocusWave Database Setup Script
# This script helps you set up the PostgreSQL database

echo "🚀 FocusWave Database Setup"
echo "=========================="
echo ""

# Check if PostgreSQL is installed
echo "📦 Checking PostgreSQL installation..."
if command -v psql &> /dev/null; then
    PSQL_VERSION=$(psql --version)
    echo "✅ PostgreSQL is installed: $PSQL_VERSION"
else
    echo "❌ PostgreSQL is not installed"
    echo ""
    echo "To install PostgreSQL:"
    echo "  brew install postgresql@14"
    echo "  brew services start postgresql@14"
    echo ""
    exit 1
fi

# Check if PostgreSQL is running
echo ""
echo "🔍 Checking if PostgreSQL is running..."
if pg_isready &> /dev/null; then
    echo "✅ PostgreSQL is running"
else
    echo "❌ PostgreSQL is not running"
    echo ""
    echo "To start PostgreSQL:"
    echo "  brew services start postgresql@14"
    echo ""
    exit 1
fi

# Navigate to backend directory
BACKEND_DIR="/Users/abraz/Desktop/SEM-6/capstone /backend"
cd "$BACKEND_DIR" || exit 1

# Check if .env exists
echo ""
echo "📝 Checking .env file..."
if [ -f .env ]; then
    echo "✅ .env file exists"
else
    echo "❌ .env file not found"
    echo "Creating .env file..."
    
    cat > .env << 'EOF'
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=focuswave
DB_USER=postgres
DB_PASSWORD=

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_12345
JWT_EXPIRE=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
EOF
    
    echo "✅ .env file created"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env file and set DB_PASSWORD with your PostgreSQL password"
    echo "   File location: $BACKEND_DIR/.env"
    echo ""
    read -p "Press Enter after you've set the password in .env file..."
fi

# Check if database exists
echo ""
echo "🗄️  Checking if database 'focuswave' exists..."
DB_EXISTS=$(psql -U postgres -lqt | cut -d \| -f 1 | grep -w focuswave | wc -l)

if [ "$DB_EXISTS" -eq 1 ]; then
    echo "✅ Database 'focuswave' exists"
else
    echo "❌ Database 'focuswave' does not exist"
    echo ""
    echo "Creating database..."
    
    # Try to create database
    if psql -U postgres -c "CREATE DATABASE focuswave;" 2>/dev/null; then
        echo "✅ Database 'focuswave' created successfully"
    else
        echo "❌ Failed to create database"
        echo ""
        echo "Please create the database manually:"
        echo "  1. Open pgAdmin"
        echo "  2. Connect to PostgreSQL server"
        echo "  3. Right-click 'Databases' → 'Create' → 'Database'"
        echo "  4. Name: focuswave"
        echo "  5. Click 'Save'"
        echo ""
        read -p "Press Enter after you've created the database..."
    fi
fi

# Install dependencies
echo ""
echo "📦 Installing backend dependencies..."
if [ -d node_modules ]; then
    echo "✅ Dependencies already installed"
else
    npm install
    if [ $? -eq 0 ]; then
        echo "✅ Dependencies installed"
    else
        echo "❌ Failed to install dependencies"
        exit 1
    fi
fi

# Run migrations
echo ""
echo "🔄 Running database migrations..."
npm run migrate

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Database setup completed successfully!"
    echo ""
    echo "Next steps:"
    echo "  1. Start the backend server: npm run dev"
    echo "  2. Start the frontend: cd .. && npm run dev"
    echo "  3. Open http://localhost:3000 in your browser"
else
    echo ""
    echo "❌ Migration failed"
    echo "Please check:"
    echo "  1. Database exists and is accessible"
    echo "  2. .env file has correct credentials"
    echo "  3. PostgreSQL is running"
fi

