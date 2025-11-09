#!/bin/bash

# Setup database and seed test data
npm run dev:up &&

# Start dev server in background
npm run dev > nuxt-playwright.log 2>&1 &
DEV_PID=$!

# Wait for server to be ready
sleep 8 &&

# Run Playwright tests
npx playwright test --reporter=list

# Capture test exit code
TEST_EXIT_CODE=$?

# Kill the dev server
kill $DEV_PID 2>/dev/null || true

# Exit with the test exit code
exit $TEST_EXIT_CODE
