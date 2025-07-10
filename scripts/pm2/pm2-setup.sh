#!/bin/bash

# PM2 Setup Script for Surveyor
# This script sets up PM2 for the surveyor application

set -e

echo "🚀 Setting up PM2 for Surveyor..."

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 is not installed. Installing PM2 globally..."
    npm install -g pm2
else
    echo "✅ PM2 is already installed"
fi

# Navigate to project directory
cd /Users/masa/Projects/managed/surveyor

# Make sure all scripts are executable
echo "🔧 Setting script permissions..."
chmod +x pm2-scripts/*.sh

# Create logs directory
echo "📁 Creating logs directory..."
mkdir -p logs

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build the application
echo "🔨 Building application..."
npm run build

# Test the ecosystem configuration
echo "🧪 Testing PM2 ecosystem configuration..."
pm2 ecosystem ecosystem.config.js

echo "✅ PM2 setup complete!"
echo ""
echo "🎉 Quick Start Commands:"
echo "  Start development server: ./pm2-scripts/start-dev.sh"
echo "  Start production server:  ./pm2-scripts/start-prod.sh"
echo "  Monitor application:      ./pm2-scripts/monitor.sh"
echo "  View logs:                ./pm2-scripts/logs.sh"
echo ""
echo "🌐 Application will be available at: http://localhost:3002"