# TODO: Technical Debt & Improvement Opportunities

*Last updated: 2025-11-07*

This document tracks technical improvements, refactoring opportunities, and architectural enhancements identified by code analysis. Items are prioritized and categorized for systematic improvement.

---

## 🔴 High Priority - Type Safety & Validation

### 1. Create Zod Utilities for Common Validation Patterns
**Issue:** Duplicate `parseFloat` validation logic across all decimal schemas  
**Location:** `database/validation-schemas.ts` (lines 69, 87, 106, 123, 142, 147, 154, 163, 185)  
**Impact:** DRY violation, harder to maintain, inconsistent error messages

```typescript
// Current (repeated 9+ times):
.refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
  message: "Amount must be a positive number",
})

// Proposed solution:
// Create shared validation helpers
const decimalString = (min = 0, max?: number) => 
  z.string().refine(
    (val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num >= min && (max === undefined || num <= max);
    },
    (val) => ({
      message: max !== undefined 
        ? `Must be between ${min} and ${max}`
        : `Must be at least ${min}`,
    })
  );

const percentageString = () => decimalString(0, 100);
```

**Benefits:**
- Single source of truth for decimal validation
- Consistent error messages
- Easy to add custom min/max bounds
- Reusable across all schemas

---

### 2. Replace `any` Type in Savings Goals Reducer
**Issue:** Using `any[]` loses type safety in grouping logic  
**Location:** `server/api/savings-goals/index.ts:110`  
**Impact:** No compile-time checking, potential runtime errors

```typescript
// Current:
}, {} as Record<number, any[]>);

// Proposed:
}, {} as Record<number, Array<typeof goalsWithAccounts[number]>>);

// Or better, extract the type:
type SavingsGoalWithAccounts = typeof goalsWithAccounts[number];
const goalsByHousehold: Record<number, SavingsGoalWithAccounts[]> = {};
```

---

### 3. Create Shared ID Parsing Utility
**Issue:** Repeated `parseInt(id)` pattern in 15+ API endpoints  
**Location:** All `server/api/*/[id].ts` and many `index.ts` files  
**Impact:** No validation, inconsistent error handling

```typescript
// Current pattern (repeated everywhere):
const loanIdInt = parseInt(loanId);
if (!loanIdInt) {
  throw createError({ statusCode: 400, statusMessage: "Invalid loan ID" });
}

// Proposed solution in server/utils/api-helpers.ts:
export function parseIdParam(
  event: H3Event,
  paramName: string = "id"
): number {
  const id = parseInt(getRouterParam(event, paramName) || "0");
  if (!id || isNaN(id)) {
    throw createError({
      statusCode: 400,
      statusMessage: `Invalid ${paramName}`,
    });
  }
  return id;
}

// Usage:
const loanId = parseIdParam(event);
const personId = parseIdParam(event, "personId");
```

---

## 🟡 Medium Priority - Code Quality & Architecture

### 4. Create Shared Authorization Utilities
**Issue:** Duplicate household ownership verification in 10+ endpoints  
**Location:** Every API endpoint checking `households.userId`  
**Impact:** 20+ lines of repeated SQL joins and error handling

```typescript
// Current pattern (repeated everywhere):
const [personExists] = await db
  .select({ id: tables.persons.id })
  .from(tables.persons)
  .innerJoin(tables.households, eq(tables.persons.householdId, tables.households.id))
  .where(and(
    eq(tables.persons.id, parseInt(personId)),
    eq(tables.households.userId, session.user.id)
  ));

if (!personExists) {
  throw createError({
    statusCode: 403,
    statusMessage: "Access denied: Person does not belong to your household",
  });
}

// Proposed solution in server/utils/authorization.ts:
export async function verifyPersonAccess(
  session: Session,
  personId: number,
  db: DrizzleDB
): Promise<AuthorizedPerson> {
  const [person] = await db
    .select({
      id: tables.persons.id,
      name: tables.persons.name,
      householdId: tables.persons.householdId,
      userId: tables.households.userId,
    })
    .from(tables.persons)
    .innerJoin(tables.households, eq(tables.persons.householdId, tables.households.id))
    .where(eq(tables.persons.id, personId));

  if (!person || person.userId !== session.user.id) {
    throw createError({
      statusCode: 403,
      statusMessage: "Access denied: Person does not belong to your household",
    });
  }

  return person;
}

export async function verifyHouseholdAccess(
  session: Session,
  householdId: number,
  db: DrizzleDB
): Promise<Household> { /* ... */ }

export async function verifyLoanAccess(
  session: Session,
  loanId: number,
  db: DrizzleDB
): Promise<AuthorizedLoan> { /* ... */ }
```

**Benefits:**
- Single implementation of auth logic
- Consistent error messages
- Returns typed entity data
- Easy to add caching layer later

---

### 5. Extract Frequency Conversion Logic to Shared Utility
**Issue:** Duplicate frequency calculation in composables and potentially elsewhere  
**Location:** `app/composables/useHouseholdFinancials.ts:53-74`  
**Impact:** Business logic duplication, potential inconsistency

```typescript
// Create utils/financial-calculations.ts:
export const MONTHLY_MULTIPLIERS = {
  monthly: 1,
  yearly: 1 / 12,
  weekly: 4.33,
  'bi-weekly': 2.17,
  daily: 30,
} as const;

export type Frequency = keyof typeof MONTHLY_MULTIPLIERS;

export function toMonthlyAmount(
  amount: string | number,
  frequency: Frequency
): number {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return numAmount * MONTHLY_MULTIPLIERS[frequency];
}

export function fromMonthlyAmount(
  monthlyAmount: number,
  targetFrequency: Frequency
): number {
  return monthlyAmount / MONTHLY_MULTIPLIERS[targetFrequency];
}
```

---

### 6. Consolidate Financial Calculation Logic
**Issue:** Scattered calculation logic across composables  
**Location:** `app/composables/useHouseholdFinancials.ts`  
**Impact:** Hard to test, potential for bugs in complex calculations

```typescript
// Create composables/useFinancialCalculations.ts:
export function useFinancialCalculations() {
  const calculateMonthlyIncome = (incomes: SelectIncomeSource[]) => { /* ... */ };
  const calculateTotalDebt = (loans: SelectLoan[]) => { /* ... */ };
  const calculateTotalSavings = (accounts: SelectSavingsAccount[]) => { /* ... */ };
  const calculateTimeToGoal = (params: TimeToGoalParams) => { /* ... */ };
  
  return {
    calculateMonthlyIncome,
    calculateTotalDebt,
    calculateTotalSavings,
    calculateTimeToGoal,
  };
}

// Benefits: Testable in isolation, reusable across components
```

---

### 7. Standardize API Response Shapes
**Issue:** Inconsistent response structures across endpoints  
**Location:** Various API endpoints return arrays, objects, or mixed types  
**Impact:** Frontend needs different handling per endpoint

```typescript
// Proposed standard in server/utils/api-response.ts:
export interface ApiSuccessResponse<T> {
  data: T;
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
  };
}

export interface ApiErrorResponse {
  error: {
    message: string;
    code: string;
    details?: Record<string, unknown>;
  };
}

// Helper functions:
export function successResponse<T>(data: T, meta?: ApiSuccessResponse<T>['meta']) {
  return { data, ...(meta && { meta }) };
}

export function errorResponse(message: string, code: string, details?: Record<string, unknown>) {
  return { error: { message, code, details } };
}
```

---

## 🟢 Low Priority - Nice to Have

### 8. Add Request Validation Middleware
**Issue:** Manual body validation in every POST/PUT endpoint  
**Location:** All API endpoints with request bodies  
**Impact:** Verbose, easy to miss fields

```typescript
// Create server/middleware/validation.ts:
export function validateRequest<T extends z.ZodSchema>(schema: T) {
  return defineEventHandler(async (event) => {
    const body = await readBody(event);
    const result = schema.safeParse(body);
    
    if (!result.success) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation failed',
        data: result.error.format(),
      });
    }
    
    event.context.validatedBody = result.data;
    return; // Pass through to next handler
  });
}

// Usage in API routes:
export default defineEventHandler(async (event) => {
  await validateRequest(insertIncomeSourceSchema)(event);
  const data = event.context.validatedBody;
  // data is now fully typed!
});
```

---

### 9. Add Database Transaction Wrapper Utility
**Issue:** No transaction support in complex operations  
**Location:** Savings goals with linked accounts, bulk operations  
**Impact:** Potential data inconsistency if partial operations fail

```typescript
// Create server/utils/db-transactions.ts:
export async function withTransaction<T>(
  callback: (tx: DrizzleDB) => Promise<T>
): Promise<T> {
  const db = useDrizzle();
  return await db.transaction(async (tx) => {
    return await callback(tx);
  });
}

// Usage:
await withTransaction(async (tx) => {
  const [goal] = await tx.insert(savingsGoals).values({...}).returning();
  await tx.insert(savingsGoalAccounts).values(
    accountIds.map(id => ({ goalId: goal.id, accountId: id }))
  );
  return goal;
});
```

---

### 10. Create Shared Test Fixtures
**Issue:** Test data creation is verbose and repetitive  
**Location:** All test files repeat similar setup patterns  
**Impact:** Tests are longer than needed, hard to maintain

```typescript
// Create tests/fixtures/financial-data.ts:
export const FIXTURES = {
  income: {
    software_engineer: { name: 'Software Engineer', amount: '5000', frequency: 'monthly' },
    freelance: { name: 'Freelance', amount: '2000', frequency: 'monthly' },
  },
  savings: {
    emergency_fund: { name: 'Emergency Fund', currentBalance: '15000', interestRate: '2.5' },
    retirement: { name: 'Retirement', currentBalance: '100000', interestRate: '5.0' },
  },
  loans: {
    student_loan: { name: 'Student Loan', originalAmount: '30000', currentBalance: '20000', interestRate: '4.5' },
    mortgage: { name: 'Mortgage', originalAmount: '300000', currentBalance: '280000', interestRate: '3.5' },
  },
};

// Usage in tests:
await builder.addIncomeSource(FIXTURES.income.software_engineer);
```

---

### 11. Add OpenAPI/Swagger Documentation
**Issue:** No API documentation for frontend developers  
**Location:** All API endpoints  
**Impact:** Need to read code to understand API contracts

```typescript
// Use @anatine/zod-openapi or similar
// Generate OpenAPI spec from Zod schemas
// Serve Swagger UI at /api/docs
```

---

### 12. Implement Optimistic UI Updates
**Issue:** Forms feel slow due to waiting for server responses  
**Location:** All modal forms  
**Impact:** UX could be snappier

```typescript
// Pattern for modals:
const optimisticUpdate = () => {
  // Update local state immediately
  incomeSources.value.push(newIncome);
  
  // Then sync with server
  $fetch('/api/income-sources', { method: 'POST', body: newIncome })
    .catch(() => {
      // Rollback on error
      incomeSources.value = incomeSources.value.filter(i => i.id !== newIncome.id);
    });
};
```

---

## 📊 Metrics to Track

- **Type Safety Score**: Reduce `any` types to zero
- **Code Duplication**: Reduce duplicate validation/auth logic by 80%
- **Test Coverage**: Maintain 100% API endpoint coverage
- **API Response Time**: Track p95/p99 latency
- **Bundle Size**: Monitor frontend JS size

---

## 🎯 Implementation Order

**Phase 1: Foundation** (High ROI, enables other improvements)
1. Create shared Zod validation utilities (#1)
2. Create ID parsing utility (#3)
3. Create authorization utilities (#4)

**Phase 2: Quality** (Improves maintainability)
4. Extract frequency conversion logic (#5)
5. Consolidate financial calculations (#6)
6. Replace `any` types (#2)

**Phase 3: Polish** (Nice to have)
7. Add request validation middleware (#8)
8. Create shared test fixtures (#10)
9. Standardize API responses (#7)

**Phase 4: Advanced** (Future enhancements)
10. Add transaction wrapper (#9)
11. Add OpenAPI docs (#11)
12. Implement optimistic updates (#12)

---

## 🧪 Testing Strategy

For each change:
- ✅ Unit tests for utilities
- ✅ Integration tests for API changes
- ✅ E2E tests still pass (183 tests)
- ✅ Type checking passes with no errors
- ✅ No breaking changes to existing APIs

---

## 📝 Notes

- All changes should maintain backward compatibility
- Prioritize DRY (Don't Repeat Yourself) principle
- Type safety > runtime checks (fail at compile time, not runtime)
- Document patterns for future contributors
- Keep the string-first decimal approach we just implemented

---

*This is a living document. Add items as you discover them, mark completed items with ✅*
