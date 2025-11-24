#!/bin/bash

# Setup Script for GitHub Actions CD
# This script helps you configure GitHub Secrets for CD pipeline

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "\n${BLUE}==================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}==================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

print_header "SmartFAQ CD Setup - GitHub Actions Configuration"

# Check prerequisites
print_info "Checking prerequisites..."

MISSING_DEPS=0

if ! command_exists gcloud; then
    print_error "gcloud CLI is not installed"
    echo "   Install from: https://cloud.google.com/sdk/docs/install"
    MISSING_DEPS=1
else
    print_success "gcloud CLI is installed"
fi

if ! command_exists gh; then
    print_error "GitHub CLI (gh) is not installed"
    echo "   Install from: https://cli.github.com/"
    MISSING_DEPS=1
else
    print_success "GitHub CLI is installed"
fi

if ! command_exists kubectl; then
    print_error "kubectl is not installed"
    echo "   Install from: https://kubernetes.io/docs/tasks/tools/"
    MISSING_DEPS=1
else
    print_success "kubectl is installed"
fi

if [ $MISSING_DEPS -eq 1 ]; then
    print_error "Please install missing dependencies and try again"
    exit 1
fi

# Check GitHub CLI authentication
print_info "Checking GitHub CLI authentication..."
if ! gh auth status > /dev/null 2>&1; then
    print_warning "GitHub CLI is not authenticated"
    print_info "Please run: gh auth login"
    exit 1
else
    print_success "GitHub CLI is authenticated"
fi

# Check gcloud authentication
print_info "Checking gcloud authentication..."
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" > /dev/null 2>&1; then
    print_warning "gcloud is not authenticated"
    print_info "Please run: gcloud auth login"
    exit 1
else
    ACTIVE_ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)")
    print_success "gcloud is authenticated as: $ACTIVE_ACCOUNT"
fi

# Configuration
print_header "Configuration"

PROJECT_ID=${PROJECT_ID:-"enspara"}
REGION=${REGION:-"asia-southeast1"}
SA_NAME="github-actions-cd"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
KEY_FILE="${HOME}/github-actions-key.json"

echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"
echo "Service Account: $SA_EMAIL"
echo ""

read -p "Continue with these settings? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_info "Setup cancelled"
    exit 0
fi

# Create Service Account
print_header "Step 1: Create GCP Service Account"

if gcloud iam service-accounts describe $SA_EMAIL --project=$PROJECT_ID > /dev/null 2>&1; then
    print_warning "Service account already exists: $SA_EMAIL"
else
    print_info "Creating service account..."
    gcloud iam service-accounts create $SA_NAME \
        --display-name="GitHub Actions CD" \
        --project=$PROJECT_ID
    print_success "Service account created"
fi

# Grant IAM roles
print_header "Step 2: Grant IAM Roles"

ROLES=(
    "roles/artifactregistry.writer"
    "roles/container.developer"
)

for ROLE in "${ROLES[@]}"; do
    print_info "Granting role: $ROLE"
    gcloud projects add-iam-policy-binding $PROJECT_ID \
        --member="serviceAccount:$SA_EMAIL" \
        --role="$ROLE" \
        --quiet > /dev/null 2>&1
    print_success "Role granted: $ROLE"
done

# Create Service Account Key
print_header "Step 3: Create Service Account Key"

if [ -f "$KEY_FILE" ]; then
    print_warning "Key file already exists: $KEY_FILE"
    read -p "Overwrite existing key? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -f "$KEY_FILE"
    else
        print_info "Using existing key file"
    fi
fi

if [ ! -f "$KEY_FILE" ]; then
    print_info "Creating new key..."
    gcloud iam service-accounts keys create "$KEY_FILE" \
        --iam-account=$SA_EMAIL \
        --project=$PROJECT_ID
    print_success "Key created: $KEY_FILE"
fi

# Get cluster info
print_header "Step 4: Get GKE Cluster Information"

print_info "Listing GKE clusters..."
CLUSTERS=$(gcloud container clusters list --project=$PROJECT_ID --format="value(name,location)")

if [ -z "$CLUSTERS" ]; then
    print_error "No GKE clusters found in project: $PROJECT_ID"
    print_warning "Please create a GKE cluster first"
    exit 1
fi

echo "Available clusters:"
echo "$CLUSTERS"
echo ""

read -p "Enter cluster name: " CLUSTER_NAME
read -p "Enter cluster region/zone: " CLUSTER_LOCATION

# Verify cluster exists
if ! gcloud container clusters describe $CLUSTER_NAME \
    --region=$CLUSTER_LOCATION --project=$PROJECT_ID > /dev/null 2>&1; then
    print_error "Cluster not found: $CLUSTER_NAME in $CLUSTER_LOCATION"
    exit 1
fi

print_success "Cluster verified: $CLUSTER_NAME"

# Setup GitHub Secrets
print_header "Step 5: Setup GitHub Secrets"

print_info "Reading GCP Service Account key..."
GCP_SA_KEY=$(cat "$KEY_FILE")

print_info "Setting up GitHub secrets..."

# Common secrets
gh secret set GCP_SA_KEY --body "$GCP_SA_KEY"
print_success "Set: GCP_SA_KEY"

gh secret set GKE_CLUSTER_NAME --body "$CLUSTER_NAME"
print_success "Set: GKE_CLUSTER_NAME"

gh secret set GKE_REGION --body "$CLUSTER_LOCATION"
print_success "Set: GKE_REGION"

# Summary
print_header "Setup Complete!"

print_success "GCP Service Account created and configured"
print_success "GitHub Secrets configured"
print_info "Service account key saved to: $KEY_FILE"
print_warning "Keep this key file secure or delete it after setup"

echo ""
print_warning "IMPORTANT: You need to create Kubernetes secrets manually!"
echo ""
print_info "Run this command to create secrets in K8s:"
echo "kubectl create secret generic smartfaq-api-env \\"
echo "  --from-literal=DATABASE_URL='...' \\"
echo "  --from-literal=REDIS_URL='...' \\"
echo "  --from-literal=SECRET_KEY='...' \\"
echo "  --from-literal=OPENAI_API_KEY='...' \\"
echo "  --from-literal=ANTHROPIC_API_KEY='...' \\"
echo "  --from-literal=GEMINI_API_KEY='...' \\"
echo "  --from-literal=CORS_ORIGINS='...' \\"
echo "  --from-literal=ALLOWED_DOMAINS='...' \\"
echo "  --from-literal=ENVIRONMENT='development' \\"
echo "  -n smartfaq-dev"
echo ""
print_info "Or use: ./scripts/create-k8s-secrets.sh"

echo ""
print_info "Next steps:"
echo "1. Review GitHub Secrets: gh secret list"
echo "2. Create Kubernetes secrets (see above)"
echo "3. Test workflow: push to develop branch"
echo "4. Check workflow status: gh run list"
echo ""
print_info "Documentation: docs/CD_SETUP.md"

echo ""
read -p "Delete service account key file now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -f "$KEY_FILE"
    print_success "Key file deleted"
else
    print_warning "Remember to delete the key file manually: $KEY_FILE"
fi

print_success "Setup complete! 🎉"
