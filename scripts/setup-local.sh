#!/bin/bash

# SmartProof AI - Local Development Setup Script
# Usage: ./setup-local.sh

set -e

echo "================================================="
echo "SmartProof AI - Local Development Setup"
echo "================================================="

# Check prerequisites
echo "Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "Error: Node.js version must be 18 or higher. Current version: $(node -v)"
    exit 1
fi

echo "✓ Node.js $(node -v) detected"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed"
    exit 1
fi

echo "✓ npm $(npm -v) detected"

# Check Azure CLI (optional but recommended)
if command -v az &> /dev/null; then
    echo "✓ Azure CLI $(az version --query \"'azure-cli'\" -o tsv) detected"
else
    echo "⚠ Azure CLI not found (optional - needed for deployment)"
fi

# Check Azure Functions Core Tools (optional)
if command -v func &> /dev/null; then
    echo "✓ Azure Functions Core Tools detected"
else
    echo "⚠ Azure Functions Core Tools not found (optional - needed for local backend testing)"
fi

echo ""
echo "Setting up project..."

# Setup Frontend
echo ""
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
echo "✓ Frontend dependencies installed"

# Create frontend .env if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating frontend .env file..."
    cp .env.example .env
    echo "✓ Created frontend/.env - Please configure with your Azure AD credentials"
else
    echo "✓ Frontend .env file already exists"
fi

cd ..

# Setup Backend
echo ""
echo "📦 Installing backend dependencies..."
cd backend
npm install
echo "✓ Backend dependencies installed"

# Create backend local.settings.json if it doesn't exist
if [ ! -f local.settings.json ]; then
    echo "Creating backend local.settings.json file..."
    cp local.settings.json.example local.settings.json
    echo "✓ Created backend/local.settings.json - Please configure with your Azure resource endpoints"
else
    echo "✓ Backend local.settings.json file already exists"
fi

cd ..

echo ""
echo "================================================="
echo "Setup Complete! ✨"
echo "================================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Configure environment variables:"
echo "   - frontend/.env (Azure AD credentials)"
echo "   - backend/local.settings.json (Azure resource endpoints)"
echo ""
echo "2. Start the development servers:"
echo "   Terminal 1: cd frontend && npm run dev"
echo "   Terminal 2: cd backend && npm start"
echo ""
echo "3. Access the application:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:7071"
echo ""
echo "================================================="
echo ""
echo "For more information, see:"
echo "- README.md"
echo "- QUICKSTART.md"
echo "- docs/IMPLEMENTATION_STATUS.md"
echo ""
