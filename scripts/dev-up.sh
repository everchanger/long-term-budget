#!/usr/bin/env bash
set -e

# Cleanup function to ensure dev server is stopped on exit
cleanup() {
  if [ -n "$DEV_SERVER_PID" ]; then
    echo ""
    echo "Cleaning up development server (PID: $DEV_SERVER_PID)..."
    # Try graceful shutdown first
    kill $DEV_SERVER_PID 2>/dev/null || true
    sleep 1
    # Force kill if still running
    kill -9 $DEV_SERVER_PID 2>/dev/null || true
    wait $DEV_SERVER_PID 2>/dev/null || true
    echo "Development server stopped"
  fi
  
  # Extra cleanup: kill any remaining nuxt dev processes on port 3000
  lsof -ti:3000 | xargs kill -9 2>/dev/null || true
}

# Register cleanup function to run on script exit
trap cleanup EXIT

echo "Starting development environment setup..."
echo ""

# Step 0: Kill any existing dev servers on port 3000
echo "Cleaning up any existing dev servers..."
pkill -f "nuxt dev" 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
sleep 1
echo "Cleanup complete"
echo ""

# Step 1: Tear down existing containers and volumes
echo "Stopping and removing existing containers and volumes..."
docker compose down -v
echo "Containers and volumes removed"
echo ""

# Step 2: Start PostgreSQL container
echo "Starting PostgreSQL container..."
docker compose up -d
echo "PostgreSQL container started"
echo ""

# Step 3: Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
until docker compose exec -T db pg_isready -U budgetuser -d budgetdb > /dev/null 2>&1; do
  echo "  Waiting for database..."
  sleep 1
done
echo "PostgreSQL is ready"
echo ""

# Step 4: Push database schema
echo "Pushing database schema..."
npm run db:push
echo "Database schema pushed"
echo ""

# Step 5: Start dev server in background
echo "Starting development server..."
npm run dev > /tmp/nuxt-dev.log 2>&1 &
DEV_SERVER_PID=$!
echo "Development server started (PID: $DEV_SERVER_PID)"
echo "  Logs: /tmp/nuxt-dev.log"
echo ""

# Step 6: Wait for dev server to be ready
echo "Waiting for development server to be ready..."
MAX_ATTEMPTS=60
ATTEMPT=0
until curl -sf http://localhost:3000/api/health > /dev/null 2>&1 || curl -sf http://localhost:3000 2>&1 | grep -qv "Nuxt dev server is starting"; do
  ATTEMPT=$((ATTEMPT + 1))
  if [ $ATTEMPT -ge $MAX_ATTEMPTS ]; then
    echo "Development server failed to start within ${MAX_ATTEMPTS} seconds"
    kill $DEV_SERVER_PID 2>/dev/null || true
    exit 1
  fi
  if [ $((ATTEMPT % 5)) -eq 0 ]; then
    echo "  Still waiting... (${ATTEMPT}s elapsed)"
  fi
  sleep 1
done
echo "Development server is ready"
echo ""

# Step 7: Seed test user
echo "Seeding test user..."
npm run db:seed:test-user
SEED_EXIT_CODE=$?
echo ""

if [ $SEED_EXIT_CODE -ne 0 ]; then
  echo "Seeding failed!"
  exit 1
fi

echo "Development environment is ready!"
echo ""
echo "Test user credentials:"
echo "  Email: test@test.com"
echo "  Password: Test12345!"
echo ""
echo "Next steps:"
echo "  - Run 'npm run dev' to start the development server"
echo "  - Run 'npm run db:studio' to open Drizzle Studio"
echo ""
