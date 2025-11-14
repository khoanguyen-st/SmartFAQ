#!/bin/bash

# SmartFAQ Quick Update Script
# Run this after pulling latest changes

set -e  # Exit on error

echo "🚀 SmartFAQ Quick Update Script"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
    echo -e "${BLUE}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✔ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✖ $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d ".git" ]; then
    print_error "Please run this script from the SmartFAQ root directory"
    exit 1
fi

# Step 1: Check for uncommitted changes
print_step "Checking for uncommitted changes..."
if ! git diff-index --quiet HEAD --; then
    print_warning "You have uncommitted changes!"
    echo "Please commit or stash them before updating."
    git status --short
    exit 1
fi
print_success "Working directory is clean"
echo ""

# Step 2: Pull latest changes
print_step "Pulling latest changes from remote..."
CURRENT_BRANCH=$(git branch --show-current)
if git pull origin "$CURRENT_BRANCH"; then
    print_success "Successfully pulled latest changes"
else
    print_error "Failed to pull changes. Please resolve conflicts manually."
    exit 1
fi
echo ""

# Step 3: Check if Yarn is installed
print_step "Checking Yarn installation..."
if ! command -v yarn &> /dev/null; then
    print_warning "Yarn is not installed!"
    echo "Installing Yarn globally..."
    npm install -g yarn
    print_success "Yarn installed"
else
    YARN_VERSION=$(yarn --version)
    print_success "Yarn $YARN_VERSION found"
fi
echo ""

# Step 4: Install/Update dependencies
print_step "Installing dependencies..."
if yarn install; then
    print_success "Dependencies installed"
else
    print_error "Failed to install dependencies"
    exit 1
fi
echo ""

# Step 5: Setup Husky
print_step "Setting up Husky hooks..."
if [ -d ".husky" ]; then
    print_success "Husky directory exists"
else
    print_warning "Husky directory not found, creating..."
fi

if yarn prepare; then
    print_success "Husky hooks configured"
else
    print_warning "Husky setup might have issues, but continuing..."
fi
echo ""

# Step 6: Verify Husky hooks
print_step "Verifying Husky hooks..."
if [ -f ".husky/pre-commit" ] && [ -f ".husky/commit-msg" ]; then
    chmod +x .husky/pre-commit
    chmod +x .husky/commit-msg
    print_success "Pre-commit hook: ✓"
    print_success "Commit-msg hook: ✓"
else
    print_error "Husky hooks not found!"
    print_warning "Try running: yarn prepare"
fi
echo ""

# Step 7: Check Python environment (optional)
print_step "Checking Python environment (optional)..."
if [ -d "apps/api/venv" ]; then
    print_success "Python virtual environment found"
    echo "To update API dependencies, run:"
    echo "  cd apps/api"
    echo "  source venv/bin/activate"
    echo "  pip install -e '.[dev]'"
else
    print_warning "Python venv not found (optional for API development)"
fi
echo ""

# Step 8: Summary
echo "================================"
echo -e "${GREEN}✅ Update Complete!${NC}"
echo "================================"
echo ""
echo "What's new:"
echo "  • Pre-commit hooks (auto lint & format)"
echo "  • Commit message validation"
echo "  • Fixed CI pipeline"
echo ""
echo "Next steps:"
echo "  1. Test pre-commit: make a change and commit"
echo "  2. Use proper commit format: type(scope): message"
echo "  3. Read UPDATE_GUIDE.md for details"
echo ""
echo "Quick commands:"
echo "  yarn lint         - Lint all code"
echo "  yarn format       - Format all code"
echo "  make dev          - Start all services"
echo ""
echo "Need help? Check UPDATE_GUIDE.md or ask the team!"
echo ""
