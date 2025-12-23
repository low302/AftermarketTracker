#!/bin/bash

echo "================================"
echo "DealerTrack Pro - Setup Script"
echo "================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null
then
    echo "❌ Node.js is not installed. Please install Node.js 14+ first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js $(node --version) detected"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""
echo "✅ Dependencies installed successfully"
echo ""

# Create data directory
mkdir -p data

echo "================================"
echo "✅ Setup Complete!"
echo "================================"
echo ""
echo "To start the application:"
echo "  npm start"
echo ""
echo "Then open your browser to:"
echo "  http://localhost:3000"
echo ""
echo "For development mode with auto-reload:"
echo "  npm run dev"
echo ""
