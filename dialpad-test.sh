#!/bin/bash

# Dialpad Integration Test Helper Script
# Usage: bash dialpad-test.sh [command]

set -e

APP_URL="${APP_URL:-http://localhost:8000}"
CSRF_TOKEN=""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Dialpad Integration Test Helper ===${NC}\n"

# Function to get CSRF token
get_csrf_token() {
    echo "Fetching CSRF token..."
    CSRF_TOKEN=$(curl -s "$APP_URL" | grep -oP 'name="csrf-token" content="\K[^"]+' || echo "")
    if [ -z "$CSRF_TOKEN" ]; then
        echo -e "${YELLOW}Warning: Could not fetch CSRF token. Some tests may fail.${NC}"
    else
        echo -e "${GREEN}✓ CSRF token obtained${NC}"
    fi
}

# Test connection
test_connection() {
    echo -e "\n${YELLOW}Testing Dialpad API Connection...${NC}"
    
    response=$(curl -s -X POST "$APP_URL/dialpad/test/connection" \
        -H "Content-Type: application/json" \
        -H "X-CSRF-Token: $CSRF_TOKEN")
    
    success=$(echo "$response" | grep -o '"success":true' || echo "")
    
    if [ ! -z "$success" ]; then
        echo -e "${GREEN}✓ Connection successful${NC}"
        echo "$response" | jq '.'
    else
        echo -e "${RED}✗ Connection failed${NC}"
        echo "$response" | jq '.'
    fi
}

# Test user lookup
test_user_lookup() {
    local email="${1:-}"
    
    if [ -z "$email" ]; then
        echo "Usage: $0 user-lookup <email>"
        exit 1
    fi
    
    echo -e "\n${YELLOW}Testing User Lookup for: $email${NC}"
    
    response=$(curl -s -X POST "$APP_URL/dialpad/test/user-lookup" \
        -H "Content-Type: application/json" \
        -H "X-CSRF-Token: $CSRF_TOKEN" \
        -d "{\"email\": \"$email\"}")
    
    success=$(echo "$response" | grep -o '"success":true' || echo "")
    
    if [ ! -z "$success" ]; then
        echo -e "${GREEN}✓ User found${NC}"
        echo "$response" | jq '.data.matched_user'
    else
        echo -e "${RED}✗ User not found${NC}"
        echo "$response" | jq '.'
    fi
}

# Get integration status
get_status() {
    echo -e "\n${YELLOW}Getting Integration Status...${NC}"
    
    response=$(curl -s "$APP_URL/dialpad/test/status")
    echo "$response" | jq '.'
}

# Get call logs
get_call_logs() {
    local limit="${1:-10}"
    
    echo -e "\n${YELLOW}Getting Last $limit Call Logs...${NC}"
    
    response=$(curl -s "$APP_URL/dialpad/test/call-logs?limit=$limit")
    echo "$response" | jq '.data | .[] | {contact: .contact.name, status: .status, direction: .direction, started_at: .started_at}'
}

# Get webhook logs
get_webhook_logs() {
    local limit="${1:-10}"
    
    echo -e "\n${YELLOW}Getting Last $limit Webhook Logs...${NC}"
    
    response=$(curl -s "$APP_URL/dialpad/test/webhook-logs?limit=$limit")
    echo "$response" | jq '.data | .[] | {event_type: .event_type, processed: .processed, error: .error, created_at: .created_at}'
}

# Show usage
show_usage() {
    cat << EOF
${GREEN}Usage:${NC}
  dialpad-test.sh [command] [arguments]

${GREEN}Commands:${NC}
  connection              Test API connection to Dialpad
  user-lookup <email>     Lookup a user by email
  status                  Get integration status
  call-logs [limit]       Show recent call logs (default: 10)
  webhook-logs [limit]    Show recent webhook logs (default: 10)
  dashboard               Open the test dashboard in browser
  help                    Show this help message

${GREEN}Examples:${NC}
  # Test connection
  dialpad-test.sh connection

  # Look up a user
  dialpad-test.sh user-lookup john@example.com

  # Get 20 recent calls
  dialpad-test.sh call-logs 20

  # Open dashboard
  dialpad-test.sh dashboard

${YELLOW}Note:${NC} This script requires curl and jq to be installed.
EOF
}

# Parse command
get_csrf_token

case "${1:-help}" in
    connection)
        test_connection
        ;;
    user-lookup)
        test_user_lookup "$2"
        ;;
    status)
        get_status
        ;;
    call-logs)
        get_call_logs "$2"
        ;;
    webhook-logs)
        get_webhook_logs "$2"
        ;;
    dashboard)
        echo -e "\n${YELLOW}Opening dashboard in browser...${NC}"
        if command -v xdg-open &> /dev/null; then
            xdg-open "$APP_URL/dialpad/test/dashboard"
        elif command -v open &> /dev/null; then
            open "$APP_URL/dialpad/test/dashboard"
        else
            echo "Please open: $APP_URL/dialpad/test/dashboard"
        fi
        ;;
    help|--help|-h)
        show_usage
        ;;
    *)
        echo -e "${RED}Unknown command: $1${NC}\n"
        show_usage
        exit 1
        ;;
esac

echo -e "\n${GREEN}Done!${NC}\n"
