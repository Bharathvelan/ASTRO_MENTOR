.PHONY: install dev test lint format clean migrate run

install:
	poetry install

dev:
	poetry install --with dev

test:
	poetry run pytest

test-cov:
	poetry run pytest --cov=src --cov-report=html

lint:
	poetry run ruff src tests
	poetry run mypy src

format:
	poetry run black src tests
	poetry run ruff --fix src tests

clean:
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	rm -rf .pytest_cache .coverage htmlcov .mypy_cache

migrate:
	poetry run alembic upgrade head

migrate-create:
	poetry run alembic revision --autogenerate -m "$(msg)"

run:
	poetry run uvicorn src.api.main:app --reload --host 0.0.0.0 --port 8000

docker-db:
	docker run -d --name astramentor-postgres -p 5432:5432 -e POSTGRES_PASSWORD=password -e POSTGRES_DB=astramentor postgres:15
	docker run -d --name astramentor-redis -p 6379:6379 redis:7

docker-stop:
	docker stop astramentor-postgres astramentor-redis || true
	docker rm astramentor-postgres astramentor-redis || true
