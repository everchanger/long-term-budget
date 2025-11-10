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
