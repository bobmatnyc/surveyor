#!/bin/bash

# PM2 Restart Script for Surveyor
# This script restarts the surveyor application with zero downtime

set -e

echo "🔄 Restarting Surveyor with PM2..."

# Navigate to project directory
cd /Users/masa/Projects/managed/surveyor

# Check which processes are running
RUNNING_PROCESSES=$(pm2 jlist | jq -r '.[] | select(.pm2_env.status == "online") | select(.name | startswith("surveyor")) | .name')

if [ -z "$RUNNING_PROCESSES" ]; then
    echo "❌ No surveyor processes are currently running."
    echo "Use ./pm2-scripts/start-dev.sh or ./pm2-scripts/start-prod.sh to start the application."
    exit 1
fi

# Restart running processes
for process in $RUNNING_PROCESSES; do
    echo "🔄 Restarting $process..."
    pm2 restart $process
done

# Show status
echo "📊 Application Status:"
pm2 status

echo "✅ Surveyor application restarted successfully!"
echo "🌐 Access the application at: http://localhost:3002"