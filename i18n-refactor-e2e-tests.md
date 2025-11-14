# E2E Test Refactoring Plan for i18n Support

## Problem Statement

After implementing comprehensive Swedish translations throughout the application, E2E tests are broken because they search for hardcoded English text strings. The application now defaults to Swedish (sv) locale, and all UI text is dynamically translated using the `@nuxtjs/i18n` module.

## Root Cause

Tests use Playwright selectors like:
- `getByText("Fixed Monthly Expenses")` - searches for exact English text
- `getByRole("heading", { name: "Add Budget Expense" })` - expects English headings
- `getByText("Rent, utilities, subscriptions, etc.")` - hardcoded English descriptions

These selectors fail because the actual rendered text is now in Swedish (e.g., "Fasta Månadskostnader", "Lägg till budgetutgift").

## Solution Strategy

### Option 1: Force English Locale for Tests (RECOMMENDED)

Set locale cookie to English (`en`) at the beginning of each test to ensure consistent, predictable text.

**Pros:**
- Minimal test changes required
- Tests remain readable with English assertions
- Faster to implement
- No need to duplicate test logic for multiple locales

**Cons:**
- Doesn't test Swedish translation paths
- Misses i18n-specific bugs in Swedish locale

### Option 2: Use Test IDs Instead of Text

Replace text-based selectors with `data-testid` attributes.

**Pros:**
- Locale-independent
- More stable selectors (not affected by copy changes)
- Industry best practice

**Cons:**
- Requires adding test IDs to many components
- More invasive changes to components
- Doesn't test that actual text is rendered correctly

### Option 3: Dual-Locale Test Suite

Create separate test suites for English and Swedish.

**Pros:**
- Tests both locales thoroughly
- Catches locale-specific bugs

**Cons:**
- Doubles test maintenance burden
- Much longer test execution time
- Overkill for current project size

## Recommended Implementation: Hybrid Approach

Combine Options 1 and 2 for best results:

1. **Force English locale** for functional tests (CRUD, navigation, interactions)
2. **Add test IDs** for critical UI elements where text matching is unreliable
3. **Keep dedicated i18n tests** for locale-switching functionality

## Refactoring Checklist

### Phase 1: Create Locale Helper Utilities (Priority: HIGH)

**File:** `tests/e2e/helpers/locale.ts`

```typescript
import type { BrowserContext } from '@playwright/test';

export async function setTestLocale(context: BrowserContext, locale: 'en' | 'sv' = 'en') {
  await context.addCookies([
    {
      name: 'i18n_locale',
      value: locale,
      domain: 'localhost',
      path: '/',
    },
  ]);
}

export const i18n = {
  en: {
    // Common translations used in tests
    common: {
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      add: 'Add',
      update: 'Update',
    },
    economy: {
      title: 'Your Economy Overview',
      fixedExpenses: 'Fixed Monthly Expenses',
      members: 'Members',
    },
    budgetExpenses: {
      addExpense: 'Add Budget Expense',
      editExpense: 'Edit Budget Expense',
    },
    // ... add more as needed
  },
  sv: {
    // Swedish translations for dual-locale tests
    common: {
      save: 'Spara',
      cancel: 'Avbryt',
      delete: 'Ta bort',
      edit: 'Redigera',
      add: 'Lägg till',
      update: 'Uppdatera',
    },
    economy: {
      title: 'Din Ekonomiöversikt',
      fixedExpenses: 'Fasta Månadskostnader',
      members: 'Medlemmar',
    },
    // ... add more as needed
  },
};

export function t(locale: 'en' | 'sv', key: string): string {
  const keys = key.split('.');
  let value: any = i18n[locale];
  
  for (const k of keys) {
    value = value[k];
    if (!value) return key; // Fallback to key if not found
  }
  
  return value;
}
```

### Phase 2: Update Test Fixtures (Priority: HIGH)

**File:** `tests/e2e/fixtures.ts`

Add locale setup to fixtures:

```typescript
import { test as base, expect } from '@playwright/test';
import { setTestLocale } from './helpers/locale';

type TestFixtures = {
  authenticatedPage: Page;
  sessionCookie: string;
  locale: 'en' | 'sv';
};

export const test = base.extend<TestFixtures>({
  locale: ['en', { option: true }], // Default to English
  
  authenticatedPage: async ({ page, sessionCookie, locale }, use) => {
    // Set locale cookie BEFORE authentication
    await setTestLocale(page.context(), locale);
    
    // Set auth cookie
    await page.context().addCookies([
      {
        name: 'better-auth.session_token',
        value: sessionCookie,
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
      },
    ]);
    
    await use(page);
  },
});
```

### Phase 3: Refactor Individual Test Files

#### **3.1 Budget Expenses Tests** (`tests/e2e/crud/budget-expenses.spec.ts`)

**Changes needed:**
- ✅ Already uses `data-testid` for form inputs (good!)
- ❌ Uses text-based selectors for headings and descriptions
- ❌ Hardcoded currency format `$15.99/month`

**Refactoring:**

```typescript
import { test, expect } from '../fixtures';
import { t } from '../helpers/locale';

test.use({ locale: 'en' }); // Force English locale

test.describe('Budget Expenses CRUD', () => {
  test('should display budget expenses section on Economy page', async ({
    authenticatedPage: page,
  }) => {
    await page.goto('/economy', { waitUntil: 'networkidle' });
    
    // Use English text since locale is forced to 'en'
    await expect(
      page.getByRole('heading', { name: 'Fixed Monthly Expenses' })
    ).toBeVisible();
    
    await expect(
      page.getByText('Rent, utilities, subscriptions, etc.')
    ).toBeVisible();
    
    // Test ID selector (already good!)
    await expect(page.getByTestId('add-budget-expense-button')).toBeVisible();
  });
  
  test('should create a new budget expense', async ({
    authenticatedPage: page,
  }) => {
    await page.goto('/economy', { waitUntil: 'networkidle' });
    
    await page.getByTestId('add-budget-expense-button').click();
    
    // Text selector with forced locale
    await expect(
      page.getByRole('heading', { name: 'Add Budget Expense' })
    ).toBeVisible();
    
    // Test ID selectors (already good!)
    await page.getByTestId('budget-expense-name-input').fill('Netflix');
    await page.getByTestId('budget-expense-amount-input').fill('15.99');
    await page.getByTestId('budget-expense-modal-submit-button').click();
    
    // Verify with test ID
    const expenseCard = page
      .locator('[data-testid^="budget-expense-"]')
      .filter({ hasText: 'Netflix' });
    await expect(expenseCard).toBeVisible();
    
    // Currency format will be USD since locale is 'en'
    await expect(expenseCard.getByText('$15.99/month')).toBeVisible();
  });
});
```

#### **3.2 Person CRUD Tests** (`tests/e2e/crud/person.spec.ts`)

**Changes needed:**
- ❌ Text: "Add Member", "Age: 28"
- ✅ Uses `data-testid` for buttons and inputs

**Refactoring:**

```typescript
import { test, expect } from '../fixtures';

test.use({ locale: 'en' });

test.describe('Person CRUD', () => {
  test('should create a new person', async ({ page, sessionCookie }) => {
    // Locale is already set by fixture
    await page.goto('/economy');
    await page.waitForLoadState('networkidle');
    
    await page.getByTestId('add-person-button').click();
    
    await expect(
      page.getByRole('heading', { name: /add member/i })
    ).toBeVisible();
    
    await page.getByTestId('person-name-input').fill('Jane Smith');
    await page.getByTestId('person-age-input').fill('28');
    await page.getByTestId('person-modal-submit-button').click();
    
    // Verify person appears
    await expect(page.getByText('Jane Smith')).toBeVisible();
    await expect(page.getByText('Age: 28')).toBeVisible();
  });
});
```

#### **3.3 Financial Instruments Tests** (`tests/e2e/crud/financial-instruments.spec.ts`)

**Changes needed:**
- ❌ Text: "Your Economy Overview", "Income Sources", "Add Income Source"
- ❌ Currency format: `$6000.00 monthly`
- ✅ Good use of test IDs for buttons

**Refactoring:**

```typescript
import { test, expect, createTestData, cleanupTestData } from '../fixtures';

test.use({ locale: 'en' });

test.describe('Financial Instruments CRUD', () => {
  test('should successfully navigate to Economy page', async ({
    authenticatedPage: page,
  }) => {
    await page.goto('/economy');
    await page.waitForLoadState('networkidle');
    
    await expect(
      page.getByRole('heading', { name: 'Your Economy Overview' })
    ).toBeVisible();
    
    await expect(
      page.getByRole('heading', { name: 'Members', exact: true })
    ).toBeVisible();
  });
  
  test('should create a new income source', async ({
    page,
    request,
    sessionCookie,
  }) => {
    const testData = await createTestData(request, sessionCookie);
    
    try {
      await page.goto(`/persons/${testData.person.id}`);
      await page.waitForLoadState('networkidle');
      
      await page.getByTestId('add-income-button').click();
      
      await expect(
        page.getByRole('heading', { name: /add income source/i })
      ).toBeVisible();
      
      // Fill form using test IDs
      await page.getByTestId('income-source-input').fill('New Salary');
      await page.getByTestId('income-amount-input').fill('6000');
      await page.selectOption('#income-frequency', 'monthly');
      
      await page.getByTestId('income-modal-submit-button').click();
      
      // Verify with heading (more stable than card text)
      await expect(
        page.getByRole('heading', { name: 'New Salary', exact: true })
      ).toBeVisible();
      
      // Currency will be USD format
      await expect(
        page.getByText('$6000.00 monthly', { exact: true })
      ).toBeVisible();
    } finally {
      await cleanupTestData(request, sessionCookie, testData.person.id);
    }
  });
});
```

#### **3.4 Settings Tests** (`tests/e2e/settings.spec.ts`)

**Changes needed:**
- ❌ Text: "Settings", "Language", "Currency", "Save Changes"
- ✅ Already uses test IDs for selects

**Refactoring:**

```typescript
import { test, expect } from './fixtures';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.use({ locale: 'en' });

test.describe('Settings Page', () => {
  test('should display settings page', async ({
    authenticatedPage: page,
  }) => {
    await page.goto(`${BASE_URL}/settings`);
    await page.waitForLoadState('networkidle');
    
    // English text since locale is forced
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    await expect(page.getByText('Language').first()).toBeVisible();
    await expect(page.getByText('Currency').first()).toBeVisible();
    
    const saveButton = page.getByRole('button', { name: 'Save Changes' });
    await expect(saveButton).toBeVisible();
    await expect(saveButton).toBeDisabled();
  });
  
  test('should display current selections', async ({
    authenticatedPage: page,
  }) => {
    await page.goto(`${BASE_URL}/settings`);
    await page.waitForLoadState('networkidle');
    
    // Use test IDs (already good!)
    const languageSelect = page.getByTestId('language-select');
    await expect(languageSelect).toBeVisible();
    
    // Note: Default is 'sv' but we're testing in 'en' context
    // The select will show 'en' since we forced the locale
    await expect(languageSelect).toContainText('en');
  });
});
```

#### **3.5 Projections Tests** (`tests/e2e/projections.spec.ts`)

**Changes needed:**
- ❌ Text: "10-Year Financial Projection", "Net Worth", "Assets", "Debt"
- ❌ Text: "Global Assumptions", "Show Table"

**Refactoring:**

```typescript
import { test, expect } from './fixtures';

test.use({ locale: 'en' });

test.describe('Projections Page', () => {
  test('should display projection chart', async ({
    authenticatedPage: page,
  }) => {
    await page.goto('/projections');
    await page.waitForLoadState('networkidle');
    
    await expect(
      page.getByRole('heading', { name: '10-Year Financial Projection' })
    ).toBeVisible();
    
    // Tab buttons
    await expect(page.getByRole('button', { name: 'Net Worth' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Assets' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Debt' })).toBeVisible();
  });
  
  test('should toggle global assumptions', async ({
    authenticatedPage: page,
  }) => {
    await page.goto('/projections');
    await page.waitForLoadState('networkidle');
    
    await expect(
      page.getByRole('heading', { name: 'Global Assumptions' })
    ).toBeVisible();
    
    const toggle = page.getByRole('checkbox', { name: /Disabled|Enabled/ });
    await expect(toggle).toBeVisible();
  });
});
```

#### **3.6 Financial Health Tests** (`tests/e2e/financial-health-dashboard.spec.ts`)

**Changes needed:**
- ❌ Text: "Financial Health Dashboard", "Track your overall financial wellness"
- ❌ Text: "Net Worth", "Cash Flow", "Debt-to-Income Ratio", "Emergency Fund"

**Refactoring:**

```typescript
import { test, expect } from './fixtures';

test.use({ locale: 'en' });

test.describe('Financial Health Dashboard', () => {
  test('should display all metric cards', async ({
    authenticatedPage: page,
  }) => {
    await page.goto('/financial-health');
    await page.waitForLoadState('networkidle');
    
    await expect(
      page.getByText('Track your overall financial wellness')
    ).toBeVisible();
    
    // Check for all metric cards
    await expect(
      page.getByRole('heading', { name: 'Net Worth', level: 3 })
    ).toBeVisible();
    
    await expect(
      page.getByRole('heading', { name: 'Cash Flow', level: 3 })
    ).toBeVisible();
    
    await expect(
      page.getByRole('heading', { name: 'Debt-to-Income Ratio', level: 3 })
    ).toBeVisible();
    
    await expect(
      page.getByRole('heading', { name: 'Emergency Fund', level: 3 })
    ).toBeVisible();
  });
});
```

#### **3.7 i18n Tests** (`tests/e2e/i18n.spec.ts` and `i18n-authenticated.spec.ts`)

**No changes needed!** These tests are specifically for testing locale switching, so they should:
- Test both English and Swedish text
- Not force a locale
- Verify cookie behavior
- Check currency formatting for both locales

These are the only tests that should remain locale-aware.

### Phase 4: Add Missing Test IDs to Components (Priority: MEDIUM)

Components that need test IDs added:

**BudgetExpenseModal.vue:**
- ✅ Already has: `budget-expense-name-input`, `budget-expense-amount-input`, `budget-expense-category-select`, `budget-expense-modal-submit-button`

**EditPersonModal.vue:**
- ❌ Needs: Modal header, form fields
- Add: `data-testid="edit-person-modal-header"`, `data-testid="edit-person-name-input"`, `data-testid="edit-person-age-input"`

**IncomeSourceModal.vue:**
- ✅ Should have test IDs (verify in component)

**SavingsAccountModal.vue:**
- ❌ Likely needs test IDs

**LoanModal.vue:**
- ❌ Likely needs test IDs

**SavingsGoalModal.vue:**
- ❌ Likely needs test IDs

### Phase 5: Update Playwright Configuration (Priority: LOW)

**File:** `playwright.config.ts`

Add a project for Swedish locale testing (optional, future):

```typescript
export default defineConfig({
  projects: [
    {
      name: 'chromium-en',
      use: { 
        ...devices['Desktop Chrome'],
        locale: 'en-US',
      },
    },
    {
      name: 'chromium-sv',
      use: { 
        ...devices['Desktop Chrome'],
        locale: 'sv-SE',
      },
    },
  ],
});
```

## Implementation Order

1. **Day 1: Setup (2-3 hours)**
   - Create `tests/e2e/helpers/locale.ts`
   - Update `tests/e2e/fixtures.ts` with locale support
   - Test the fixture with one simple test

2. **Day 2: Core CRUD Tests (3-4 hours)**
   - Refactor `budget-expenses.spec.ts`
   - Refactor `person.spec.ts`
   - Refactor `financial-instruments.spec.ts`
   - Run tests to verify they pass

3. **Day 3: Page Tests (2-3 hours)**
   - Refactor `settings.spec.ts`
   - Refactor `projections.spec.ts`
   - Refactor `financial-health-dashboard.spec.ts`
   - Refactor `global-assumptions.spec.ts`

4. **Day 4: Verification (1-2 hours)**
   - Run full test suite
   - Fix any remaining failures
   - Update i18n tests if needed (they should mostly work)

5. **Day 5: Polish (1-2 hours)**
   - Add missing test IDs to components
   - Update any hardcoded expectations
   - Document patterns for future tests

## Testing the Refactored Tests

```bash
# Run all tests with English locale (default)
npm run test:e2e

# Run a specific test file
npm run test:e2e tests/e2e/crud/budget-expenses.spec.ts

# Run with Swedish locale (for i18n-specific tests)
npm run test:e2e tests/e2e/i18n.spec.ts

# Debug mode
npm run test:e2e -- --debug

# Headed mode (see browser)
npm run test:e2e -- --headed
```

## Key Principles for Future Tests

1. **Always force locale to 'en' for functional tests** unless testing i18n specifically
2. **Prefer test IDs over text selectors** for form inputs and buttons
3. **Use role-based selectors** for semantic elements (headings, links, buttons)
4. **Keep i18n tests separate** - they should test both locales
5. **Don't test translation strings** - that's not the purpose of E2E tests
6. **Test user behavior**, not implementation details

## Common Pitfalls to Avoid

❌ **Don't do this:**
```typescript
// Will break when locale changes
await expect(page.getByText('Lägg till budgetutgift')).toBeVisible();
```

✅ **Do this instead:**
```typescript
// Force locale and use English
test.use({ locale: 'en' });
await expect(page.getByText('Add Budget Expense')).toBeVisible();

// OR use test ID
await expect(page.getByTestId('add-expense-button')).toBeVisible();
```

❌ **Don't do this:**
```typescript
// Currency format depends on locale
await expect(page.getByText('15,99 kr/månad')).toBeVisible();
```

✅ **Do this instead:**
```typescript
// Force locale to 'en', expect USD format
test.use({ locale: 'en' });
await expect(page.getByText('$15.99/month')).toBeVisible();

// OR use regex to accept both
await expect(page.getByText(/15[.,]99.*month|månad/)).toBeVisible();
```

## Success Criteria

- ✅ All E2E tests pass with forced English locale
- ✅ i18n-specific tests verify both English and Swedish
- ✅ Tests are maintainable and readable
- ✅ New developers can write tests without knowing Swedish
- ✅ Test IDs are added to all critical UI elements
- ✅ Documentation is clear on when to force locale vs test both

## Future Enhancements

1. **Visual regression testing** for both locales
2. **Automated translation coverage** - verify all keys have both en/sv
3. **Performance testing** with different locales
4. **Accessibility testing** in both languages
5. **Screenshot comparison** between locales for layout consistency

## Questions to Address

1. Should we test right-to-left languages in the future? (Probably not needed for Swedish/English)
2. Do we need to test currency conversion? (No, that's a unit test concern)
3. Should we test number formatting differences? (Yes, but in dedicated i18n tests)
4. How do we handle dynamic pluralization? (Force locale, test English plurals)

---

**Estimated Total Effort:** 10-15 hours spread over 5 days

**Risk Level:** Low (tests can be fixed incrementally, no production impact)

**Priority:** High (blocking CI/CD pipeline if tests are failing)
