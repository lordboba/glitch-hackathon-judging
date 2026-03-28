#!/bin/sh
set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "Starting local Postgres..."
docker compose up -d postgres

echo "Applying migrations..."
./scripts/with-env.sh prisma migrate deploy

echo "Seeding baseline data..."
./scripts/with-env.sh tsx prisma/seed.ts

echo "Starting Next.js dev server..."
exec ./scripts/with-env.sh next dev
