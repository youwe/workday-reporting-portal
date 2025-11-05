#!/bin/sh
set -e

echo "🚀 Starting Workday Financial Intelligence Platform..."

# Wait for database to be ready
echo "⏳ Waiting for database..."
until mysql -h db -u ${MYSQL_USER:-workday_user} -p${MYSQL_PASSWORD:-workday_pass} -e "SELECT 1" > /dev/null 2>&1; do
  echo "Database is unavailable - sleeping"
  sleep 2
done

echo "✅ Database is ready!"

# Run database migrations
echo "📦 Running database migrations..."
npx drizzle-kit push --force || echo "⚠️  Migration skipped or failed"

# Seed initial data
echo "🌱 Seeding initial data..."
npx tsx scripts/seed-complete.ts || echo "⚠️  Seed skipped or failed"

# Start the application
echo "🎉 Starting application..."
exec node server/_core/index.js
