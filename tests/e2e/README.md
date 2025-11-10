# Playwright E2E Tests

## Overview

End-to-end tests following Playwright best practices for test isolation and parallel execution.

## Architecture (Playwright Best Practices)

### Global Setup (`global-setup.ts`)
Runs **once** before all tests:
- Truncates database (clean slate)
- Creates single test user account (`test@test.com` / `Test12345!`)
- **Does NOT seed test data** - each test creates its own data

### Test Fixtures (`fixtures.ts`)
Provides reusable fixtures for all tests:

**`sessionCookie`** - Authenticates once and provides session cookie for API calls
**`authenticatedPage`** - Pre-authenticated page ready for testing

**Helper functions:**
- `createTestData()` - Creates a person with income, savings, loan, and goal via API
- `cleanupTestData()` - Deletes person (cascades to all financial data)

### Test Pattern (Recommended)

Each test is **completely independent**:

```typescript
test("should do something", async ({ page, request, sessionCookie }) => {
  // 1. Create test data via API
  const testData = await createTestData(request, sessionCookie);

  try {
    // 2. Run your test with the created data
    await page.goto(`/persons/${testData.person.id}`);
    // ... test logic ...
    
  } finally {
    // 3. Cleanup test data
    await cleanupTestData(request, sessionCookie, testData.person.id);
  }
});
```

### Why This Approach?

✅ **Parallel execution** - Tests don't share state, can run simultaneously  
✅ **Test independence** - Each test creates exactly the data it needs  
✅ **No database coupling** - Tests use APIs, not direct DB manipulation  
✅ **Fast & reliable** - No database snapshots/rollbacks needed  
✅ **Maintainable** - Simple pattern, easy to understand  

This follows Playwright's [official recommendations](https://playwright.dev/docs/test-retries#reusing-single-page-between-tests).

## Running Tests

```bash
# Run all tests (parallel by default)
npm run test:e2e:playwright

# Run specific test file
npx playwright test financial-management.spec.ts

# Run in UI mode for debugging
npx playwright test --ui

# Run with headed browser (visible)
npx playwright test --headed

# Run specific test by name
npx playwright test -g "should create and manage income"
```

## Configuration

See `playwright.config.ts`:
- `fullyParallel: true` - Tests run in parallel for speed
- `workers: undefined` - Uses optimal number of workers (defaults to CPU cores)
- Global setup creates baseline test user
- Dev server starts automatically via `webServer` config

## Writing New Tests

### Example: Independent Test with Own Data

```typescript
import { test, expect, createTestData, cleanupTestData } from './fixtures';

test('should update savings account', async ({ page, request, sessionCookie }) => {
  // Each test creates its own unique test data
  const testData = await createTestData(request, sessionCookie);

  try {
    await page.goto(`/persons/${testData.person.id}`);
    
    // Your test logic here
    await page.getByRole('tab', { name: 'Savings' }).click();
    await expect(page.getByText(testData.savings.name)).toBeVisible();
    
  } finally {
    // Always cleanup in finally block
    await cleanupTestData(request, sessionCookie, testData.person.id);
  }
});
```

### Example: Using Authenticated Page

```typescript
test('should view economy overview', async ({ authenticatedPage: page }) => {
  // page is already logged in, no data creation needed
  await page.goto('/economy');
  await expect(page.getByHeading('Your Economy Overview')).toBeVisible();
});
```

## Test Data Structure

`createTestData()` returns:

```typescript
{
  household: { id, name, ... },
  person: { id, name: "TestPerson-{timestamp}", ... },
  income: { id, name: "Test Income", amount: 5000, ... },
  savings: { id, name: "Test Savings", currentBalance: 15000, ... },
  loan: { id, name: "Test Loan", currentBalance: 20000, ... },
  goal: { id, name: "Test Goal", targetAmount: 20000, ... }
}
```

Each test gets **unique data** (timestamps ensure uniqueness).

## Migration from Old Approach

**Old (antipattern):**
- Global setup seeded Alice/Bob with fixed IDs
- Tests depended on person ID=1, ID=2
- Database snapshots/rollbacks between tests
- Sequential execution only
- Tight coupling to database structure

**New (Playwright best practice):**
- Each test creates its own data
- Tests use dynamic IDs from `createTestData()`
- API-based cleanup (simpler, faster)
- Parallel execution enabled
- Tests independent of database internals

## Troubleshooting

**"Cannot find person":**
- Make sure you called `createTestData()` first
- Check you're using `testData.person.id`, not hardcoded IDs

**"Session expired":**
- Use `sessionCookie` fixture - it handles auth automatically
- Don't manually login in tests (use `authenticatedPage` instead)

**Tests interfere with each other:**
- Ensure cleanup happens in `finally` block
- Verify each test creates its own data (don't share `testData` across tests)

**Slow test runs:**
- Check if tests are running in parallel (`fullyParallel: true` in config)
- Consider using shared `authenticatedPage` for read-only tests
