# Greenwich SmartFAQ

Greenwich SmartFAQ is an on-premise knowledge and support platform for Greenwich University. It combines a document management system, a retrieval-augmented chatbot, and administrative dashboards to help the Student Affairs Department deliver 24/7 assistance.

## Goals
- Provide authenticated FAQ answers with RBAC-secured administrative access.
- Manage institutional documents with versioning and background processing.
- Serve AI-driven responses backed by LangChain and ChromaDB, with smart fallback workflows.
- Offer monitoring dashboards for metrics, logs, and system tuning.

## Stack Overview
- **API**: FastAPI, LangChain, ChromaDB, PostgreSQL (metadata)
- **Frontends**: React 19 (Vite) for student chat and admin dashboard
- **Infra**: Docker, Nginx reverse proxy, GitHub Actions CI, JSON logging

## Getting Started
1. Clone the repository and copy environment variables:
   ```sh
   cp .env.example .env
   ```
2. Install dependencies:
   ```sh
   make install
   ```
3. Launch the stack (requires Docker):
   ```sh
   make up
   ```

## Repository Layout
```
apps/              # Application services
  api/             # FastAPI backend
  web-student/     # Student-facing chat application
  web-admin/       # Admin dashboard
packages/          # Shared configuration and UI library
deploy/            # Docker Compose and Nginx assets
docs/              # Specification, OpenAPI, RTM, test plan
```

Detailed functional and non-functional requirements are tracked in `docs/spec.md` and `docs/srs.md`. The OpenAPI stub lives in `docs/OPENAPI.yaml`.

## Security & Compliance
- JWT authentication with bcrypt-hashed credentials and role-based access control
- CORS whitelisting, rate limiting, daily backups, and JSON structured logging
- P95 latency target ≤ 3 seconds under ≥ 1,000 concurrent users

## Next Steps
- Flesh out routers, services, and data access layers under `apps/api/app`
- Implement RAG pipeline integrations in `app/rag`
- Build UI components and connect to API endpoints in the Vite apps
- Extend RTM and Test Plan documents as features mature
