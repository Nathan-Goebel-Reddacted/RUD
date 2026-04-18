.PHONY: dev build build-display build-gh-pages lint preview \
        docker-up docker-down docker-build docker-rebuild docker-logs \
        install clean

# ── Dev ────────────────────────────────────────────────────────────────────────
dev:
	npm run dev

install:
	npm install

lint:
	npm run lint

# ── Builds ─────────────────────────────────────────────────────────────────────
build:
	npm run build

build-display:
	npm run build:display

build-gh-pages:
	npm run build:gh-pages

preview:
	npm run preview

# ── Docker ─────────────────────────────────────────────────────────────────────
up:
	docker compose up

down:
	docker compose down

build:
	docker compose build

rebuild:
	docker compose down && docker compose build && docker compose up

logs:
	docker compose logs -f

# ── Misc ───────────────────────────────────────────────────────────────────────
clean:
	rm -rf dist node_modules
