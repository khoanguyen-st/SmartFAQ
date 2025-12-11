#!/bin/bash
set -e

# SmartFAQ API Deployment Script for Development Environment

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="smartfaq-dev"
PROJECT_ID="enspara"
REGION="asia-southeast1"
REGISTRY="${REGION}-docker.pkg.dev/${PROJECT_ID}/smartfaq"
IMAGE_NAME="smartfaq-api"
IMAGE_TAG="dev-latest"
FULL_IMAGE="${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
print_info "Checking prerequisites..."
for cmd in kubectl helm docker; do
    if ! command_exists $cmd; then
        print_error "$cmd is not installed. Please install it first."
        exit 1
    fi
done

print_info "Prerequisites check passed!"

# Parse command line arguments
ACTION=${1:-"all"}

case $ACTION in
    "helm")
        print_info "Installing Helm charts (PostgreSQL, Redis, and MongoDB)..."
        
        # Add Bitnami repo if not exists
        if ! helm repo list | grep -q bitnami; then
            print_info "Adding Bitnami Helm repository..."
            helm repo add bitnami https://charts.bitnami.com/bitnami
        fi
        helm repo update
        
        # Install PostgreSQL
        print_info "Installing PostgreSQL..."
        cd ./postgres
        helm dependency update
        
        if helm list -n $NAMESPACE | grep -q postgres-smartfaq; then
            print_warning "PostgreSQL already installed. Upgrading..."
            helm upgrade postgres-smartfaq . \
                -f values-dev.yaml \
                -n $NAMESPACE
        else
            helm install postgres-smartfaq . \
                -f values-dev.yaml \
                -n $NAMESPACE \
                --create-namespace
        fi
        
        # Install Redis
        print_info "Installing Redis..."
        cd ../redis
        helm dependency update
        
        if helm list -n $NAMESPACE | grep -q redis-smartfaq; then
            print_warning "Redis already installed. Upgrading..."
            helm upgrade redis-smartfaq . \
                -f values-dev.yaml \
                -n $NAMESPACE
        else
            helm install redis-smartfaq . \
                -f values-dev.yaml \
                -n $NAMESPACE
        fi
        
        # Install MongoDB
        print_info "Installing MongoDB..."
        cd ../mongo
        helm dependency update
        
        if helm list -n $NAMESPACE | grep -q mongo-smartfaq; then
            print_warning "MongoDB already installed. Upgrading..."
            helm upgrade mongo-smartfaq . \
                -f values-dev.yaml \
                -n $NAMESPACE
        else
            helm install mongo-smartfaq . \
                -f values-dev.yaml \
                -n $NAMESPACE
        fi
        
        cd ../..
        print_info "Helm charts installed successfully!"
        ;;
        
    "build")
        print_info "Building and pushing Docker image..."
        
        # Get script directory and navigate to project root
        SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
        PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
        
        # Authenticate Docker with GCP Artifact Registry
        print_info "Authenticating Docker with GCP Artifact Registry..."
        gcloud auth configure-docker ${REGION}-docker.pkg.dev --quiet
        
        cd "$PROJECT_ROOT/apps/api"
        
        # Build image
        print_info "Building Docker image: $FULL_IMAGE"
        docker build -f Dockerfile.prod -t $FULL_IMAGE .
        
        # Push image
        print_info "Pushing Docker image to registry..."
        docker push $FULL_IMAGE
        
        cd "$SCRIPT_DIR"
        print_info "Docker image built and pushed successfully!"
        ;;
        
    "secret")
        print_info "Creating Kubernetes secret..."
        
        SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
        ENV_FILE="$SCRIPT_DIR/services-dev/.env.dev"
        
        if [ ! -f "$ENV_FILE" ]; then
            print_error ".env.dev file not found at $ENV_FILE"
            print_info "Please create .env.dev file with required environment variables"
            exit 1
        fi
        
        # Create or update secret
        kubectl create secret generic smartfaq-api-env \
            --from-env-file="$ENV_FILE" \
            -n $NAMESPACE \
            --dry-run=client -o yaml | kubectl apply -f -
        
        print_info "Secret created/updated successfully!"
        ;;
        
    "deploy")
        print_info "Deploying SmartFAQ API to Kubernetes..."
        
        SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
        
        # Apply Kustomize configuration
        kubectl apply -k "$SCRIPT_DIR/services-dev"
        
        print_info "Waiting for deployment to be ready..."
        kubectl wait --for=condition=ready pod -l app=smartfaq-api -n $NAMESPACE --timeout=300s || true
        
        print_info "Deployment completed!"
        ;;
        
    "update")
        print_info "Updating SmartFAQ API deployment..."
        
        # Get script directory and navigate to project root
        SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
        PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
        
        # Authenticate Docker with GCP Artifact Registry
        print_info "Authenticating Docker with GCP Artifact Registry..."
        gcloud auth configure-docker ${REGION}-docker.pkg.dev --quiet
        
        # Build and push new image
        print_info "Building new Docker image..."
        cd "$PROJECT_ROOT/apps/api"
        docker build -f Dockerfile.prod -t $FULL_IMAGE .
        docker push $FULL_IMAGE
        cd "$SCRIPT_DIR"
        
        # Restart deployment
        print_info "Restarting StatefulSet..."
        kubectl rollout restart statefulset/smartfaq-api -n $NAMESPACE
        
        print_info "Waiting for rollout to complete..."
        kubectl rollout status statefulset/smartfaq-api -n $NAMESPACE --timeout=300s
        
        print_info "Update completed!"
        ;;
        
    "status")
        print_info "Checking deployment status..."
        
        echo ""
        print_info "Namespaces:"
        kubectl get ns | grep smartfaq || echo "No smartfaq namespaces found"
        
        echo ""
        print_info "Pods in $NAMESPACE:"
        kubectl get pods -n $NAMESPACE
        
        echo ""
        print_info "Services in $NAMESPACE:"
        kubectl get svc -n $NAMESPACE
        
        echo ""
        print_info "Ingress in $NAMESPACE:"
        kubectl get ingress -n $NAMESPACE
        
        echo ""
        print_info "StatefulSet in $NAMESPACE:"
        kubectl get statefulset -n $NAMESPACE
        ;;
        
    "logs")
        POD_NAME=$(kubectl get pods -n $NAMESPACE -l app=smartfaq-api -o jsonpath='{.items[0].metadata.name}')
        
        if [ -z "$POD_NAME" ]; then
            print_error "No pods found for smartfaq-api"
            exit 1
        fi
        
        print_info "Showing logs for pod: $POD_NAME"
        kubectl logs -f $POD_NAME -c smartfaq-api -n $NAMESPACE
        ;;
        
    "migrate")
        POD_NAME=$(kubectl get pods -n $NAMESPACE -l app=smartfaq-api -o jsonpath='{.items[0].metadata.name}')
        
        if [ -z "$POD_NAME" ]; then
            print_error "No pods found for smartfaq-api"
            exit 1
        fi
        
        print_info "Running database migration on pod: $POD_NAME"
        kubectl exec -it $POD_NAME -n $NAMESPACE -- alembic upgrade head
        ;;
        
    "shell")
        POD_NAME=$(kubectl get pods -n $NAMESPACE -l app=smartfaq-api -o jsonpath='{.items[0].metadata.name}')
        
        if [ -z "$POD_NAME" ]; then
            print_error "No pods found for smartfaq-api"
            exit 1
        fi
        
        print_info "Opening shell in pod: $POD_NAME"
        kubectl exec -it $POD_NAME -n $NAMESPACE -- /bin/sh
        ;;
        
    "cleanup")
        print_warning "This will delete all SmartFAQ resources in $NAMESPACE namespace"
        read -p "Are you sure? (yes/no): " confirm
        
        if [ "$confirm" != "yes" ]; then
            print_info "Cleanup cancelled"
            exit 0
        fi
        
        print_info "Deleting API deployment..."
        kubectl delete -k ./services-dev || true
        
        print_info "Uninstalling Helm charts..."
        helm uninstall redis-smartfaq -n $NAMESPACE || true
        helm uninstall postgres-smartfaq -n $NAMESPACE || true
        helm uninstall mongo-smartfaq -n $NAMESPACE || true
        
        print_info "Deleting namespace..."
        kubectl delete namespace $NAMESPACE || true
        
        print_info "Cleanup completed!"
        ;;
        
    "all")
        print_info "Performing full deployment..."
        
        # Install Helm charts
        $0 helm
        
        # Wait for databases to be ready
        print_info "Waiting for PostgreSQL to be ready (this may take a few minutes)..."
        kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=postgresql -n $NAMESPACE --timeout=600s || {
            print_warning "PostgreSQL not ready yet, checking pod status..."
            kubectl get pods -n $NAMESPACE -l app.kubernetes.io/name=postgresql
            kubectl describe pod -n $NAMESPACE -l app.kubernetes.io/name=postgresql | tail -20
        }
        
        print_info "Waiting for Redis to be ready..."
        kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=redis -n $NAMESPACE --timeout=600s || {
            print_warning "Redis not ready yet, checking pod status..."
            kubectl get pods -n $NAMESPACE -l app.kubernetes.io/name=redis
            kubectl describe pod -n $NAMESPACE -l app.kubernetes.io/name=redis | tail -20
        }
        
        print_info "Waiting for MongoDB to be ready..."
        kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=mongodb -n $NAMESPACE --timeout=600s || {
            print_warning "MongoDB not ready yet, checking pod status..."
            kubectl get pods -n $NAMESPACE -l app.kubernetes.io/name=mongodb
            kubectl describe pod -n $NAMESPACE -l app.kubernetes.io/name=mongodb | tail -20
        }
        
        print_info "Waiting for Chroma to be ready..."
        kubectl wait --for=condition=ready pod -l app=chroma -n $NAMESPACE --timeout=300s || {
            print_warning "Chroma not ready yet, checking pod status..."
            kubectl get pods -n $NAMESPACE -l app=chroma
        }
        
        print_info "Waiting for MinIO to be ready..."
        kubectl wait --for=condition=ready pod -l app=minio -n $NAMESPACE --timeout=300s || {
            print_warning "MinIO not ready yet, checking pod status..."
            kubectl get pods -n $NAMESPACE -l app=minio
        }
        
        # Build and push image
        $0 build
        
        # Create secret
        $0 secret
        
        # Deploy API
        $0 deploy
        
        # Show status
        $0 status
        
        print_info "Full deployment completed successfully!"
        print_info "API should be available at: https://api.smartfaq.dev.devplus.edu.vn"
        ;;
        
    *)
        echo "SmartFAQ API Deployment Script"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  all       - Full deployment (helm + build + secret + deploy)"
        echo "  helm      - Install PostgreSQL and Redis using Helm"
        echo "  build     - Build and push Docker image"
        echo "  secret    - Create/update Kubernetes secret from .env.dev"
        echo "  deploy    - Deploy API to Kubernetes"
        echo "  update    - Build new image and restart deployment"
        echo "  status    - Show deployment status"
        echo "  logs      - Show API logs (follows)"
        echo "  migrate   - Run database migrations manually"
        echo "  shell     - Open shell in API pod"
        echo "  cleanup   - Delete all resources"
        echo ""
        echo "Examples:"
        echo "  $0 all        # Full deployment"
        echo "  $0 update     # Update running deployment"
        echo "  $0 status     # Check status"
        echo "  $0 logs       # View logs"
        ;;
esac
