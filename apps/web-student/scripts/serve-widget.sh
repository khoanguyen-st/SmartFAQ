#!/bin/bash

# Chat Widget Development Server
# This script builds and serves the chat widget for local development

set -e

echo "🚀 Building Chat Widget..."
cd "$(dirname "$0")/.."
yarn build-widget

echo ""
echo "✅ Widget built successfully!"
echo ""
echo "📦 Serving widget on http://localhost:8080/chat-widget.js"
echo ""
echo "To embed in another app, add this to your HTML:"
echo ""
echo "  <script src=\"http://localhost:8080/chat-widget.js\"></script>"
echo "  <script>"
echo "    window.addEventListener('load', function() {"
echo "      if (window.ChatWidget) {"
echo "        window.ChatWidget.init({"
echo "          apiBaseUrl: 'http://localhost:8000',"
echo "          position: { bottom: '20px', right: '20px' }"
echo "        });"
echo "      }"
echo "    });"
echo "  </script>"
echo ""
echo "Press Ctrl+C to stop"
echo ""

npx serve -l 8080 dist/widget --cors
