#!/bin/sh
set -eu

echo "Applying database migrations..."
until npx prisma migrate deploy; do
  echo "Database not ready yet, retrying in 2s..."
  sleep 2
done

echo "Seeding baseline data..."
npm run db:seed

echo "Starting Next.js server..."
exec npm run start
