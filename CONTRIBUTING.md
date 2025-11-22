# Contributing to SmartFAQ

> **Cross-Platform Support:** This project works on macOS, Linux, and Windows. All setup scripts and git hooks are designed to be cross-platform compatible.

## 🚀 Quick Start for New Team Members

### 1. Initial Setup

**macOS/Linux:**
```bash
# Clone the repository
git clone https://github.com/khoanguyen-st/SmartFAQ.git
cd SmartFAQ

# Run setup script
./scripts/setup.sh
```

**Windows:**
```powershell
# Clone the repository
git clone https://github.com/khoanguyen-st/SmartFAQ.git
cd SmartFAQ

# Install dependencies manually
yarn install
```

The setup will:

- ✅ Install Node.js dependencies (Yarn)
- ✅ Setup Husky git hooks
- ✅ Check Python environment

### 2. Python Environment Setup (Required for Git Hooks)

If you plan to commit Python code, you **must** set up the API virtual environment:

**macOS/Linux:**
```bash
cd apps/api
python3 -m venv venv
source venv/bin/activate
pip install -e ".[dev]"
```

**Windows (PowerShell):**
```powershell
cd apps\api
python -m venv venv
venv\Scripts\activate
pip install -e ".[dev]"
```

**Windows (CMD):**
```cmd
cd apps\api
python -m venv venv
venv\Scripts\activate.bat
pip install -e ".[dev]"
```

This installs linting tools (ruff, black) needed by pre-commit hooks.

> **Note:** The pre-commit hooks use a cross-platform Node.js script (`scripts/lint-python.cjs`) that automatically detects your OS and uses the correct venv path.

### 3. Environment Configuration

```bash
# For local development
cp .env.example .env

# For Docker Compose
cp .env.docker.example .env.docker

# Edit the files with your settings
```

---

## 📝 Git Workflow

### Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, missing semi colons, etc)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance
- `perf`: Performance improvement
- `ci`: CI/CD changes

### Pre-commit Hooks

Commits automatically run:

- **ESLint** + **Prettier** for TypeScript/JavaScript
- **Ruff** + **Black** for Python (requires venv setup)

**Troubleshooting:**

If you get errors like:

```
/Library/Developer/CommandLineTools/usr/bin/python3: No module named ruff
```

You need to set up the Python venv (see step 2 above).

---

## 🔧 Development Commands

### Frontend (Web Apps)

```bash
# Install dependencies
yarn install

# Web Student (Student Chat)
cd apps/web-student
yarn dev          # http://localhost:5173

# Web Admin (Admin Dashboard)
cd apps/web-admin
yarn dev          # http://localhost:5174

# Linting & Formatting
yarn lint         # Check for errors
yarn lint --fix   # Auto-fix errors
yarn format       # Format code
```

### Backend (API)

**macOS/Linux:**
```bash
cd apps/api

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -e ".[dev]"

# Run development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Database migrations
alembic upgrade head
alembic revision --autogenerate -m "description"

# Linting & Formatting
ruff check .
ruff check --fix .
black .
```

**Windows:**
```powershell
cd apps\api

# Activate virtual environment (PowerShell)
venv\Scripts\activate
# Or CMD: venv\Scripts\activate.bat

# Install dependencies
pip install -e ".[dev]"

# Run development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Database migrations
alembic upgrade head
alembic revision --autogenerate -m "description"

# Linting & Formatting
ruff check .
ruff check --fix .
black .
```

### Docker Compose (Full Stack)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild after code changes
docker-compose up -d --build
```

---

## 🏗️ Project Structure

```
SmartFAQ/
├── apps/
│   ├── api/              # FastAPI backend
│   │   ├── venv/         # Python virtual environment (gitignored)
│   │   ├── app/          # Application code
│   │   └── pyproject.toml
│   ├── web-admin/        # React admin dashboard
│   │   ├── src/
│   │   └── package.json
│   └── web-student/      # React student chat
│       ├── src/
│       └── package.json
├── .husky/               # Git hooks
├── scripts/              # Helper scripts
└── package.json          # Root workspace config
```

---

## 🐛 Troubleshooting

### "yarn not found"

**macOS/Linux:**
```bash
# Install Yarn globally
npm install -g yarn

# Or use corepack (recommended)
corepack enable
```

**Windows:**
```powershell
# Install Yarn globally
npm install -g yarn

# Or use corepack (recommended)
corepack enable
```

### "No module named ruff" or "black not found"

**macOS/Linux:**
```bash
cd apps/api
source venv/bin/activate
pip install -e ".[dev]"
```

**Windows (PowerShell):**
```powershell
cd apps\api
venv\Scripts\activate
pip install -e ".[dev]"
```

**Windows (CMD):**
```cmd
cd apps\api
venv\Scripts\activate.bat
pip install -e ".[dev]"
```

### "Pre-commit hook failed"

Make sure you have:

1. ✅ Installed Node.js dependencies (`yarn install`)
2. ✅ Set up Python venv if committing Python files
3. ✅ Fixed all linting errors

**Note:** Pre-commit hooks work on all platforms (macOS, Linux, Windows) thanks to the cross-platform `scripts/lint-python.cjs` script.

To bypass hooks (not recommended):

```bash
git commit --no-verify -m "your message"
```

### Windows-specific: "cannot be loaded because running scripts is disabled"

If you get this error when activating venv in PowerShell:

```powershell
# Run as Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Then try activating venv again.

### "bash: ./scripts/setup.sh: Permission denied" (macOS/Linux)

```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

### Docker build fails

```bash
# Clean up Docker cache
docker-compose down -v
docker system prune -a

# Rebuild from scratch
docker-compose build --no-cache
docker-compose up -d
```

---

## 📚 Additional Resources

- [README.md](./README.md) - Main documentation
- [.husky/README.md](./.husky/README.md) - Git hooks details
- [apps/api/README.md](./apps/api/README.md) - API documentation

---

## 🤝 Getting Help

If you encounter issues:

1. Check this guide first
2. Search existing GitHub issues
3. Ask in the team Slack/Discord
4. Create a new GitHub issue with detailed information

---

## ✅ Checklist for New Contributors

- [ ] Cloned repository
- [ ] Ran `./scripts/setup.sh`
- [ ] Set up Python venv (`apps/api/venv`)
- [ ] Configured `.env` file
- [ ] Can run frontend (`yarn dev`)
- [ ] Can run backend (`uvicorn app.main:app --reload`)
- [ ] Successfully made a test commit
- [ ] Read coding standards and commit message format

Welcome to the team! 🎉
