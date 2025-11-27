# 🔄 Database Migration Management

## Tự Động Phát Hiện & Xử Lý Migration Conflicts

Hệ thống SmartFAQ đã tích hợp giải pháp tự động phát hiện và xử lý migration conflicts khi làm việc với nhiều nhánh song song.

## 🎯 Vấn Đề

Khi nhiều developers làm việc song song:

```
develop (migration A)
  ├─→ feature-1 (migration B từ A)
  └─→ feature-2 (migration C từ A)

→ Khi merge cả 2 → Multiple heads: B và C cùng parent A
```

## ✨ Giải Pháp Tự Động

### 1️⃣ Pre-Push Hook (Local)

```bash
# Tự động chạy khi git push
git push
# → 🔍 Checking for multiple migration heads...
# → ❌ Block nếu phát hiện conflict
```

### 2️⃣ CI Check (GitHub Actions)

```yaml
# Mỗi PR/push đều check
- Check migration heads
  → ✅ Pass: Single head
  → ❌ Fail: Multiple heads detected
```

### 3️⃣ Auto-Merge Command

```bash
cd apps/api
make migrate-merge
# → Tự động merge tất cả heads
# → Tạo merge revision
# → Verify thành công
```

## 🚀 Quick Start

### Cài Đặt Hook

```bash
# Hooks đã có sẵn, chỉ cần enable
npm install  # Cài husky
npx husky install  # Enable hooks
```

### Các Lệnh Cơ Bản

```bash
cd apps/api

# Kiểm tra migration status
make migrate-check

# Tự động merge conflicts
make migrate-merge

# Xem lịch sử migrations
make migrate-history

# Validate migration chain
make migrate-validate
```

## 📋 Workflow Thực Tế

### ✅ Workflow Chuẩn

```bash
# 1. Pull code mới nhất
git checkout develop
git pull

# 2. Kiểm tra migrations
cd apps/api
make migrate-check

# 3. Tạo migration mới (nếu cần)
make migrate-create MSG="add user settings"

# 4. Push (auto-check sẽ chạy)
git add .
git commit -m "feat: add user settings"
git push  # ← Pre-push hook tự động check
```

### 🔧 Xử Lý Conflicts

```bash
# Khi phát hiện multiple heads

# 1. Check status
make migrate-check
# Output: ⚠️  Multiple heads detected (2)

# 2. Auto-merge
make migrate-merge
# Output: ✅ Merge revision created!

# 3. Commit merge revision
git add alembic/versions/
git commit -m "chore: merge migration heads"
git push
```

## 🛡️ Các Lớp Bảo Vệ

| Lớp               | Thời Điểm      | Hành Động                  |
| ----------------- | -------------- | -------------------------- |
| **Pre-push Hook** | Trước khi push | Block push nếu có conflict |
| **CI Check**      | Mỗi PR/push    | Fail CI nếu phát hiện      |
| **CD Validation** | Trước deploy   | Verify clean state         |

## 📖 Documentation

- **Chi tiết đầy đủ**: [apps/api/MIGRATION_AUTO_CHECK.md](apps/api/MIGRATION_AUTO_CHECK.md)
- **API README**: [apps/api/README.md](apps/api/README.md)
- **Demo Script**: `python apps/api/scripts/demo_migration_conflict.py`

## 🧪 Testing

### Test Script

```bash
cd apps/api
python scripts/check_migrations.py --help
python scripts/demo_migration_conflict.py
```

### Manual Testing

```bash
# Check hiện tại
make migrate-check

# Simulate conflict (for testing)
# 1. Create branch-a and add migration
# 2. Create branch-b and add migration
# 3. Merge both → Multiple heads
# 4. Run make migrate-merge
```

## 🎓 Key Commands

```bash
# Navigation
cd apps/api

# Checks
make migrate-check         # Kiểm tra multiple heads
make migrate-validate      # Validate chain integrity

# Actions
make migrate              # Run migrations
make migrate-merge        # Auto-merge conflicts
make migrate-create MSG="..." # Create new migration

# Info
make migrate-history      # View history
alembic current          # Current revision
alembic heads            # List all heads
```

## ⚡ Best Practices

### ✅ DO

- Luôn pull develop trước khi tạo migration
- Chạy `migrate-check` trước khi push
- Review merge revisions trước commit
- Test migrations trên clean DB

### ❌ DON'T

- Không skip pre-push hook (`--no-verify`)
- Không ignore CI failures
- Không delete migrations đã push
- Không manual edit revision IDs

## 🔍 Troubleshooting

### Hook không chạy?

```bash
npx husky install
chmod +x .husky/pre-push
```

### "python: command not found"?

Hệ thống tự động detect `python3`/`python`. Nếu vẫn lỗi:

```bash
# Check Python đã cài chưa
python3 --version  # macOS/Linux
python --version   # Windows/some Linux
py --version       # Windows Python Launcher
```

**Windows users**: Đảm bảo Python đã được thêm vào PATH khi cài đặt.

📖 **Chi tiết cross-platform**: [PYTHON_CROSS_PLATFORM.md](PYTHON_CROSS_PLATFORM.md)

### CI fails nhưng local pass?

```bash
# Check database state
alembic current
alembic heads

# Reset if needed
alembic downgrade base
alembic upgrade head
```

### Merge revision lỗi?

```bash
# Delete và thử lại
rm alembic/versions/*_merge_*.py
make migrate-merge
```

## 💡 Tips

1. **Alias cho nhanh:**

```bash
alias mig="cd apps/api && make migrate-check && cd ../.."
```

2. **VS Code Task:**

```json
{
  "label": "Check Migrations",
  "type": "shell",
  "command": "cd apps/api && make migrate-check"
}
```

## 📊 Monitoring

### Local

- Pre-push hook notifications
- Make commands output

### CI/CD

- GitHub Actions checks
- Deployment logs
- PR status checks

---

**📌 Lưu ý:** Hệ thống này đảm bảo migration history luôn clean và không có conflicts khi deploy!
