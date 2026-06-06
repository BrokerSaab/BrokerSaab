#!/bin/bash
# Deploy brokersaab-backend to Render production
# Usage: bash deploy.sh

set -e

# Load env vars
source apps/backend/.env

SERVICE_ID="${RENDER_SERVICE_ID:-srv-d8gjhjeq1p3s739lntr0}"
API_KEY="${RENDER_API_KEY}"

if [ -z "$API_KEY" ]; then
  echo "Error: RENDER_API_KEY not set in apps/backend/.env"
  exit 1
fi

echo "Triggering Render deploy for service $SERVICE_ID..."

RESPONSE=$(curl -s -X POST \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  "https://api.render.com/v1/services/$SERVICE_ID/deploys" \
  -d '{"clearCache":"do_not_clear"}')

DEPLOY_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
STATUS=$(echo "$RESPONSE" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$DEPLOY_ID" ]; then
  echo "Deploy started: $DEPLOY_ID"
  echo "Status: $STATUS"
  echo "Track at: https://dashboard.render.com/web/$SERVICE_ID/deploys/$DEPLOY_ID"
else
  echo "Deploy response: $RESPONSE"
fi
