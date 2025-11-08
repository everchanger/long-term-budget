# TODO: Technical Debt & Improvement Opportunities

*Last updated: 2025-11-08*

This document tracks technical improvements, refactoring opportunities, and architectural enhancements identified by code analysis. Items are prioritized and categorized for systematic improvement.

---

## 🔴 Critical - Architecture & Code Quality

### 1. Create Interest Rate Conversion Utilities
**Status:** 🔴 Critical - Not Started  
**Issue:** Interest rate conversions (percentage ↔ decimal) are scattered across multiple API endpoints with duplicated logic  
**Location:** 
- `server/api/savings-accounts/index.ts` (lines ~53, ~70, ~149)
- `server/api/savings-accounts/[id].ts` (lines ~30, ~67)
- `server/api/loans/index.ts` (lines ~50, ~120)
- `server/api/loans/[id].ts` (lines ~30, ~82)
- `tests/nuxt/utils/test-data.ts` (lines ~264, ~306)

**Impact:** 
- DRY violation with ~10 duplicated conversion implementations
- Risk of floating-point precision errors if not handled consistently
- Harder to maintain and test conversion logic
- Easy to introduce bugs when updating conversion logic

**Current Pattern (repeated everywhere):**
```typescript
// Percentage to decimal (for storage):
String(Number(interestRate) / 100)

// Decimal to percentage (for display):
String(Math.round(Number(interestRate) * 100 * 100) / 100)
```

**Proposed Solution:**
Create `server/utils/interest-rate.ts` with utilities:
```typescript
export function percentageToDecimal(rate: string | number): string {
  return String(Number(rate) / 100);
}

export function decimalToPercentage(rate: string | number | null): string | null {
  if (rate === null) return null;
  return String(Math.round(Number(rate) * 100 * 100) / 100);
}

export function convertInterestRateForDisplay<T extends { interestRate: string | null }>(
  item: T
): T {
  return {
    ...item,
    interestRate: decimalToPercentage(item.interestRate),
  };
}
```

**Benefits:**
- Single source of truth for conversion logic
- Consistent rounding to avoid floating-point errors
- Easy to test conversion logic in isolation
- Can add validation and error handling in one place
- Type-safe with TypeScript
- Reusable across API endpoints and test utilities

---

### 2. Refactor TestDataBuilder to Use API Endpoints
**Status:** 🔴 Critical - Not Started  
**Issue:** TestDataBuilder inserts data directly into database, bypassing API logic and duplicating conversion/validation logic  
**Location:** `tests/nuxt/utils/test-data.ts` (methods: `addSavingsAccount`, `addLoan`, `addIncomeSource`, etc.)  
**Impact:**
- Test data doesn't follow same code path as production
- Duplicate conversion logic (e.g., interest rate percentage to decimal)
- If API logic changes, tests might not catch issues
- Harder to maintain consistency between tests and production

**Current Pattern:**
```typescript
// Direct database insert:
const [savingsAccount] = await db
  .insert(savingsAccounts)
  .values({
    personId: lastPerson.id,
    interestRate: data?.interestRate 
      ? String(Number(data.interestRate) / 100) 
      : "0.0002",
    // ... manual conversion logic
  })
  .returning();
```

**Proposed Solution:**
```typescript
async addSavingsAccount(data?: {
  name?: string;
  currentBalance?: string;
  interestRate?: string;
  // ...
}): Promise<TestDataBuilder> {
  const lastPerson = this.persons[this.persons.length - 1];
  if (!lastPerson) {
    throw new Error("Must add a person before adding savings account");
  }

  // Use actual API endpoint instead of direct DB insert
  const savingsAccount = await authenticatedFetch<SavingsAccount>(
    this.user!,
    '/api/savings-accounts',
    {
      method: 'POST',
      body: {
        personId: lastPerson.id,
        name: data?.name || "Test Savings",
        currentBalance: data?.currentBalance || "10000",
        interestRate: data?.interestRate || "2", // Pass as percentage
        accountType: data?.accountType || "savings",
        monthlyDeposit: data?.monthlyDeposit || null,
      }
    }
  );

  if (!lastPerson.savingsAccounts) lastPerson.savingsAccounts = [];
  lastPerson.savingsAccounts.push(savingsAccount);
  
  return this;
}
```

**Benefits:**
- Tests follow exact same code path as production
- No duplicate conversion logic
- API changes are automatically reflected in tests
- Better integration test coverage
- Easier to maintain test utilities

**Files to Update:**
- `addSavingsAccount()` → POST `/api/savings-accounts`
- `addLoan()` → POST `/api/loans`
- `addIncomeSource()` → POST `/api/income-sources`
- `addExpense()` → POST `/api/expenses`
- `addBrokerAccount()` → POST `/api/broker-accounts`

---

### 3. Investigate and Decide on Service Layer Architecture
**Status:** 🔴 Critical - Investigation Required  
**Issue:** Business logic currently lives in API route handlers, leading to potential duplication and harder testing  
**Impact:**
- Logic cannot be reused across multiple endpoints
- Harder to test business logic in isolation
- API handlers become cluttered with business logic
- Difficult to share logic between API and other contexts (CLI, background jobs, etc.)

**Questions to Answer:**
1. **Would it reduce duplication?**
   - Check for duplicate logic across endpoints (e.g., financial calculations, authorization checks)
   - Would services consolidate this logic effectively?

2. **Would it make testing easier?**
   - Can we test services in isolation without HTTP layer?
   - Would it improve test coverage and speed?

3. **Would it overcomplicate the codebase?**
   - What's the right level of abstraction for our current scale?
   - Is the added indirection worth the benefits?

4. **What would the folder structure look like?**
   - `server/services/savings-accounts.ts`?
   - `server/services/financial-calculations.ts`?
   - How to organize shared logic vs entity-specific logic?

**Research Topics:**
- Best practices for Nuxt 4/Nitro service layers
- Examples from similar codebases
- When to introduce service layer (at what scale?)
- Alternatives to full service layer (composables, utils, etc.)

**Proposed Proof of Concept:**
Refactor one entity (e.g., savings accounts) to use service layer:
```typescript
// server/services/savings-accounts.ts
export class SavingsAccountsService {
  constructor(private db: DrizzleDB) {}

  async findByPerson(personId: number, userId: string) {
    // Business logic here
  }

  async create(data: CreateSavingsAccountInput, userId: string) {
    // Validation, conversion, authorization, DB insert
  }

  async update(id: number, data: UpdateSavingsAccountInput, userId: string) {
    // Validation, conversion, authorization, DB update
  }

  async delete(id: number, userId: string) {
    // Authorization, DB delete
  }
}

// server/api/savings-accounts/index.ts
export default defineEventHandler(async (event) => {
  const service = new SavingsAccountsService(useDrizzle());
  // ... use service methods
});
```

**Decision Criteria:**
- [ ] Document pros and cons based on research
- [ ] Implement POC with one entity
- [ ] Measure: code duplication reduction, test coverage, maintainability
- [ ] Make decision: full refactor, partial adoption, or keep current structure
- [ ] Document decision and reasoning in this file

---

##  Medium Priority - Code Quality & Architecture

### 7. Standardize API Response Shapes 🚧
**Status:** INFRASTRUCTURE READY - Detailed refactor plan created  
**Issue:** Inconsistent response structures across endpoints  
**Location:** All ~40 API endpoint methods  
**Impact:** Frontend needs different handling per endpoint, harder to maintain

**Current Problems:**
- GET endpoints return raw data (arrays/objects)
- DELETE endpoints mix `{ message: "..." }` and `{ success: true }`
- No metadata support for pagination
- Each endpoint requires different frontend handling
- TypeScript types are inconsistent

**Infrastructure Completed:**
- ✅ Created `server/utils/api-response.ts` with standardization utilities
- ✅ Helper functions: `successResponse()`, `deleteResponse()`, `paginatedResponse()`
- ✅ TypeScript interfaces: `ApiSuccessResponse<T>`, `ApiDeleteResponse`
- ✅ Type guards: `isSuccessResponse()`, `isErrorResponse()`
- ✅ Detailed refactor plan: `api-refactor.md`

**Refactor Plan Created:**
📄 See `api-refactor.md` for complete implementation guide covering:
- **Phase 1:** Infrastructure (✅ Complete)
- **Phase 2:** Backend refactor (~40 endpoint methods)
- **Phase 3:** Frontend refactor (composables & components)
- **Phase 4:** Test updates (183 tests)
- **Phase 5:** Validation & documentation
- **Time Estimate:** 7-10 hours total
- **Strategy:** Big bang approach (all at once) since app not live yet
- **Examples:** Before/after code transformations
- **Rollback Plan:** Feature branch safety net

**New Standard Format:**
```typescript
// Success responses:
{ data: T, meta?: { page?, pageSize?, total?, ... } }

// Delete responses:
{ success: true, message?: string }

// Error responses (unchanged):
{ statusCode, statusMessage, message, ... }
```

**Benefits After Refactor:**
- Consistent API response format across all endpoints
- Type-safe frontend with proper TypeScript inference
- Future-proof for pagination and metadata
- Better developer experience
- Self-documenting API

**Next Steps:**
1. Review `api-refactor.md`
2. Create feature branch: `refactor/standardize-api-responses`
3. Execute phases 2-5 as outlined in plan
4. Run full test suite
5. Merge when all 183 tests pass

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
1. ✅ ~~Create shared Zod validation utilities (#1)~~ - COMPLETED 2025-11-07
2. ✅ ~~Replace `any` types (#2)~~ - COMPLETED 2025-11-07
3. ✅ ~~Create ID parsing utility (#3)~~ - COMPLETED 2025-11-07
4. Create authorization utilities (#4)

**Phase 2: Quality** (Improves maintainability)
5. Extract frequency conversion logic (#5)
6. Consolidate financial calculations (#6)

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
