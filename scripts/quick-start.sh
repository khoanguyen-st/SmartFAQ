#!/bin/bash
# Quick start script for local development

set -e

echo "🚀 SmartFAQ - Quick Start Script"
echo "================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f "apps/api/.env" ]; then
    echo -e "${YELLOW}⚠️  No .env file found. Creating from .env.example...${NC}"
    cp .env.example apps/api/.env
    echo -e "${RED}❗ Please edit apps/api/.env and set your GOOGLE_API_KEY${NC}"
    echo -e "${RED}   Get your key from: https://aistudio.google.com/app/apikey${NC}"
    exit 1
fi

# Check for GOOGLE_API_KEY
if ! grep -q "GOOGLE_API_KEY=.*[a-zA-Z0-9]" apps/api/.env; then
    echo -e "${RED}❌ GOOGLE_API_KEY not set in .env file${NC}"
    echo -e "${RED}   Get your key from: https://aistudio.google.com/app/apikey${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Environment file found${NC}"

# Start services with docker-compose
echo ""
echo "🐳 Starting services with Docker Compose..."
docker-compose up -d db redis chroma

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 5

# Check if services are running
if ! docker-compose ps | grep -q "postgres.*Up"; then
    echo -e "${RED}❌ PostgreSQL is not running${NC}"
    exit 1
fi

if ! docker-compose ps | grep -q "redis.*Up"; then
    echo -e "${RED}❌ Redis is not running${NC}"
    exit 1
fi

if ! docker-compose ps | grep -q "chroma.*Up"; then
    echo -e "${RED}❌ Chroma is not running${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All services are running${NC}"

# Setup Python environment
echo ""
echo "🐍 Setting up Python environment..."
cd apps/api

if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3.11 -m venv venv
fi

echo "Activating virtual environment..."
source venv/bin/activate

echo "Installing dependencies..."
pip install -q --upgrade pip
pip install -q -e .

echo -e "${GREEN}✅ Python environment ready${NC}"

# Run database migrations
# Run database migrations
echo ""
echo "🗄️  Running database migrations..."

# Check if Alembic is initialized
if [ ! -d "alembic" ] || [ ! -f "alembic.ini" ]; then
    echo -e "${YELLOW}⚠️  Alembic not initialized. Initializing...${NC}"
    alembic init alembic
    echo -e "${GREEN}✅ Alembic initialized${NC}"
    echo -e "${YELLOW}⚠️  Please configure alembic.ini and alembic/env.py before running migrations${NC}"
    echo -e "${YELLOW}   You may need to create migration files with: alembic revision --autogenerate -m 'Initial migration'${NC}"
else
    echo -e "${GREEN}✅ Alembic already initialized${NC}"
fi

# Check if there are any migration files
if [ -z "$(ls -A alembic/versions 2>/dev/null)" ]; then
    echo -e "${YELLOW}⚠️  No migration files found in alembic/versions${NC}"
    echo -e "${YELLOW}   You may need to create migration files with: alembic revision --autogenerate -m 'Initial migration'${NC}"
else
    alembic upgrade head
    echo -e "${GREEN}✅ Database migrations complete${NC}"
fi

# Test setup
echo ""
echo "🧪 Testing setup..."
python3.11 scripts/test_setup.py

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 Setup complete! You can now start the API server:${NC}"
    echo ""
    echo "   cd apps/api"
    echo "   source venv/bin/activate"
    echo "   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
    echo ""
    echo "Or use:"
    echo "   make dev-api"
else
    echo -e "${RED}⚠️  Some tests failed. Please check the output above.${NC}"
    exit 1
fi
