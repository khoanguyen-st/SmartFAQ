#!/bin/bash

# Helper script to rebuild widget inside Docker container
# Usage: ./scripts/rebuild-widget-docker.sh

set -e

echo "🔨 Rebuilding Chat Widget in Docker container..."

docker-compose exec web-student yarn build-widget

echo "✅ Widget rebuilt successfully!"
echo "   Available at: http://localhost:5173/chat-widget.js"
echo ""
echo "💡 Reload your browser to see changes"
