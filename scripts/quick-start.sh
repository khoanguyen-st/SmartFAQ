#!/bin/bash
# Quick start script for local development

set -e

echo "🚀 SmartFAQ - Quick Start Script"
echo "================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored messages
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

# Check Python version
echo ""
echo "🐍 Checking Python version..."
if ! command -v python3.11 &> /dev/null; then
    if command -v python3 &> /dev/null; then
        PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
        if [ "$(echo "$PYTHON_VERSION >= 3.11" | bc)" -eq 1 ]; then
            PYTHON_CMD="python3"
            print_success "Python $PYTHON_VERSION found"
        else
            print_error "Python 3.11+ is required, but found Python $PYTHON_VERSION"
            exit 1
        fi
    else
        print_error "Python 3.11+ is required but not found"
        exit 1
    fi
else
    PYTHON_CMD="python3.11"
    print_success "Python 3.11 found"
fi

# Check if .env exists
echo ""
echo "🔐 Checking environment configuration..."
if [ ! -f "apps/api/.env" ]; then
    print_warning "No .env file found. Creating from .env.example..."
    
    if [ ! -f ".env.example" ]; then
        print_error ".env.example not found"
        exit 1
    fi
    
    cp .env.example apps/api/.env
    print_error "Please edit apps/api/.env and set your GOOGLE_API_KEY"
    print_info "Get your key from: https://aistudio.google.com/app/apikey"
    exit 1
fi

# Check for GOOGLE_API_KEY
if ! grep -q "GOOGLE_API_KEY=.*[a-zA-Z0-9]" apps/api/.env; then
    print_error "GOOGLE_API_KEY not set in .env file"
    print_info "Get your key from: https://aistudio.google.com/app/apikey"
    exit 1
fi

print_success "Environment file configured"

# Check Docker
echo ""
echo "🐳 Checking Docker..."
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed"
    print_info "Install from: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    print_error "Docker Compose is not installed"
    exit 1
fi

# Use docker compose or docker-compose
if docker compose version &> /dev/null 2>&1; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

print_success "Docker is ready"

# Start services with docker-compose
echo ""
echo "🐳 Starting services with Docker Compose..."
$DOCKER_COMPOSE up -d postgres redis chroma

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 8

# Check if services are running
echo ""
echo "🔍 Checking services status..."

if ! $DOCKER_COMPOSE ps | grep -q "postgres.*Up\|postgres.*running"; then
    print_error "PostgreSQL is not running"
    $DOCKER_COMPOSE logs postgres
    exit 1
fi
print_success "PostgreSQL is running"

if ! $DOCKER_COMPOSE ps | grep -q "redis.*Up\|redis.*running"; then
    print_error "Redis is not running"
    $DOCKER_COMPOSE logs redis
    exit 1
fi
print_success "Redis is running"

if ! $DOCKER_COMPOSE ps | grep -q "chroma.*Up\|chroma.*running"; then
    print_error "Chroma is not running"
    $DOCKER_COMPOSE logs chroma
    exit 1
fi
print_success "Chroma is running"

# Setup Python environment
echo ""
echo "🐍 Setting up Python environment..."
cd apps/api

if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    $PYTHON_CMD -m venv venv
    print_success "Virtual environment created"
else
    print_info "Virtual environment already exists"
fi

echo "Activating virtual environment..."
source venv/bin/activate

echo "Upgrading pip..."
pip install -q --upgrade pip setuptools wheel

echo "Installing dependencies (this may take a few minutes)..."
if make install-dev 2>/dev/null; then
    print_success "Dependencies installed via Makefile"
else
    print_warning "Makefile not found or failed, using pip directly..."
    pip install -e ".[dev]"
    print_success "Dependencies installed"
fi

# Run database migrations
echo ""
echo "🗄️  Setting up database..."

# Check if Alembic is initialized
if [ ! -d "alembic/versions" ]; then
    print_warning "No migration files found"
    print_info "Creating initial migration..."
    
    # Create migrations directory if it doesn't exist
    mkdir -p alembic/versions
    
    # Try to create initial migration
    if alembic revision --autogenerate -m "Initial migration" 2>/dev/null; then
        print_success "Initial migration created"
    else
        print_warning "Could not auto-generate migration. You may need to create it manually."
    fi
fi

# Run migrations if there are any
if [ -n "$(ls -A alembic/versions 2>/dev/null)" ]; then
    echo "Running database migrations..."
    if alembic upgrade head; then
        print_success "Database migrations complete"
    else
        print_error "Database migration failed"
        exit 1
    fi
else
    print_warning "No migrations to run"
fi

# Test setup
echo ""
echo "🧪 Testing setup..."
if [ -f "scripts/test_setup.py" ]; then
    if $PYTHON_CMD scripts/test_setup.py; then
        print_success "Setup tests passed"
    else
        print_warning "Some setup tests failed, but continuing..."
    fi
else
    print_warning "Test script not found, skipping tests"
fi

# Final instructions
echo ""
echo "════════════════════════════════════════════════"
echo -e "${GREEN}🎉 Setup complete!${NC}"
echo "════════════════════════════════════════════════"
echo ""
echo "📋 Next steps:"
echo ""
echo "1. Start the API server:"
echo -e "   ${BLUE}cd apps/api${NC}"
echo -e "   ${BLUE}source venv/bin/activate${NC}"
echo -e "   ${BLUE}make run${NC}"
echo ""
echo "   Or manually:"
echo -e "   ${BLUE}uvicorn app.main:app --reload --host 0.0.0.0 --port 8000${NC}"
echo ""
echo "2. Access the API:"
echo -e "   ${BLUE}http://localhost:8000${NC}"
echo -e "   ${BLUE}http://localhost:8000/docs${NC} (Swagger UI)"
echo ""
echo "3. Useful commands:"
echo -e "   ${BLUE}make help${NC}           - Show all available commands"
echo -e "   ${BLUE}make test${NC}           - Run tests"
echo -e "   ${BLUE}make format${NC}         - Format code"
echo -e "   ${BLUE}make lint${NC}           - Run linter"
echo ""
echo "4. Stop services:"
echo -e "   ${BLUE}docker-compose down${NC}"
echo ""
echo "════════════════════════════════════════════════"