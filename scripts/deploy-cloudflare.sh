#!/bin/bash
# Quick deploy script for Cloudflare Pages using Wrangler CLI

set -e

echo "🚀 SmartFAQ Cloudflare Pages Deployment"
echo "========================================"
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Installing..."
    npm install -g wrangler
fi

# Login check
echo "🔐 Checking Cloudflare authentication..."
if ! wrangler whoami &> /dev/null; then
    echo "Please login to Cloudflare:"
    wrangler login
fi

# Deploy function
deploy_app() {
    local APP_NAME=$1
    local APP_PATH=$2
    local PROJECT_NAME=$3
    
    echo ""
    echo "📦 Deploying $APP_NAME..."
    echo "─────────────────────────────"
    
    cd "$APP_PATH"
    
    # Check if .env.production exists
    if [ ! -f .env.production ]; then
        echo "⚠️  .env.production not found. Creating from .env.example..."
        if [ -f .env.example ]; then
            cp .env.example .env.production
            echo "✅ Created .env.production. Please update values if needed."
        else
            echo "❌ .env.example not found!"
            return 1
        fi
    fi
    
    # Install dependencies
    echo "📥 Installing dependencies..."
    yarn install --frozen-lockfile
    
    # Build
    echo "🔨 Building application..."
    yarn build
    
    # Deploy
    echo "☁️  Deploying to Cloudflare Pages..."
    wrangler pages deploy dist --project-name="$PROJECT_NAME"
    
    echo "✅ $APP_NAME deployed successfully!"
    
    cd - > /dev/null
}

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Deploy Web Admin
if [ "$1" == "admin" ] || [ "$1" == "all" ] || [ -z "$1" ]; then
    deploy_app "Web Admin" "$PROJECT_ROOT/apps/web-admin" "smartfaq-admin"
fi

# Deploy Web Student
if [ "$1" == "student" ] || [ "$1" == "all" ] || [ -z "$1" ]; then
    deploy_app "Web Student" "$PROJECT_ROOT/apps/web-student" "smartfaq-student"
fi

echo ""
echo "🎉 Deployment Complete!"
echo "======================="
echo ""
echo "📊 View your deployments:"
echo "  Admin:   https://dash.cloudflare.com/pages/smartfaq-admin"
echo "  Student: https://dash.cloudflare.com/pages/smartfaq-student"
echo ""
echo "🌐 Access URLs (after DNS propagation):"
echo "  Admin:   https://admin.smartfaq.dev.devplus.edu.vn"
echo "  Student: https://chat.smartfaq.dev.devplus.edu.vn"
echo ""
