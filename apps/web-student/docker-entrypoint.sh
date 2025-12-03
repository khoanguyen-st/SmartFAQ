#!/bin/sh
set -e

echo "🚀 Starting web-student container..."

# Check if widget needs to be built/rebuilt
if [ ! -f "public/chat-widget.js" ]; then
  echo "📦 Widget not found, building for the first time..."
  yarn build-widget
else
  echo "✅ Widget found in public/chat-widget.js"
fi

echo "🔄 Starting dev server..."
echo "   Widget available at: http://localhost:5173/chat-widget.js"

# Execute the main command
exec "$@"
