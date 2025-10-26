.PHONY: install up down lint test api-run web-student web-admin docs

install:
	cd apps/api && python3.11 -m pip install --upgrade pip
	cd apps/api && python3.11 -m pip install -r requirements-dev.txt
	npm install --prefix apps/web-student
	npm install --prefix apps/web-admin

up:
	docker compose -f deploy/docker-compose.yml up --build

down:
	docker compose -f deploy/docker-compose.yml down

lint:
	ruff check apps/api
	npm run lint --prefix apps/web-student
	npm run lint --prefix apps/web-admin

test:
	pytest apps/api/tests

api-run:
	uvicorn apps.api.app.main:app --reload

web-student:
	npm run dev --prefix apps/web-student

web-admin:
	npm run dev --prefix apps/web-admin

docs:
	npx @redocly/cli build-docs docs/OPENAPI.yaml --output docs/api.html
