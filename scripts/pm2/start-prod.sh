#!/bin/bash

# PM2 Production Start Script for Surveyor
# This script builds and starts the surveyor application in production mode using PM2

set -e

echo "🚀 Starting Surveyor in Production Mode with PM2..."

# Navigate to project directory
cd /Users/masa/Projects/managed/surveyor

# Stop any existing surveyor processes
echo "📦 Stopping existing surveyor processes..."
pm2 stop surveyor-prod 2>/dev/null || true
pm2 delete surveyor-prod 2>/dev/null || true

# Clear PM2 logs
echo "🧹 Clearing PM2 logs..."
pm2 flush

# Ensure logs directory exists
mkdir -p logs

# Build the application
echo "🔨 Building application for production..."
npm run build

# Start the application in production mode
echo "🚀 Starting application in production mode..."
pm2 start ecosystem.config.js --only surveyor-prod

# Show status
echo "📊 Application Status:"
pm2 status

# Show logs
echo "📝 Recent logs:"
pm2 logs surveyor-prod --lines 10

echo "✅ Surveyor production server started!"
echo "🌐 Access the application at: http://localhost:3002"
echo "📊 Monitor with: pm2 monit"
echo "📝 View logs with: pm2 logs surveyor-prod"
echo "🛑 Stop with: pm2 stop surveyor-prod"