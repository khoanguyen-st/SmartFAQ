.PHONY: help install install-dev test clean run migrate

help:  ## Hiển thị help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

install:  ## Cài đặt dependencies (production)
	pip install -e .

install-dev:  ## Cài đặt dependencies (development)
	pip install -e ".[dev]"

test:  ## Chạy tests
	pytest tests/ -v

test-cov:  ## Chạy tests với coverage
	pytest tests/ --cov=app --cov-report=html --cov-report=term

clean:  ## Xóa cache và build artifacts
	rm -rf __pycache__ .pytest_cache .ruff_cache .coverage htmlcov/
	rm -rf *.egg-info build/ dist/
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete

run:  ## Chạy development server
	uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

migrate:  ## Chạy database migrations
	alembic upgrade head

migrate-create:  ## Tạo migration mới (sử dụng: make migrate-create MSG="message")
	alembic revision --autogenerate -m "$(MSG)"

migrate-check:  ## Kiểm tra multiple migration heads
	@command -v python3 >/dev/null 2>&1 && python3 scripts/check_migrations.py --check || echo "Error: python3 not found. Please install Python 3.11+"

migrate-merge:  ## Tự động merge multiple migration heads
	@command -v python3 >/dev/null 2>&1 && python3 scripts/check_migrations.py --auto-merge || echo "Error: python3 not found. Please install Python 3.11+"

migrate-history:  ## Xem lịch sử migrations
	@command -v python3 >/dev/null 2>&1 && python3 scripts/check_migrations.py --show-history || echo "Error: python3 not found. Please install Python 3.11+"

migrate-validate:  ## Validate migration chain
	@command -v python3 >/dev/null 2>&1 && python3 scripts/check_migrations.py --validate || echo "Error: python3 not found. Please install Python 3.11+"

lint:  ## Chạy linter
	ruff check app/

format:  ## Format code
	black app/

format-check:  ## Kiểm tra formatting
	black --check app/