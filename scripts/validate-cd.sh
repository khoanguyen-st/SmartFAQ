#!/bin/bash

# Validate CD Setup Script
# This script validates that all required GitHub secrets and configurations are set

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Check if gh is installed
if ! command -v gh &> /dev/null; then
    print_error "GitHub CLI (gh) is not installed"
    exit 1
fi

# Check if authenticated
if ! gh auth status > /dev/null 2>&1; then
    print_error "GitHub CLI is not authenticated. Run: gh auth login"
    exit 1
fi

echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}   SmartFAQ CD Configuration Validator${NC}"
echo -e "${BLUE}========================================${NC}\n"

ERRORS=0
WARNINGS=0

# Function to check secret
check_secret() {
    local secret_name=$1
    local required=${2:-true}
    
    if gh secret list | grep -q "^${secret_name}"; then
        print_success "$secret_name is set"
        return 0
    else
        if [ "$required" = true ]; then
            print_error "$secret_name is NOT set (required)"
            ERRORS=$((ERRORS + 1))
        else
            print_warning "$secret_name is NOT set (optional)"
            WARNINGS=$((WARNINGS + 1))
        fi
        return 1
    fi
}

# Required Secrets
print_info "Checking required GCP secrets..."
check_secret "GCP_SA_KEY"
check_secret "GKE_CLUSTER_NAME"
check_secret "GKE_REGION"

# Check workflow files
echo ""
print_info "Checking workflow files..."

if [ -f ".github/workflows/cd-api-dev.yml" ]; then
    print_success "Development workflow file exists"
else
    print_error "Development workflow file NOT found: .github/workflows/cd-api-dev.yml"
    ERRORS=$((ERRORS + 1))
fi

# Check documentation
echo ""
print_info "Checking documentation..."

if [ -f "docs/CD_SETUP.md" ]; then
    print_success "CD setup documentation exists"
else
    print_warning "CD setup documentation NOT found: docs/CD_SETUP.md"
    WARNINGS=$((WARNINGS + 1))
fi

# Check branches
echo ""
print_info "Checking git branches..."

if git rev-parse --verify develop > /dev/null 2>&1; then
    print_success "develop branch exists"
else
    print_warning "develop branch NOT found"
    WARNINGS=$((WARNINGS + 1))
fi

# Summary
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}              Summary${NC}"
echo -e "${BLUE}========================================${NC}\n"

if [ $ERRORS -eq 0 ]; then
    print_success "All required configurations are set!"
else
    print_error "Found $ERRORS error(s) that need to be fixed"
fi

if [ $WARNINGS -gt 0 ]; then
    print_warning "Found $WARNINGS warning(s)"
fi

echo ""

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ GitHub Secrets configured!${NC}\n"
    print_warning "IMPORTANT: Don't forget to create Kubernetes secrets!"
    print_info "Run: ./scripts/create-k8s-secrets.sh"
    echo ""
    print_info "Next steps:"
    echo "  1. Create K8s secrets: ./scripts/create-k8s-secrets.sh"
    echo "  2. Push to develop branch to test: git push origin develop"
    echo "  3. Check workflow status: gh run list"
    echo "  4. View workflow logs: gh run view"
    echo ""
    exit 0
else
    echo -e "${RED}✗ CD pipeline configuration is incomplete${NC}\n"
    print_info "Please fix the errors above and run this script again"
    echo ""
    print_info "To setup missing secrets, run: ./scripts/setup-cd.sh"
    echo ""
    exit 1
fi
