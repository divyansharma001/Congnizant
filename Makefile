.PHONY: up down logs build server worker restart-worker setup-db scan-events scan-jobs scan-consent peek-queue clean ps

up:
	docker compose up -d --build

down:
	docker compose down

build:
	docker compose build

logs:
	docker compose logs -f

server:
	docker compose logs -f server

worker:
	docker compose logs -f worker

# Worker has no auto-reload — restart it after worker code changes.
restart-worker:
	docker compose restart worker

# Phase 2 — DynamoDB tables and queue inspection
setup-db:
	docker compose exec server python /app/scripts/setup_dynamodb.py

scan-events:
	docker compose exec server python /app/scripts/scan.py customer_events

scan-jobs:
	docker compose exec server python /app/scripts/scan.py jobs

scan-consent:
	docker compose exec server python /app/scripts/scan.py customer_consent

peek-queue:
	docker exec hyperpersona-redis-1 redis-cli LRANGE jobs:pending 0 -1

ps:
	docker compose ps

clean:
	docker compose down -v
