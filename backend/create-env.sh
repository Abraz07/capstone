#!/bin/bash

# Script to create .env file for backend

echo "🔧 Creating .env file for FocusWave backend"
echo "=========================================="
echo ""

BACKEND_DIR="/Users/abraz/Desktop/SEM-6/capstone /backend"
cd "$BACKEND_DIR" || exit 1

# Check if .env already exists
if [ -f .env ]; then
    echo "⚠️  .env file already exists!"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Cancelled. Exiting..."
        exit 0
    fi
fi

# Get database credentials from user
echo "Please provide your PostgreSQL connection details:"
echo ""

read -p "Database Host [localhost]: " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "Database Port [5432]: " DB_PORT
DB_PORT=${DB_PORT:-5432}

read -p "Database Name [focuswave]: " DB_NAME
DB_NAME=${DB_NAME:-focuswave}

read -p "Database User [postgres]: " DB_USER
DB_USER=${DB_USER:-postgres}

echo ""
echo "Database Password (leave empty if no password): "
read -s DB_PASSWORD

# Generate JWT secret
JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "your_super_secret_jwt_key_change_this_$(date +%s)")

# Create .env file
cat > .env << EOF
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD

# JWT Configuration
JWT_SECRET=$JWT_SECRET
JWT_EXPIRE=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
EOF

echo ""
echo "✅ .env file created successfully!"
echo ""
echo "📝 File location: $BACKEND_DIR/.env"
echo ""
echo "Next steps:"
echo "  1. Run: npm install"
echo "  2. Run: npm run migrate"
echo "  3. Run: npm run dev"
echo ""

