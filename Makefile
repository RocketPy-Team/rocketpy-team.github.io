# RocketPy site - local dev helpers.
# Run `make help` to list the available targets.

PORT ?= 8000
HOST ?= 127.0.0.1
export PORT HOST

.PHONY: help start stop restart status build serve-dist format

help:
	@echo Targets:
	@echo   make start       - start the local dev server on the source files
	@echo   make stop        - stop the dev server
	@echo   make restart     - restart the dev server
	@echo   make status      - show whether the server is running
	@echo   make build       - build the minified site into dist/
	@echo   make serve-dist  - build then preview the production dist/ output
	@echo   make format      - run prettier on html/css/js
	@echo Override the port with e.g. make start PORT=3000

start:
	@python scripts/devserver.py start

stop:
	@python scripts/devserver.py stop

restart:
	@python scripts/devserver.py restart

status:
	@python scripts/devserver.py status

build:
	@npm run build

serve-dist: build
	@python scripts/devserver.py stop
	@python -m http.server $(PORT) --directory dist --bind $(HOST)

format:
	@npm run format
