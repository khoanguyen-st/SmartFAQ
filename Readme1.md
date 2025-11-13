# Greenwich SmartFAQ

**Greenwich SmartFAQ** is an on-premise knowledge and support platform developed for **Greenwich University**.
The system integrates **document management**, a **RAG (Retrieval-Augmented Generation) chatbot**, and an **admin dashboard**, enabling the Student Affairs Office to provide 24/7 support.

---

## 🚀 Quick Start for Teammates

**Just pulled latest changes?** Run this one command:

```bash
./scripts/update.sh
# or
make update
```

This will automatically:
- ✅ Install/update dependencies
- ✅ Setup Husky pre-commit hooks
- ✅ Configure git hooks

See [UPDATE_GUIDE.md](UPDATE_GUIDE.md) for detailed instructions.

---

## Objectives

- **Intelligent FAQ System**: Provides verified answers with **role-based access control (RBAC)**
- **Document Management**: Organized document management with versioning and background processing
- **AI-Powered Responses**: AI-based answers using **LangChain** and **ChromaDB**, featuring a smart fallback mechanism
- **System Monitoring**: Dashboard for tracking metrics, logs, and runtime adjustments

---

## Technologies Used

### Backend

- **FastAPI** – High-performance Python web framework
- **LangChain** – Framework for developing LLM-based applications
- **ChromaDB** – Vector database for similarity search
- **PostgreSQL** – Stores metadata and relational data

### Frontend

- **React 19** – UI library built with Vite
- **Web Student** – Chat interface for students
- **Web Admin** – Administrative dashboard

### Infrastructure

- **Docker & Docker Compose** – Container orchestration
- **Nginx** – Reverse proxy and load balancing
- **GitHub Actions** – CI/CD pipeline
- **JSON Logging** – Structured logging for easier analysis

---

## Directory Structure

```
SmartFAQ/
├── apps/                   # Main applications
│   ├── api/               # FastAPI backend
│   │   ├── app/
│   │   │   ├── api/       # REST API endpoints
│   │   │   ├── core/      # Config, security, database
│   │   │   ├── models/    # SQLAlchemy models
│   │   │   ├── schemas/   # Pydantic schemas
│   │   │   ├── services/  # Business logic
│   │   │   └── rag/       # RAG pipeline integration
│   │   └── requirements.txt
│   ├── web-student/       # Student interface
│   └── web-admin/         # Admin dashboard
├── packages/              # Shared libraries
│   ├── ui-components/     # Reusable UI components
│   └── eslint-config/     # Shared ESLint config
├── deploy/                # Deployment files
│   ├── docker compose.yml
│   └── nginx/             # Nginx configuration
├── docs/                  # Project documentation
│   ├── spec.md            # Functional requirements
│   ├── srs.md             # Software Requirements Specification
│   ├── OPENAPI.yaml       # API documentation
│   ├── rtm.md             # Requirements Traceability Matrix
│   └── test-plan.md       # Test planning
├── .env.example           # Environment variable template
├── Makefile               # Development shortcuts
└── README.md
```

---

## System Requirements

- **Docker** ≥ 20.10
- **Docker Compose** ≥ 2.0
- **Node.js** ≥ 18.x (for frontend development)
- **Yarn** ≥ 1.22.0 (required - this project uses Yarn for package management)
- **Python** ≥ 3.11 (for backend development)
- **RAM** ≥ 8GB recommended
- **Disk Space** ≥ 10GB available

---

## Package Manager

**⚠️ This project uses Yarn for package management.**

Do NOT use npm or pnpm. The project is configured to enforce Yarn usage.

### Installing Yarn

```bash
# Option 1: via npm (one-time)
npm install -g yarn

# Option 2: via corepack (recommended)
corepack enable

# Verify installation
yarn --version
```

---

## Setup Guide

### Option 1: Using Docker Compose (Recommended)

#### 1. Clone Repository

```bash
git clone https://github.com/your-org/SmartFAQ.git
cd SmartFAQ
```

#### 2. Install Dependencies (Frontend only)

```bash
# This project uses Yarn - DO NOT use npm or pnpm
yarn install

# Or use the setup script
chmod +x scripts/setup.sh
./scripts/setup.sh
```

#### 2. Configure Environment

```bash
# Copy sample config
cp .env.example .env (for local development)
cp .env.docker.example .env.docker (for Docker Compose)

# Edit environment variables
nano .env (or .env.docker)
# or
vim .env (or .env.docker)
```

**Important Variables in `.env`:**

```env
# Database
POSTGRES_USER=smartfaq
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=smartfaq

# API
API_SECRET_KEY=your_secret_key_here_min_32_chars
API_CORS_ORIGINS=http://localhost:5173,http://localhost:5174

# LLM Configuration
GOOGLE_API_KEY=sk-your-google-api-key
# or use a local LLM

# ChromaDB
CHROMA_PERSIST_DIRECTORY=./data/chromadb
```

#### 3. Start the Entire Stack

```bash
docker compose up -d
docker compose logs -f
docker compose ps
```

#### 4. Initialize Database

```bash
docker compose exec api alembic upgrade head
docker compose exec api python scripts/seed_data.py  # Optional: seed sample data
```

#### 5. Access the Application

- **Student Chat**: [http://localhost:3000](http://localhost:5173)
- **Admin Dashboard**: [http://localhost:3001](http://localhost:5174)
- **API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

---

### Option 2: Manual Development Setup

#### Backend Setup

```bash
cd apps/api
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Configure `.env`, then start PostgreSQL and ChromaDB via Docker:

```bash
docker run -d \
  --name smartfaq-postgres \
  -e POSTGRES_USER=smartfaq \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=smartfaq_db \
  -p 5432:5432 \
  postgres:15-alpine

docker run -d \
  --name smartfaq-chromadb \
  -p 8001:8000 \
  -v $(pwd)/data/chromadb:/chroma/chroma \
  chromadb/chroma:latest
```

Then migrate and start the API server:

```bash
alembic upgrade head
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend Setup – Student Chat

```bash
cd apps/web-student
yarn install  # Use Yarn, not npm
cp .env.example .env.local
# Edit VITE_API_URL=http://localhost:8000
yarn dev
```

#### Frontend Setup – Admin Dashboard

```bash
cd apps/web-admin
yarn install  # Use Yarn, not npm
cp .env.example .env.local
yarn dev
```

---

## Service Management

### Using Docker Compose

```bash
docker compose up -d
docker compose down
docker compose restart api
docker compose logs -f api
docker compose up -d --build
docker compose down -v
```

---

## Development Commands

```bash
# Frontend (from root)
yarn install              # Install all dependencies
yarn dev:admin           # Start admin dashboard
yarn dev:student         # Start student chat
yarn build               # Build all projects
yarn lint                # Lint all projects

# Frontend (in specific app)
cd apps/web-student
yarn test
yarn build
yarn lint

# Backend
cd apps/api
pytest
black app/
isort app/
flake8 app/
```

---

## Security & Compliance

- **Authentication:** JWT with bcrypt password hashing
- **Authorization:** Role-Based Access Control (RBAC)
  - **Student:** Access chat and FAQ
  - **Staff:** Manage and moderate documents
  - **Admin:** Full system access

- **CORS:** Whitelisted domain configuration
- **Rate Limiting:** Protects API from abuse
- **Backups:** Automatic daily database backups
- **Logging:** JSON structured logs for audit trail

---

## Performance

- **Target Latency:** P95 ≤ 3 seconds
- **Concurrent Users:** ≥ 1,000
- **Availability:** 99.5% uptime
- **Vector Search:** Optimized ChromaDB indexing

---

## Troubleshooting

### Database Connection Issues

```bash
docker ps | grep postgres
docker logs smartfaq-postgres
docker exec -it smartfaq-postgres psql -U smartfaq -d smartfaq_db
```

### ChromaDB Unavailable

```bash
docker restart smartfaq-chromadb
curl http://localhost:8001/api/v1/heartbeat
```

### Frontend Cannot Connect to API

```bash
# Verify CORS and API URL configuration
# Check API status:
curl http://localhost:8000/health
```

---

## Development Workflow

1. **Create a feature branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Develop and test locally**
   - Backend: add tests under `apps/api/tests/`
   - Frontend: use React Testing Library for component tests

3. **Commit using conventional commits**

   ```bash
   git commit -m "feat: [FAQ-1] add new FAQ category endpoint"
   ```

4. **Push and create a Pull Request**
   - CI/CD will automatically run tests and linting
   - Code review required before merge

---

## Detailed Documentation

- **[Functional Specification](docs/spec.md)** – Feature details and use cases
- **[Software Requirements](docs/srs.md)** – Non-functional requirements and constraints
- **[API Documentation](docs/OPENAPI.yaml)** – OpenAPI 3.0 specification
- **[Requirements Traceability](docs/rtm.md)** – Mapping requirements to implementation
- **[Test Plan](docs/test-plan.md)** – Test strategy and cases

---

## Contribution

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push to branch
5. Open a Pull Request
