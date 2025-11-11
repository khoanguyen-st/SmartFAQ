.PHONY: install update up down lint format test api-run web-student web-admin docs help

# Help command - shows all available commands
help:
	@echo "SmartFAQ Development Commands"
	@echo "=============================="
	@echo ""
	@echo "Setup & Update:"
	@echo "  make install       - Install all dependencies (first time)"
	@echo "  make update        - Quick update after git pull (recommended)"
	@echo ""
	@echo "Development:"
	@echo "  make dev           - Start all services (Docker)"
	@echo "  make api-run       - Run API server locally"
	@echo "  make web-student   - Run student UI locally"
	@echo "  make web-admin     - Run admin UI locally"
	@echo ""
	@echo "Code Quality:"
	@echo "  make lint          - Run linters on all code"
	@echo "  make format        - Format all code"
	@echo "  make test          - Run all tests"
	@echo ""
	@echo "Docker:"
	@echo "  make up            - Start Docker services"
	@echo "  make down          - Stop Docker services"
	@echo "  make restart       - Restart Docker services"
	@echo ""
	@echo "Documentation:"
	@echo "  make docs          - Build API documentation"
	@echo ""

# Quick update script (for teammates after git pull)
update:
	@echo "🚀 Running quick update..."
	@./scripts/update.sh

# First-time installation
install:
	@echo "📦 Installing dependencies..."
	@if command -v yarn >/dev/null 2>&1; then \
		yarn install; \
	else \
		echo "⚠️  Yarn not found! Installing..."; \
		npm install -g yarn; \
		yarn install; \
	fi
	@echo "✅ Installation complete!"
	@echo "Run 'make dev' to start development"

# Docker commands
up:
	docker compose up --build -d
	@echo "✅ Services started!"
	@echo "- Student UI: http://localhost:5173"
	@echo "- Admin UI: http://localhost:5174"
	@echo "- API: http://localhost:8000"

down:
	docker compose down

restart:
	docker compose restart

# Development commands
dev: up

api-run:
	cd apps/api && uvicorn app.main:app --reload

web-student:
	yarn workspace @smartfaq/web-student dev

web-admin:
	yarn workspace @smartfaq/web-admin dev

# Code quality
lint:
	@echo "🔍 Running linters..."
	@yarn lint

format:
	@echo "✨ Formatting code..."
	@yarn format

# Testing
test:
	@echo "🧪 Running tests..."
	@cd apps/api && pytest tests
	@yarn workspaces foreach -pt run test

docs:
	npx @redocly/cli build-docs docs/OPENAPI.yaml --output docs/api.html
