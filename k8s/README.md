# Kubernetes Deployment for SmartFAQ API

## Overview

This directory contains Kubernetes configurations for deploying SmartFAQ API to GKE (Google Kubernetes Engine).

## Directory Structure

```
k8s/
├── base/                     # Base Kubernetes resources
│   ├── namespace.yaml        # Namespace definition
│   ├── service.yaml          # Service configuration
│   ├── statefulSet.yaml      # StatefulSet for API pods
│   ├── ingress.yaml          # Ingress for external access
│   ├── network-policy.yaml   # Network policies
│   ├── resource-quota.yaml   # Resource quotas and limits
│   └── kustomization.yaml    # Kustomize config
├── services-dev/             # Development environment overlay
│   ├── namespace.yaml        # Dev namespace
│   ├── kustomization.yaml    # Dev kustomization
│   └── patches/              # Dev-specific patches
│       ├── ingress.yaml      # Dev ingress patch
│       └── statefulSet.yaml  # Dev StatefulSet patch
├── postgres/                 # PostgreSQL Helm chart
│   ├── Chart.yaml
│   ├── values.yaml           # Production values
│   └── values-dev.yaml       # Development values
└── redis/                    # Redis Helm chart
    ├── Chart.yaml
    ├── values.yaml           # Production values
    └── values-dev.yaml       # Development values
```

## Prerequisites

1. **GKE Cluster**: A running GKE cluster
2. **kubectl**: Kubernetes CLI configured
3. **Helm 3**: Package manager for Kubernetes
4. **Kustomize**: Built into kubectl (v1.14+)
5. **Docker Image**: SmartFAQ API image pushed to GCP Artifact Registry

## Deployment Steps

### 1. Setup PostgreSQL (Development)

```bash
# Add Bitnami repository (if not already added)
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

# Install PostgreSQL for development
cd k8s/postgres
helm dependency update
helm install postgres-smartfaq . \
  -f values-dev.yaml \
  -n smartfaq-dev \
  --create-namespace
```

### 2. Setup Redis (Development)

```bash
# Install Redis for development
cd k8s/redis
helm dependency update
helm install redis-smartfaq . \
  -f values-dev.yaml \
  -n smartfaq-dev
```

### 3. Create Kubernetes Secrets

Create secrets for the API environment variables:

```bash
# Create .env.dev file with your configuration
cat > k8s/services-dev/.env.dev << 'EOF'
# Database
DATABASE_URL=postgresql://postgres:smartfaq_dev_postgres_pass_2024@postgres-smartfaq-postgresql.smartfaq-dev.svc.cluster.local:5432/smartfaq_dev

# Redis (Celery)
CELERY_BROKER_URL=redis://:smartfaq_dev_redis_pass_2024@redis-smartfaq-master.smartfaq-dev.svc.cluster.local:6379/0
CELERY_RESULT_BACKEND=redis://:smartfaq_dev_redis_pass_2024@redis-smartfaq-master.smartfaq-dev.svc.cluster.local:6379/0

# API Settings
API_HOST=0.0.0.0
API_PORT=8000
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRE_MINUTES=1440

# Google Gemini
GOOGLE_API_KEY=your-google-api-key

# LLM Configuration
LLM_MODEL=gemini-2.0-flash-exp
LLM_TEMPERATURE=0.3
LLM_MAX_TOKENS=2048

# Embeddings
EMBED_MODEL=intfloat/multilingual-e5-small
EMBED_DEVICE=cpu
EMBED_NORMALIZE=true
EMBED_BATCH=32

# RAG Settings
CONFIDENCE_THRESHOLD=0.65
MAX_CONTEXT_CHARS=8000
TOP_K_RETRIEVAL=5

# Upload Settings
UPLOAD_DIR=/app/uploads
UPLOAD_MAX_MB=50
EOF

# Create the secret
kubectl create secret generic smartfaq-api-env \
  --from-env-file=k8s/services-dev/.env.dev \
  -n smartfaq-dev
```

### 4. Deploy SmartFAQ API

```bash
# Build and push Docker image (adjust registry path as needed)
cd apps/api
docker build -f Dockerfile.prod -t asia-southeast1-docker.pkg.dev/enspara/smartfaq/smartfaq-api:dev-latest .
docker push asia-southeast1-docker.pkg.dev/enspara/smartfaq/smartfaq-api:dev-latest

# Deploy using Kustomize
cd ../../k8s/services-dev
kubectl apply -k .
```

### 5. Verify Deployment

```bash
# Check pods
kubectl get pods -n smartfaq-dev

# Check services
kubectl get svc -n smartfaq-dev

# Check ingress
kubectl get ingress -n smartfaq-dev

# View logs
kubectl logs -f smartfaq-api-0 -n smartfaq-dev

# Check migration logs
kubectl logs smartfaq-api-0 -c db-migration -n smartfaq-dev
```

## Configuration Details

### Environment-specific Settings

**Development (services-dev):**

- Replicas: 1
- Resources: 1Gi memory, 1 CPU
- Storage: 10Gi
- Domain: `api.smartfaq.dev.devplus.edu.vn`

**Production (base):**

- Replicas: 2
- Resources: 2Gi memory, 2 CPU
- Storage: 20Gi
- Domain: `api.smartfaq.devplus.edu.vn`

### Database Connection

PostgreSQL is deployed as a Helm chart with:

- Service name: `postgres-smartfaq-postgresql.smartfaq-dev.svc.cluster.local`
- Port: 5432
- Database: `smartfaq_dev`
- User: `postgres`

### Redis Connection

Redis is deployed as a Helm chart with:

- Service name: `redis-smartfaq-master.smartfaq-dev.svc.cluster.local`
- Port: 6379
- Authentication: Password-based

## Updating Deployment

### Update API Code

```bash
# Build and push new image
docker build -f Dockerfile.prod -t asia-southeast1-docker.pkg.dev/enspara/smartfaq/smartfaq-api:dev-latest .
docker push asia-southeast1-docker.pkg.dev/enspara/smartfaq/smartfaq-api:dev-latest

# Restart pods to pick up new image
kubectl rollout restart statefulset/smartfaq-api -n smartfaq-dev
```

### Update Configuration

```bash
# Update secret
kubectl create secret generic smartfaq-api-env \
  --from-env-file=k8s/services-dev/.env.dev \
  -n smartfaq-dev \
  --dry-run=client -o yaml | kubectl apply -f -

# Restart pods
kubectl rollout restart statefulset/smartfaq-api -n smartfaq-dev
```

### Run Database Migrations Manually

```bash
# Execute migration in the pod
kubectl exec -it smartfaq-api-0 -n smartfaq-dev -- alembic upgrade head
```

## Troubleshooting

### Check Pod Status

```bash
kubectl describe pod smartfaq-api-0 -n smartfaq-dev
```

### View All Logs

```bash
# Init container logs
kubectl logs smartfaq-api-0 -c db-migration -n smartfaq-dev

# Main container logs
kubectl logs -f smartfaq-api-0 -c smartfaq-api -n smartfaq-dev
```

### Access Pod Shell

```bash
kubectl exec -it smartfaq-api-0 -n smartfaq-dev -- /bin/sh
```

### Check Database Connection

```bash
kubectl exec -it smartfaq-api-0 -n smartfaq-dev -- nc -zv postgres-smartfaq-postgresql.smartfaq-dev.svc.cluster.local 5432
```

### Check Redis Connection

```bash
kubectl exec -it smartfaq-api-0 -n smartfaq-dev -- nc -zv redis-smartfaq-master.smartfaq-dev.svc.cluster.local 6379
```

## Security Considerations

1. **Secrets Management**: Use Google Secret Manager or Sealed Secrets for production
2. **Network Policies**: Restrict pod-to-pod communication
3. **RBAC**: Implement proper role-based access control
4. **TLS**: Ensure TLS is configured for ingress
5. **Resource Limits**: Set appropriate resource requests and limits

## Cleanup

```bash
# Delete API deployment
kubectl delete -k k8s/services-dev

# Delete Redis
helm uninstall redis-smartfaq -n smartfaq-dev

# Delete PostgreSQL
helm uninstall postgres-smartfaq -n smartfaq-dev

# Delete namespace
kubectl delete namespace smartfaq-dev
```

## Notes

- The StatefulSet uses `readOnlyRootFilesystem: true` for security
- Temporary files are stored in `emptyDir` volumes
- Database migrations run automatically in init container
- Health checks are configured for readiness and liveness probes
- Images should be tagged with version numbers for production deployments
