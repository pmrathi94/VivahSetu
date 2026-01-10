#!/bin/bash

# VivahSetu Development Quick Start
# This script helps set up and run the complete application

set -e

echo "🎉 VivahSetu 2026 - Wedding Planning Platform"
echo "=============================================="
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

echo "✓ Node.js version: $(node --version)"
echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✓ Dependencies installed"
    echo ""
fi

# Check for environment file
if [ ! -f ".env" ]; then
    echo "⚠️  Missing .env file"
    echo "Please create .env with:"
    echo "  SUPABASE_URL=your-url"
    echo "  SUPABASE_ANON_KEY=your-key"
    echo "  SUPABASE_SERVICE_KEY=your-service-key"
    echo ""
    echo "Continue? (y/n)"
    read -r response
    if [ "$response" != "y" ]; then
        exit 0
    fi
fi

if [ ! -f "frontend/.env.local" ]; then
    echo "⚠️  Missing frontend/.env.local"
    echo "Please create frontend/.env.local with:"
    echo "  VITE_API_URL=http://localhost:3001/api/v1"
    echo "  VITE_SUPABASE_URL=your-url"
    echo "  VITE_SUPABASE_KEY=your-key"
    echo ""
fi

# Build check
echo "🔨 Building application..."
npm run build

if [ $? -eq 0 ]; then
    echo "✓ Build successful!"
    echo ""
    echo "🚀 To start development servers, run:"
    echo "   npm run dev -w backend    # Terminal 1"
    echo "   npm run dev -w frontend   # Terminal 2"
    echo ""
    echo "📱 Frontend: http://localhost:5173"
    echo "🔌 Backend:  http://localhost:3001"
    echo ""
else
    echo "❌ Build failed. Check errors above."
    exit 1
fi
