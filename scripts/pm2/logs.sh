#!/bin/bash

# PM2 Logs Script for Surveyor
# This script provides easy access to PM2 logs

set -e

echo "📝 Surveyor PM2 Logs Management"
echo "================================"

# Navigate to project directory
cd /Users/masa/Projects/managed/surveyor

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTION] [PROCESS_NAME]"
    echo ""
    echo "Options:"
    echo "  -f, --follow     Follow logs in real-time"
    echo "  -e, --errors     Show only error logs"
    echo "  -l, --lines N    Show last N lines (default: 50)"
    echo "  -c, --clear      Clear all logs"
    echo "  -h, --help       Show this help message"
    echo ""
    echo "Process Names:"
    echo "  surveyor-dev     Development server logs"
    echo "  surveyor-prod    Production server logs"
    echo "  (empty)          All surveyor processes"
}

# Parse command line arguments
FOLLOW=false
ERRORS_ONLY=false
LINES=50
CLEAR_LOGS=false
PROCESS_NAME=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -f|--follow)
            FOLLOW=true
            shift
            ;;
        -e|--errors)
            ERRORS_ONLY=true
            shift
            ;;
        -l|--lines)
            LINES="$2"
            shift 2
            ;;
        -c|--clear)
            CLEAR_LOGS=true
            shift
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        surveyor-dev|surveyor-prod)
            PROCESS_NAME="$1"
            shift
            ;;
        *)
            echo "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Clear logs if requested
if [ "$CLEAR_LOGS" = true ]; then
    echo "🧹 Clearing PM2 logs..."
    pm2 flush
    echo "✅ Logs cleared!"
    exit 0
fi

# Determine which processes to show logs for
if [ -z "$PROCESS_NAME" ]; then
    # Show logs for all surveyor processes
    PROCESSES=$(pm2 jlist | jq -r '.[] | select(.name | startswith("surveyor")) | .name' 2>/dev/null || true)
    if [ -z "$PROCESSES" ]; then
        echo "❌ No surveyor processes found."
        exit 1
    fi
    PROCESS_NAME="$PROCESSES"
fi

# Show logs based on options
if [ "$FOLLOW" = true ]; then
    echo "📝 Following logs for $PROCESS_NAME (Press Ctrl+C to stop)..."
    if [ "$ERRORS_ONLY" = true ]; then
        pm2 logs $PROCESS_NAME --err --lines 0
    else
        pm2 logs $PROCESS_NAME --lines 0
    fi
else
    echo "📝 Showing last $LINES lines for $PROCESS_NAME..."
    if [ "$ERRORS_ONLY" = true ]; then
        pm2 logs $PROCESS_NAME --err --lines $LINES
    else
        pm2 logs $PROCESS_NAME --lines $LINES
    fi
fi