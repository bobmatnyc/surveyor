#!/bin/bash

# PM2 Monitor Script for Surveyor
# This script provides monitoring capabilities for the surveyor application

set -e

echo "📊 Surveyor PM2 Monitoring"
echo "=========================="

# Navigate to project directory
cd /Users/masa/Projects/managed/surveyor

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTION]"
    echo ""
    echo "Options:"
    echo "  -s, --status     Show process status"
    echo "  -m, --monit      Open PM2 monitoring interface"
    echo "  -i, --info       Show detailed process information"
    echo "  -r, --resources  Show resource usage"
    echo "  -h, --health     Show health status"
    echo "  --help           Show this help message"
}

# Parse command line arguments
if [ $# -eq 0 ]; then
    # Default: show status
    echo "📊 Current Status:"
    pm2 status
    echo ""
    echo "💡 Use '$0 --help' for more monitoring options"
    exit 0
fi

case $1 in
    -s|--status)
        echo "📊 Process Status:"
        pm2 status
        ;;
    -m|--monit)
        echo "🖥️  Opening PM2 monitoring interface..."
        echo "Press Ctrl+C to exit monitoring"
        pm2 monit
        ;;
    -i|--info)
        echo "ℹ️  Detailed Process Information:"
        pm2 show surveyor-dev 2>/dev/null || echo "surveyor-dev not running"
        echo ""
        pm2 show surveyor-prod 2>/dev/null || echo "surveyor-prod not running"
        ;;
    -r|--resources)
        echo "💻 Resource Usage:"
        pm2 status
        echo ""
        echo "📈 Memory and CPU details:"
        pm2 monit --no-interaction | head -20
        ;;
    -h|--health)
        echo "🏥 Health Status:"
        
        # Check if processes are running
        RUNNING_PROCESSES=$(pm2 jlist | jq -r '.[] | select(.pm2_env.status == "online") | select(.name | startswith("surveyor")) | .name' 2>/dev/null || true)
        
        if [ -z "$RUNNING_PROCESSES" ]; then
            echo "❌ No surveyor processes are currently running"
            echo "🔧 Start with: ./pm2-scripts/start-dev.sh or ./pm2-scripts/start-prod.sh"
        else
            echo "✅ Running processes: $RUNNING_PROCESSES"
            
            # Check if port 3002 is accessible
            if curl -s http://localhost:3002 > /dev/null 2>&1; then
                echo "✅ Application is accessible on http://localhost:3002"
            else
                echo "❌ Application is not accessible on http://localhost:3002"
                echo "🔧 Check logs with: ./pm2-scripts/logs.sh"
            fi
            
            # Show recent restart information
            echo ""
            echo "🔄 Recent Restart Information:"
            pm2 jlist | jq -r '.[] | select(.name | startswith("surveyor")) | "\(.name): \(.pm2_env.restart_time) restarts, uptime: \(.pm2_env.pm_uptime)"' 2>/dev/null || true
        fi
        ;;
    --help)
        show_usage
        ;;
    *)
        echo "Unknown option: $1"
        show_usage
        exit 1
        ;;
esac