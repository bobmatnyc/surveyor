#!/bin/bash

# PM2 Development Start Script for Surveyor
# This script starts the surveyor application in development mode using PM2

set -e

echo "🚀 Starting Surveyor in Development Mode with PM2..."

# Navigate to project directory
cd /Users/masa/Projects/managed/surveyor

# Stop any existing surveyor processes
echo "📦 Stopping existing surveyor processes..."
pm2 stop surveyor-dev 2>/dev/null || true
pm2 delete surveyor-dev 2>/dev/null || true

# Clear PM2 logs
echo "🧹 Clearing PM2 logs..."
pm2 flush

# Ensure logs directory exists
mkdir -p logs

# Start the application in development mode
echo "🔧 Starting application in development mode..."
pm2 start ecosystem.config.js --only surveyor-dev

# Show status
echo "📊 Application Status:"
pm2 status

# Show logs
echo "📝 Recent logs:"
pm2 logs surveyor-dev --lines 10

echo "✅ Surveyor development server started!"
echo "🌐 Access the application at: http://localhost:3002"
echo "📊 Monitor with: pm2 monit"
echo "📝 View logs with: pm2 logs surveyor-dev"
echo "🛑 Stop with: pm2 stop surveyor-dev"