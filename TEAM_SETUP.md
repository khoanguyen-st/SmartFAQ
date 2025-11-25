# 🚀 Setup Guide for Team Members

## Quick Setup (All Platforms)

### 1. Clone Repository

```bash
git clone https://github.com/khoanguyen-st/SmartFAQ.git
cd SmartFAQ
```

### 2. Install Dependencies

#### macOS/Linux:

```bash
# Install Python (if not installed)
python3 --version  # Check if Python 3.11+ is installed

# macOS (Homebrew)
brew install python@3.11

# Ubuntu/Debian
sudo apt update
sudo apt install python3.11 python3.11-venv python3-pip

# Install Node.js dependencies (for hooks)
npm install
```

#### Windows:

```powershell
# 1. Install Python from https://www.python.org/downloads/
#    ⚠️ IMPORTANT: Check "Add Python to PATH" during installation

# 2. Verify installation
python --version
# or
py --version

# 3. Install Node.js dependencies
npm install
```

### 3. Setup Python Environment

```bash
cd apps/api

# Create virtual environment
python3 -m venv venv   # macOS/Linux
python -m venv venv    # Windows

# Activate virtual environment
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate     # Windows

# Install dependencies
pip install -e ".[dev]"
```

### 4. Configure Git Hooks

```bash
# From project root
npx husky install

# Make hooks executable (macOS/Linux only)
chmod +x .husky/pre-push
```

## ✅ Verify Setup

### Test Python Detection:

```bash
cd apps/api

# Should work on all platforms
make migrate-check
```

**Expected output:**

```
✅ Single head found: dac48aab7df1
✅ Migration check passed - single head
```

### Test Git Hook:

```bash
# Create a test commit
git add .
git commit -m "test: verify setup"

# Try to push (hook will run)
git push
# Should see: "🔍 Checking for multiple migration heads..."
```

## 🔧 Platform-Specific Notes

### macOS

- Python command: `python3`
- Default shell: `zsh`
- Git hooks work out of the box

### Linux (Ubuntu/Debian)

- Python command: `python3`
- May need to install `python-is-python3` package
- Git hooks work out of the box

### Windows

- Python command: `python` or `py`
- Use **Git Bash** for best compatibility
- PowerShell and CMD also supported
- Make sure Python is in PATH

## 🐛 Common Issues

### Issue 1: "python: command not found"

**macOS/Linux:**

```bash
# Check if python3 exists
which python3

# If not installed
brew install python@3.11  # macOS
sudo apt install python3.11  # Ubuntu/Debian
```

**Windows:**

```powershell
# Check if Python is in PATH
python --version
py --version

# If not found:
# 1. Reinstall Python from python.org
# 2. Check "Add Python to PATH" option
# 3. Restart terminal
```

### Issue 2: "husky - DEPRECATED" Warning

This is just a warning for future Husky v10. The hooks still work fine.

**To fix (optional):**

```bash
# Update to latest husky
npm install husky@latest
npx husky init
```

### Issue 3: Hook Doesn't Run on Windows

**Solution 1 - Use Git Bash:**

```bash
# Download Git for Windows: https://git-scm.com/download/win
# Use Git Bash instead of PowerShell/CMD
```

**Solution 2 - Manual Check:**

```bash
cd apps/api
python scripts/check_migrations.py --check
```

### Issue 4: Permission Denied (macOS/Linux)

```bash
# Make hooks executable
chmod +x .husky/pre-push
chmod +x apps/api/scripts/check_migrations.py
```

## 📝 Development Workflow

### Creating Migrations

```bash
cd apps/api

# 1. Always pull latest first
git pull origin develop

# 2. Check migration status
make migrate-check

# 3. Create your migration
make migrate-create MSG="add user profile"

# 4. Review the generated file
ls alembic/versions/

# 5. Commit and push
git add .
git commit -m "feat: add user profile migration"
git push  # Hook will auto-check
```

### If Multiple Heads Detected

```bash
# Hook will show this error:
# ❌ Multiple migration heads detected!
# Please merge them before pushing

# Solution:
cd apps/api
make migrate-merge

# Review the merge file
git add alembic/versions/*_merge_*.py
git commit -m "chore: merge migration heads"
git push
```

## 🆘 Getting Help

### Check Documentation

- [Migration Management Guide](docs/MIGRATION_MANAGEMENT.md)
- [Cross-Platform Python Guide](docs/PYTHON_CROSS_PLATFORM.md)
- [API Development Guide](apps/api/DEVELOPMENT.md)

### Run Demo

```bash
cd apps/api
python3 scripts/demo_migration_conflict.py  # macOS/Linux
python scripts/demo_migration_conflict.py   # Windows
```

### Ask Team

If you encounter issues:

1. Check if others have the same issue
2. Share exact error message
3. Mention your OS and Python version

## 🎯 Quick Reference

### Python Commands by Platform

| Platform | Command   | Alternative           |
| -------- | --------- | --------------------- |
| macOS    | `python3` | `python` (if aliased) |
| Linux    | `python3` | -                     |
| Windows  | `python`  | `py`                  |

### Essential Commands

```bash
# Check Python version
python3 --version  # macOS/Linux
python --version   # Windows

# Migration commands (from apps/api/)
make migrate-check    # Check for conflicts
make migrate-merge    # Auto-merge conflicts
make migrate          # Run migrations
make migrate-create   # Create new migration

# Git hooks
git push              # Runs pre-push hook automatically
git push --no-verify  # Skip hook (NOT recommended!)
```

## ✨ Tips

1. **Always run `make migrate-check` before creating new migrations**
2. **Pull from develop frequently** to avoid conflicts
3. **Use Git Bash on Windows** for best compatibility
4. **Keep Python 3.11+** for consistent behavior
5. **Don't skip the pre-push hook** - it catches issues early!

---

**Need help?** Contact the team or check [MIGRATION_AUTO_CHECK.md](apps/api/MIGRATION_AUTO_CHECK.md) for detailed troubleshooting.
