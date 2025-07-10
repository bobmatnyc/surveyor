#!/bin/bash

# PM2 Stop Script for Surveyor
# This script stops all surveyor processes

set -e

echo "🛑 Stopping Surveyor processes..."

# Navigate to project directory
cd /Users/masa/Projects/managed/surveyor

# Stop all surveyor processes
echo "📦 Stopping all surveyor processes..."
pm2 stop surveyor-dev 2>/dev/null || true
pm2 stop surveyor-prod 2>/dev/null || true

# Delete processes from PM2 list
echo "🗑️  Removing processes from PM2 list..."
pm2 delete surveyor-dev 2>/dev/null || true
pm2 delete surveyor-prod 2>/dev/null || true

# Show status
echo "📊 Current PM2 Status:"
pm2 status

echo "✅ All surveyor processes have been stopped!"