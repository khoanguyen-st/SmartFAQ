.PHONY: help deploy-all helm build secret deploy update status logs migrate shell cleanup

# Variables
NAMESPACE := smartfaq-dev
SCRIPT := ./deploy-dev.sh

# Default target
help:
	@echo "SmartFAQ Kubernetes Deployment Commands"
	@echo ""
	@echo "Available targets:"
	@echo "  make deploy-all   - Full deployment (helm + build + secret + deploy)"
	@echo "  make helm         - Install PostgreSQL and Redis"
	@echo "  make build        - Build and push Docker image"
	@echo "  make secret       - Create/update Kubernetes secret"
	@echo "  make deploy       - Deploy API to Kubernetes"
	@echo "  make update       - Update running deployment"
	@echo "  make status       - Show deployment status"
	@echo "  make logs         - Show API logs"
	@echo "  make migrate      - Run database migrations"
	@echo "  make shell        - Open shell in API pod"
	@echo "  make cleanup      - Delete all resources"
	@echo ""

deploy-all:
	@$(SCRIPT) all

helm:
	@$(SCRIPT) helm

build:
	@$(SCRIPT) build

secret:
	@$(SCRIPT) secret

deploy:
	@$(SCRIPT) deploy

update:
	@$(SCRIPT) update

status:
	@$(SCRIPT) status

logs:
	@$(SCRIPT) logs

migrate:
	@$(SCRIPT) migrate

shell:
	@$(SCRIPT) shell

cleanup:
	@$(SCRIPT) cleanup
