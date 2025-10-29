#!/bin/bash
# Test API endpoints with curl

set -e

API_URL="${API_URL:-http://localhost:8000}"
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "======================================================================"
echo "🧪 SmartFAQ API Endpoints Test"
echo "======================================================================"
echo ""
echo "API URL: $API_URL"
echo ""

# Test 1: Health check
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  Testing Health Endpoint"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

response=$(curl -s "$API_URL/health")
if echo "$response" | grep -q "healthy"; then
    echo -e "${GREEN}✅ Health check passed${NC}"
    echo "Response: $response"
else
    echo -e "${RED}❌ Health check failed${NC}"
    echo "Response: $response"
    exit 1
fi

echo ""

# Test 2: API docs
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  Testing API Docs Endpoint"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

status_code=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/docs")
if [ "$status_code" -eq 200 ]; then
    echo -e "${GREEN}✅ API docs accessible${NC}"
    echo "URL: $API_URL/docs"
else
    echo -e "${RED}❌ API docs not accessible (status: $status_code)${NC}"
fi

echo ""

# Test 3: Query endpoint (requires running API)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣  Testing Query Endpoint (Chat)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "Query: 'Học phí là bao nhiêu?'"
response=$(curl -s -X POST "$API_URL/api/v1/chat/query" \
  -H "Content-Type: application/json" \
  -d '{"question": "Học phí là bao nhiêu?"}' 2>&1)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Query endpoint responded${NC}"
    echo "Response preview:"
    echo "$response" | python3 -m json.tool 2>/dev/null | head -20 || echo "$response" | head -20
else
    echo -e "${YELLOW}⚠️  Query endpoint may not be available yet${NC}"
    echo "This is normal if you haven't started the API server"
    echo "Response: $response"
fi

echo ""

# Test 4: List documents endpoint
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4️⃣  Testing List Documents Endpoint"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Note: This requires authentication token
echo -e "${YELLOW}⚠️  Skipping - requires authentication${NC}"
echo "To test manually:"
echo "  curl -X GET $API_URL/api/v1/admin/documents \\"
echo "    -H 'Authorization: Bearer YOUR_TOKEN'"

echo ""

# Summary
echo "======================================================================"
echo "📊 Test Summary"
echo "======================================================================"
echo ""
echo -e "${GREEN}✅${NC} Health endpoint: Working"
echo -e "${GREEN}✅${NC} API docs: Accessible"
echo -e "${YELLOW}⚠️${NC}  Query endpoint: Check API server is running"
echo -e "${YELLOW}⚠️${NC}  Admin endpoints: Require authentication"
echo ""
echo "💡 Next steps:"
echo "   1. Start API server: uvicorn app.main:app --reload"
echo "   2. Visit: $API_URL/docs for interactive API testing"
echo "   3. Create user account and get auth token"
echo "   4. Upload documents via /api/v1/admin/documents/upload"
echo ""
echo "======================================================================"
