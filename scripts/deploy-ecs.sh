#!/usr/bin/env sh
set -eu

APP_DIR="${APP_DIR:-/opt/digital-garden/app}"
GIT_REF="${GIT_REF:-origin/main}"
COMPOSE_PROFILES="${COMPOSE_PROFILES:-}"

cd "$APP_DIR"

git fetch --prune origin
git reset --hard "$GIT_REF"

if [ ! -f .env ]; then
  echo ".env is missing in $APP_DIR" >&2
  exit 1
fi

if [ -n "$COMPOSE_PROFILES" ]; then
  docker compose --profile "$COMPOSE_PROFILES" up -d --build
else
  docker compose up -d --build
fi

docker compose ps
