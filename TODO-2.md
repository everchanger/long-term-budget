# Code Review: Critical Issues & Architectural Concerns

**Date:** November 9, 2025  
**Reviewer Role:** TypeScript/Nuxt Guru, PostgreSQL/Drizzle Expert, Better-Auth God

---

## 🚨 CRITICAL: Security & Authentication

### 1. ⚠️ Session Type Mismatch - Better-Auth Integration Issue
**Severity:** CRITICAL  
**Location:** `server/middleware/auth.ts`, `server/utils/authorization.ts`

**Problem:**
The session object returned by Better-Auth has a different structure than what the codebase expects. Better-Auth v1.3.7 returns sessions with this structure:
```typescript
{
  session?: { userId: string, ... },
  user?: { id: string, ... }
}
```

But the authorization utilities expect:
```typescript
{
  user?: { id?: string }
}
```

**Evidence:**
```typescript
// server/middleware/auth.ts - Sets session incorrectly
event.context.session = session; // Better-Auth session shape

// server/utils/authorization.ts - Wrong type definition
export type UserSession = {
  user?: { id?: string }; // Doesn't match Better-Auth
};

// Used everywhere:
if (!session?.user?.id) { // May fail if structure is wrong
```

**Impact:**
- Authentication may fail silently
- Type safety is broken
- Hard to debug auth issues

**Solution:**
1. Import the correct `Session` type from Better-Auth:
   ```typescript
   import type { Session } from "better-auth/types";
   ```
2. Update `UserSession` type to match Better-Auth exactly
3. Add runtime validation in middleware to log session structure
4. Create a helper to safely extract user ID regardless of session structure

---

## 🔴 CRITICAL: API Inconsistencies

### 3. ⚠️ Inconsistent HTTP Method Checking
**Severity:** HIGH  
**Location:** Throughout `server/api/**/*.ts`

**Problem:**
Three different patterns are used to check HTTP methods:

**Pattern 1: `getMethod(event)`** (Used in ~9 files)
```typescript
const method = getMethod(event);
if (method === "GET") { }
if (method === "POST") { }
```

**Pattern 2: `event.node.req.method`** (Used in ~7 files)
```typescript
if (event.node.req.method === "GET") { }
if (event.node.req.method === "POST") { }
```

**Pattern 3: `assertMethod(event)`** (Used in 1 file)
```typescript
assertMethod(event, "GET"); // Throws if not GET
```

**Files Using Different Patterns:**
- `loans/[id].ts` - uses `getMethod`
- `income-sources/[id].ts` - uses `event.node.req.method`
- `households/index.ts` - uses `assertMethod`
- `savings-accounts/[id].ts` - uses `getMethod`
- `persons/[id].ts` - uses `event.node.req.method`

**Impact:**
- Confusing for developers
- No consistent error handling
- `assertMethod` throws, others don't
- Harder to maintain

**Solution:**
Pick ONE pattern and refactor all endpoints:
```typescript
// Recommended: Use getMethod consistently
const method = getMethod(event);
if (method === "GET") { }
else if (method === "POST") { }
else {
  throw createError({
    statusCode: 405,
    statusMessage: "Method Not Allowed"
  });
}
```

---

### 4. ⚠️ Duplicate Authorization Logic Everywhere
**Severity:** CRITICAL  
**Location:** `server/api/**/*.ts` (16+ files)

**Problem:**
Despite having `verifyPersonAccessOrThrow()` and `verifyHouseholdAccessOrThrow()` utilities, most endpoints still duplicate the authorization logic manually:

**Example in `server/api/income-sources/index.ts`:**
```typescript
// Lines 24-43: Manual authorization check
const [personExists] = await db
  .select({ id: tables.persons.id })
  .from(tables.persons)
  .innerJoin(
    tables.households,
    eq(tables.persons.householdId, tables.households.id)
  )
  .where(
    and(
      eq(tables.persons.id, personId),
      eq(tables.households.userId, session.user.id)
    )
  );

if (!personExists) {
  throw createError({
    statusCode: 403,
    statusMessage: "Access denied: Person does not belong to your household",
  });
}
```

**This pattern repeats in:**
- `server/api/savings-accounts/index.ts` (lines 23-44)
- `server/api/loans/index.ts` (lines 20-40)
- `server/api/income-sources/index.ts` (lines 24-43 AND 91-110 - TWICE!)
- `server/api/income-sources/[id].ts`
- And many more...

**Why Utilities Aren't Used:**
The utilities were created but only ~9 files were refactored. The rest still have the old code.

**Impact:**
- ~180 lines of duplicate code
- Inconsistent error messages
- Hard to change auth logic
- More surface area for bugs

**Solution:**
**COMPLETE THE REFACTOR!** Replace all manual checks with:
```typescript
await verifyPersonAccessOrThrow(session, personId, db);
```

**Affected Files (not yet refactored):**
- `server/api/savings-accounts/index.ts` (GET with personId)
- `server/api/loans/index.ts` (GET handler)
- `server/api/income-sources/index.ts` (GET handler, POST handler)
- `server/api/expenses/index.ts` (likely - not checked yet)

---

## 🔴 CRITICAL: Type Safety Issues

### 5. ⚠️ Database vs. Drizzle Instance Confusion
**Severity:** MEDIUM-HIGH  
**Location:** `database/index.ts`, `server/utils/drizzle.ts`

**Problem:**
There are TWO database configuration files:

**File 1: `database/index.ts`** (COMMENTED OUT, DEAD CODE)
```typescript
// Entire file is commented out
// export const db = drizzle(client, { schema });
```

**File 2: `server/utils/drizzle.ts`** (ACTUAL IMPLEMENTATION)
```typescript
export function useDrizzle() {
  return createDrizzleInstance();
}
export const db = createDrizzleInstance();
```

**Confusion:**
- Two files do the same thing
- One is dead code but still exists
- Imports come from both locations:
  - `lib/auth.ts` imports from `@s/utils/drizzle`
  - Tests import from `server/utils/drizzle`
  - Some places might try to import from `database/index.ts`

**Impact:**
- Developer confusion
- Risk of using wrong import
- Dead code clutters repo

**Solution:**
1. **DELETE** `database/index.ts` entirely
2. Update any remaining imports to use `server/utils/drizzle`
3. Document that `useDrizzle()` is the canonical way to get DB instance

---

### 6. ⚠️ Unsafe ID Parsing in Request Bodies
**Severity:** MEDIUM  
**Location:** Multiple API endpoints

**Problem:**
IDs from route parameters use the safe `parseIdParam()` helper, but IDs from request bodies are parsed unsafely:

**Safe (route params):**
```typescript
const personId = parseIdParam(event, "id", "Person ID is required");
```

**Unsafe (request bodies):**
```typescript
const body = await readBody(event);
const { personId } = body; // Could be string, number, null, undefined, object...
// Then used directly:
eq(tables.persons.id, personId) // Type error waiting to happen!
```

**Files with Unsafe Body ID Parsing:**
- `server/api/savings-accounts/index.ts` - `personId` from body
- `server/api/loans/index.ts` - `personId` from body
- `server/api/income-sources/index.ts` - `person_id` from body (also uses snake_case!)
- `server/api/expenses/index.ts` - probably has same issue
- `server/api/broker-accounts/index.ts` - `personId` from body

**Impact:**
- Type errors not caught at compile time
- Potential SQL injection if not careful
- Runtime errors from bad data

**Solution:**
Create and use `parseBodyInt()` helper:
```typescript
// server/utils/api-helpers.ts
export function parseBodyInt(
  body: any,
  field: string,
  errorMessage?: string
): number {
  const value = body[field];
  const parsed = parseInt(value);
  
  if (isNaN(parsed)) {
    throw createError({
      statusCode: 400,
      statusMessage: errorMessage || `Invalid ${field}: must be an integer`,
    });
  }
  
  return parsed;
}

// Usage:
const personId = parseBodyInt(body, "personId", "Person ID is required");
```

---

### 7. ⚠️ Snake_case vs camelCase API Inconsistency
**Severity:** MEDIUM  
**Location:** `server/api/income-sources/index.ts`

**Problem:**
Income sources API uses snake_case for request body fields:
```typescript
const {
  person_id,    // snake_case
  name,
  amount,
  frequency,
  start_date,   // snake_case
  end_date,     // snake_case
  is_active,    // snake_case
} = body;
```

But ALL other endpoints use camelCase:
```typescript
// loans/index.ts
const { name, originalAmount, currentBalance, personId } = body;

// savings-accounts/index.ts
const { name, currentBalance, interestRate, personId } = body;
```

**Impact:**
- Frontend must handle both conventions
- Easy to make mistakes
- Looks unprofessional

**Solution:**
Refactor income sources to use camelCase:
```typescript
const {
  personId,
  name,
  amount,
  frequency,
  startDate,
  endDate,
  isActive,
} = body;
```

---

## 🟡 HIGH PRIORITY: Data Integrity

### 8. ⚠️ Interest Rate Conversion Logic Duplicated (Already in TODO.md)
**Severity:** HIGH  
**Location:** Multiple files

**Note:** This is already documented in `TODO.md` but worth emphasizing:

**Duplicate conversion code appears in:**
- `server/api/savings-accounts/index.ts` (3 times)
- `server/api/savings-accounts/[id].ts` (2 times)
- `server/api/loans/index.ts` (2 times)
- `server/api/loans/[id].ts` (2 times)
- `tests/nuxt/utils/test-data.ts` (2 times)

**Total: ~10 duplicated implementations of:**
```typescript
// Write: percentage → decimal
String(Number(interestRate) / 100)

// Read: decimal → percentage with rounding
String(Math.round(Number(interestRate) * 100 * 100) / 100)
```

**Additional Concerns:**
- What if we want to change rounding strategy?
- What if we need to validate ranges?
- Test data builder bypasses this logic (direct DB inserts)

**Already planned in TODO.md but needs urgency bump.**

---

### 9. ⚠️ Missing Validation for Decimal Fields
**Severity:** MEDIUM  
**Location:** All POST/PUT endpoints

**Problem:**
Request bodies are not validated with Zod schemas before database insertion:

```typescript
// Current pattern (no validation):
const body = await readBody(event);
const { name, currentBalance, interestRate } = body;

// Direct use without validation:
await db.insert(tables.savingsAccounts).values({
  name, // What if it's an object? Array? Null?
  currentBalance: currentBalance.toString(), // What if it's "abc"?
  interestRate: interestRate.toString(),
});
```

**We have Zod schemas, but they're not used!**
```typescript
// database/validation-schemas.ts
export const insertSavingsAccountSchema = createInsertSchema(savingsAccounts, {
  name: z.string().min(1, "Account name is required"),
  currentBalance: positiveDecimalString(),
  interestRate: percentageString().optional(),
  // ...
});
```

**Impact:**
- Bad data can reach the database
- No user-friendly validation errors
- Type safety is illusion

**Solution:**
Validate ALL request bodies before use:
```typescript
import { insertSavingsAccountSchema } from "~/database/validation-schemas";

const body = await readBody(event);
const validated = insertSavingsAccountSchema.parse(body);
// Now validated has correct types and values

await db.insert(tables.savingsAccounts).values({
  name: validated.name,
  currentBalance: validated.currentBalance,
  // ...
});
```

**Bonus:** Zod errors can be caught and returned as 400 with helpful messages.


## 🟡 MEDIUM PRIORITY: Code Organization

### 14. ⚠️ Composables vs Utils Confusion
**Severity:** MEDIUM  
**Location:** `app/composables/`, `utils/`

**Problem:**
Financial calculations exist in THREE places with unclear boundaries:

**File 1: `utils/financial-calculations.ts`**
- Pure functions for frequency conversion
- Used by frontend AND backend
- Lives in root `utils/` directory

**File 2: `app/composables/useFinancialCalculations.ts`**
- Pure calculation functions
- Imports types from database
- Only used by frontend
- Lives in `app/composables/` but doesn't use Vue composition API!

**File 3: `server/utils/savingsGoalCalculations.ts`**
- Server-only calculation logic
- Complex goal progress calculations

**Confusion:**
```typescript
// app/composables/useFinancialCalculations.ts
// This is NOT a composable! It's just pure functions!
export function calculateMonthlyIncome(
  incomeSources: SelectIncomeSource[]
): string {
  // No ref(), no computed(), no reactive()
  // Just a pure function that should be in utils/
}
```

**Problems:**
- `useFinancialCalculations.ts` is misnamed (not a composable)
- Unclear where to put new calculation functions
- Some calculations in `utils/`, others in `composables/`
- No clear pattern

**Solution:**
Reorganize:
```
utils/
  ├── financial/
  │   ├── frequencies.ts        (from utils/financial-calculations.ts)
  │   ├── calculations.ts       (from app/composables/useFinancialCalculations.ts)
  │   └── formatting.ts         (new - for currency formatting)
  └── ...

server/utils/
  └── savings-goal-calculations.ts (server-only logic)

app/composables/
  ├── useHouseholdFinancials.ts   (actual composables using calculations)
  ├── useIncomeSources.ts
  └── ... (only files using Composition API)
```

---

### 15. ⚠️ Test Data Builder Bypasses Application Logic (Already in TODO)
**Severity:** HIGH  
**Location:** `tests/nuxt/utils/test-data.ts`

**Note:** Already in TODO.md but worth highlighting consequences:

**Problem:**
Test data builder inserts directly into database:
```typescript
export class TestDataBuilder {
  async addSavingsAccount(data?: Partial<InsertSavingsAccount>) {
    const [account] = await db
      .insert(savingsAccounts)
      .values({
        personId: this.personId,
        name: data?.name || "Test Savings Account",
        currentBalance: data?.currentBalance || "10000",
        interestRate: data?.interestRate 
          ? String(Number(data.interestRate) / 100) // DUPLICATES API LOGIC
          : "0.0002",
      })
      .returning();
    
    return account;
  }
}
```

**Consequences:**
1. **Logic Duplication:** Interest rate conversion duplicated from API
2. **Inconsistent State:** Tests don't validate that API logic works
3. **Fragile:** If API changes, tests don't catch it
4. **False Confidence:** Tests pass but production might fail
5. **Missing Validation:** Bypasses Zod schemas

**Example of What This Hides:**
If API logic is broken:
```typescript
// API has a bug:
interestRate: String(Number(interestRate) * 100) // WRONG! Should divide

// But tests pass because they bypass the API:
testBuilder.addSavingsAccount({ interestRate: "5" }) // Goes direct to DB
```

**Solution (from TODO.md):**
Use API endpoints in test data builder:
```typescript
async addSavingsAccount(data?: Partial<InsertSavingsAccount>) {
  const response = await authenticatedFetch(
    `/api/savings-accounts`,
    {
      method: "POST",
      body: {
        personId: this.personId,
        name: data?.name || "Test Savings Account",
        currentBalance: data?.currentBalance || "10000",
        interestRate: data?.interestRate || "2.5", // As percentage
      },
    }
  );
  
  return response.data;
}
```