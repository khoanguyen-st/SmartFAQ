# GitHub Actions CD Setup for SmartFAQ API

Hướng dẫn cấu hình Continuous Deployment (CD) với GitHub Actions và Kubernetes cho SmartFAQ API.

## 📋 Tổng Quan

CD pipeline tự động:

- **Development**: Deploy khi push code lên branch `develop`

## 🔧 Yêu Cầu

### 1. Google Cloud Platform (GCP)

- GCP Project: `enspara`
- Artifact Registry: `asia-southeast1-docker.pkg.dev/enspara/smartfaq`
- GKE Cluster đang chạy
- Service Account với quyền:
  - Artifact Registry Writer
  - GKE Developer
  - Service Account User

### 2. Kubernetes Cluster

- Namespace: `smartfaq-dev` (development)
- PostgreSQL và Redis đã được setup (qua Helm)

### 3. GitHub Repository

- Repository: `khoanguyen-st/SmartFAQ`
- Branch: `develop`

## 🔐 Cấu Hình GitHub Secrets

### Bước 1: Tạo GCP Service Account Key

```bash
# 1. Tạo service account
gcloud iam service-accounts create github-actions-cd \
  --display-name="GitHub Actions CD" \
  --project=enspara

# 2. Gán quyền
gcloud projects add-iam-policy-binding enspara \
  --member="serviceAccount:github-actions-cd@enspara.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding enspara \
  --member="serviceAccount:github-actions-cd@enspara.iam.gserviceaccount.com" \
  --role="roles/container.developer"

# 3. Tạo key
gcloud iam service-accounts keys create ~/github-actions-key.json \
  --iam-account=github-actions-cd@enspara.iam.gserviceaccount.com

# 4. Xem nội dung để copy vào GitHub Secrets
cat ~/github-actions-key.json
```

### Bước 2: Thêm Secrets vào GitHub

Vào GitHub Repository → Settings → Secrets and variables → Actions → New repository secret

#### GitHub Secrets (Required):

| Secret Name        | Mô tả                              | Ví dụ                            |
| ------------------ | ---------------------------------- | -------------------------------- |
| `GCP_SA_KEY`       | Service account key JSON từ bước 1 | `{"type":"service_account",...}` |
| `GKE_CLUSTER_NAME` | Tên GKE cluster                    | `smartfaq-cluster`               |
| `GKE_REGION`       | Region của GKE                     | `asia-southeast1`                |

### Bước 3: Tạo Kubernetes Secrets

Environment variables được lưu trữ trong Kubernetes Secrets, không còn ở GitHub Secrets.

#### Option 1: Sử dụng script tự động

```bash
./scripts/create-k8s-secrets.sh
```

Script sẽ hỏi các thông tin và tự động tạo secret trong K8s.

#### Option 2: Tạo thủ công

```bash
kubectl create secret generic smartfaq-api-env \
  --from-literal=DATABASE_URL="postgresql://user:pass@postgres-smartfaq-postgresql.smartfaq-dev.svc.cluster.local:5432/smartfaq" \
  --from-literal=REDIS_URL="redis://redis-smartfaq-master.smartfaq-dev.svc.cluster.local:6379/0" \
  --from-literal=SECRET_KEY="your-secret-key-here" \
  --from-literal=OPENAI_API_KEY="sk-..." \
  --from-literal=ANTHROPIC_API_KEY="sk-ant-..." \
  --from-literal=GEMINI_API_KEY="AIza..." \
  --from-literal=CORS_ORIGINS="https://admin.smartfaq.dev.devplus.edu.vn,https://chat.smartfaq.dev.devplus.edu.vn" \
  --from-literal=ALLOWED_DOMAINS="devplus.edu.vn,greenwich.edu.vn" \
  --from-literal=ENVIRONMENT="development" \
  -n smartfaq-dev
```

#### Verify secret

```bash
# Kiểm tra secret đã được tạo
kubectl get secret smartfaq-api-env -n smartfaq-dev

# Xem các keys trong secret
kubectl get secret smartfaq-api-env -n smartfaq-dev -o jsonpath='{.data}' | jq 'keys'
```

## 🚀 Sử Dụng

### Development Deployment

**Tự động trigger khi:**

- Push code lên branch `develop`
- Có thay đổi trong `apps/api/` hoặc `k8s/`

**Manual trigger:**

```bash
# Push code lên develop
git checkout develop
git add .
git commit -m "feat: new feature"
git push origin develop
```

**Image tag format:** `dev-{short-sha}-{timestamp}`

- Ví dụ: `dev-a1b2c3d-20241124-143022`
- Also tagged: `dev-latest`

## 📊 Workflow Steps

### Build Job

1. ✅ Checkout code
2. ✅ Authenticate với GCP
3. ✅ Configure Docker cho Artifact Registry
4. ✅ Build Docker image với Buildx (với cache)
5. ✅ Push image lên Artifact Registry với multiple tags
6. ✅ Output image info vào GitHub Summary

### Deploy Job

1. ✅ Checkout code
2. ✅ Authenticate với GCP
3. ✅ Get GKE credentials
4. ✅ Install kubectl và kustomize
5. ✅ Update kustomization với image tag mới
6. ✅ Deploy với kustomize
7. ✅ Wait for rollout complete (timeout: 10 phút)
8. ✅ Verify deployment
9. ✅ Check pod health & logs

### Notify Job

- ✅ Summary deployment status
- ✅ Show image info, version, URLs
- ✅ Fail workflow nếu deployment failed

## 🔍 Monitoring & Debugging

### Xem Workflow Status

1. Vào GitHub Repository → Actions
2. Chọn workflow run muốn xem
3. Xem Summary để có thông tin deployment

### Check Deployment Status

```bash
kubectl get pods -n smartfaq-dev -l app=smartfaq-api
kubectl logs -f statefulset/smartfaq-api -n smartfaq-dev
```

### Rollback (nếu có vấn đề)

```bash
kubectl rollout undo statefulset/smartfaq-api -n smartfaq-dev

# Rollback về version cụ thể
kubectl rollout undo statefulset/smartfaq-api -n smartfaq-dev --to-revision=2
```

### View Rollout History

```bash
kubectl rollout history statefulset/smartfaq-api -n smartfaq-dev
```

## 🎯 Best Practices

### 1. Development Workflow

```bash
# 1. Tạo feature branch từ develop
git checkout develop
git pull origin develop
git checkout -b feature/new-feature

# 2. Develop & test locally
# ... code changes ...

# 3. Push lên GitHub
git add .
git commit -m "feat: add new feature"
git push origin feature/new-feature

# 4. Tạo PR vào develop
# Review & merge PR

# 5. Auto deploy lên dev environment
# Workflow tự động chạy khi merge vào develop
```

### 2. Database Migrations

- Migrations tự động chạy trong init container
- Kiểm tra migration logs:

```bash
kubectl logs <pod-name> -c db-migration -n smartfaq-dev
```

## 🔒 Security Checklist

- ✅ Service Account có minimal permissions
- ✅ Secrets không commit vào code
- ✅ Production có environment protection
- ✅ Container chạy với non-root user
- ✅ Read-only root filesystem
- ✅ Resource limits được set
- ✅ Network policies được apply
- ✅ HTTPS only cho ingress

## 📝 Troubleshooting

### Workflow fails tại "Build and push"

**Lỗi:** `Error: failed to authorize`

**Giải pháp:**

1. Kiểm tra `GCP_SA_KEY` secret có đúng format JSON không
2. Verify service account có quyền `roles/artifactregistry.writer`

### Workflow fails tại "Deploy to Kubernetes"

**Lỗi:** `Error: failed to get credentials`

**Giải pháp:**

1. Kiểm tra `GKE_CLUSTER_NAME` và `GKE_REGION` secrets
2. Verify service account có quyền `roles/container.developer`

### Pod không start được

**Kiểm tra:**

```bash
kubectl describe pod <pod-name> -n smartfaq-dev
kubectl logs <pod-name> -c db-migration -n smartfaq-dev
```

**Common issues:**

- Secret not found → Chạy `./scripts/create-k8s-secrets.sh`
- Database connection failed → Check `DATABASE_URL` in K8s secret
- Migration failed → Check migration logs
- Image pull failed → Check Artifact Registry permissions

### Health check fails

**Kiểm tra:**

```bash
# Port forward để test local
kubectl port-forward svc/smartfaq-api 8000:8000 -n smartfaq-dev

# Test health endpoint
curl http://localhost:8000/health
```

## 🔗 Related Links

- [Kubernetes Deployment Guide](../k8s/README.md)
- [API Development Guide](../apps/api/DEVELOPMENT.md)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Google Artifact Registry](https://cloud.google.com/artifact-registry/docs)
- [GKE Documentation](https://cloud.google.com/kubernetes-engine/docs)

## 📞 Support

Nếu gặp vấn đề, hãy:

1. Check workflow logs trên GitHub Actions
2. Check pod logs trên Kubernetes
3. Tạo issue trên GitHub repository
4. Liên hệ team DevOps
