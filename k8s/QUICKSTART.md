# SmartFAQ API - Quick Start Guide for Kubernetes Deployment

## Prerequisites Check

Before you begin, make sure you have:

- [ ] GKE cluster running
- [ ] `kubectl` installed and configured
- [ ] `helm` 3.x installed
- [ ] `docker` installed
- [ ] Access to Google Artifact Registry (asia-southeast1-docker.pkg.dev/enspara/smartfaq)
- [ ] Google Gemini API key

## Quick Start (5 Steps)

### Step 1: Prepare Environment File

```bash
cd k8s/services-dev
cp .env.dev.example .env.dev
```

Edit `.env.dev` and update these critical values:

- `GOOGLE_API_KEY` - Your Google Gemini API key
- `JWT_SECRET` - Generate with: `openssl rand -hex 32`
- Other settings as needed

### Step 2: Configure GCP

```bash
# Configure Docker to use GCP Artifact Registry
gcloud auth configure-docker asia-southeast1-docker.pkg.dev

# Set your project
gcloud config set project enspara

# Get cluster credentials (replace with your cluster name and zone)
gcloud container clusters get-credentials YOUR_CLUSTER_NAME --zone=asia-southeast1-a
```

### Step 3: Run Full Deployment

```bash
cd k8s
./deploy-dev.sh all
```

This will:

1. Install PostgreSQL and Redis via Helm
2. Build and push Docker image
3. Create Kubernetes secrets
4. Deploy SmartFAQ API

### Step 4: Verify Deployment

```bash
# Check status
make status

# View logs
make logs
```

### Step 5: Access API

The API will be available at: `https://api.smartfaq.dev.devplus.edu.vn`

Test health endpoint:

```bash
curl https://api.smartfaq.dev.devplus.edu.vn/health
```

## Common Tasks

### Update Code

```bash
make update
```

### Run Migrations

```bash
make migrate
```

### View Logs

```bash
make logs
```

### Access Pod Shell

```bash
make shell
```

### Check Status

```bash
make status
```

## Troubleshooting

### Pods not starting?

```bash
kubectl describe pod -n smartfaq-dev
kubectl logs -n smartfaq-dev <pod-name>
```

### Database connection issues?

```bash
# Check PostgreSQL pod
kubectl get pods -n smartfaq-dev -l app.kubernetes.io/name=postgresql

# Test connection from API pod
kubectl exec -it smartfaq-api-0 -n smartfaq-dev -- nc -zv postgres-smartfaq-postgresql.smartfaq-dev.svc.cluster.local 5432
```

### Image pull errors?

```bash
# Make sure you're authenticated
gcloud auth configure-docker asia-southeast1-docker.pkg.dev

# Check if image exists
gcloud artifacts docker images list asia-southeast1-docker.pkg.dev/enspara/smartfaq
```

## File Structure

```
k8s/
├── README.md                    # Detailed documentation
├── QUICKSTART.md               # This file
├── Makefile                    # Easy commands
├── deploy-dev.sh              # Deployment script
├── .gitignore                 # Git ignore rules
├── base/                      # Base Kubernetes configs
├── services-dev/              # Development overlay
│   ├── .env.dev.example      # Environment template
│   └── patches/              # Dev-specific patches
├── postgres/                  # PostgreSQL Helm chart
└── redis/                     # Redis Helm chart
```

## Next Steps

1. Configure TLS certificates for your domain
2. Set up monitoring and alerting
3. Configure backup strategies
4. Review security settings
5. Set up CI/CD pipeline

## Support

For detailed documentation, see [README.md](./README.md)

## Cleanup

To remove everything:

```bash
make cleanup
```

**Warning**: This will delete all data!
