# API Response Standardization Refactor

**Status:** Phase 2 COMPLETE - Backend Refactored  
**Progress:** 19/19 endpoints updated (100%)  
**Breaking Change:** Yes - All API consumers will need updates

---

## 🎯 Objective

Standardize all API response formats across the application for consistency, predictability, and better developer experience.

### Current State Problems
- **Inconsistent responses:** Some endpoints return raw data, others wrap in objects
- **Unpredictable deletes:** Mix of `{ message: "..." }`, `{ success: true }`, or nothing
- **No metadata support:** Can't add pagination info without breaking changes later
- **Frontend complexity:** Each endpoint needs different handling

### Target State Benefits
- ✅ **Consistent structure:** All responses follow same pattern
- ✅ **Type-safe:** Full TypeScript support on frontend
- ✅ **Future-proof:** Easy to add metadata (pagination, counts, etc.)
- ✅ **Better DX:** Predictable API makes development faster
- ✅ **Self-documenting:** Response shape tells you what to expect

---

## 📋 New Response Standards

### Success Responses (GET/POST/PUT)
```typescript
{
  data: T,           // The actual response data
  meta?: {           // Optional metadata
    page?: number,
    pageSize?: number,
    total?: number,
    [key: string]: unknown
  }
}
```

### Delete Responses
```typescript
{
  success: true,
  message?: string   // Optional confirmation message
}
```

### Error Responses (Already standard via createError)
```typescript
{
  statusCode: number,
  statusMessage: string,
  message: string,
  // ... other error fields
}
```

---

## 🔧 Implementation Plan

### Phase 1: Preparation (No Breaking Changes)
**Status:** ✅ COMPLETE

- [] Create `server/utils/api-response.ts` with helper functions
  - `successResponse<T>(data, meta?)` - Wrap data in standard format
  - `deleteResponse(message?)` - Standard delete response
  - `paginatedResponse<T>(data, page, pageSize, total)` - With pagination
  - Type guards: `isSuccessResponse()`, `isErrorResponse()`
- [] Define TypeScript interfaces for consistency
- [] Zero TypeScript errors confirmed

**Files Created:**
- `server/utils/api-response.ts` - Ready to use

---

### Phase 2: Backend Refactor
**Status:** ✅ COMPLETE
**Estimated Time:** 2-3 hours  
**Endpoints Updated:** 19/19 files (100%)

#### 2.1 Update All API Endpoints

**Pattern to Follow:**

```typescript
// BEFORE (inconsistent):
export default defineEventHandler(async (event) => {
  const users = await db.select().from(tables.users);
  return users; // ❌ Raw array
});

export default defineEventHandler(async (event) => {
  await db.delete(tables.users).where(eq(tables.users.id, id));
  return { message: "User deleted" }; // ❌ Inconsistent
});

// AFTER (standardized):
import { successResponse, deleteResponse } from "../../utils/api-response";

export default defineEventHandler(async (event) => {
  const users = await db.select().from(tables.users);
  return successResponse(users); // ✅ Standard format { data: users }
});

export default defineEventHandler(async (event) => {
  await db.delete(tables.users).where(eq(tables.users.id, id));
  return deleteResponse("User deleted successfully"); // ✅ Standard { success: true, message: "..." }
});
```

#### 2.2 Endpoint Checklist

**GET Endpoints (raw data → wrap in `successResponse()`)**
- [x] `server/api/stats.get.ts` - Stats object ✅
- [x] `server/api/households/index.ts` (GET) - Household list ✅
- [x] `server/api/households/[id].ts` (GET) - Single household ✅
- [x] `server/api/households/[id]/financial-summary.ts` - Financial data ✅
- [x] `server/api/persons/[id].ts` (GET) - Single person ✅
- [x] `server/api/persons/index.ts` (GET) - Person list ✅
- [x] `server/api/users/[id].ts` (GET) - Single user ✅
- [x] `server/api/users/index.ts` (GET) - User list ✅
- [x] `server/api/income-sources/[id].ts` (GET) - Single income source ✅
- [x] `server/api/income-sources/index.ts` (GET) - Income source list ✅
- [x] `server/api/loans/[id].ts` (GET) - Single loan ✅
- [x] `server/api/loans/index.ts` (GET) - Loan list ✅
- [x] `server/api/savings-accounts/index.ts` (GET) - Savings account list ✅
- [x] `server/api/broker-accounts/[id].ts` (GET) - Single broker account ✅
- [x] `server/api/broker-accounts/index.ts` (GET) - Broker account list ✅
- [x] `server/api/savings-goals/[id].ts` (GET) - Single savings goal ✅
- [x] `server/api/savings-goals/index.ts` (GET) - Savings goals with accounts ✅

**POST Endpoints (return created entity → wrap in `successResponse()`)**
- [x] `server/api/persons/index.ts` (POST) - Created person ✅
- [x] `server/api/users/index.ts` (POST) - Created user ✅
- [x] `server/api/income-sources/index.ts` (POST) - Created income source ✅
- [x] `server/api/loans/index.ts` (POST) - Created loan ✅
- [x] `server/api/savings-accounts/index.ts` (POST) - Created savings account ✅
- [x] `server/api/broker-accounts/index.ts` (POST) - Created broker account ✅
- [x] `server/api/savings-goals/index.ts` (POST) - Created savings goal ✅
- [x] `server/api/savings-goals/[id]/accounts.post.ts` - Link result ✅

**PUT Endpoints (return updated entity → wrap in `successResponse()`)**
- [x] `server/api/households/[id].ts` (PUT) - Updated household ✅
- [x] `server/api/persons/[id].ts` (PUT) - Updated person ✅
- [x] `server/api/users/[id].ts` (PUT) - Updated user ✅
- [x] `server/api/income-sources/[id].ts` (PUT) - Updated income source ✅
- [x] `server/api/loans/[id].ts` (PUT) - Updated loan ✅
- [x] `server/api/broker-accounts/[id].ts` (PUT) - Updated broker account ✅
- [x] `server/api/savings-goals/[id].ts` (PUT) - Updated savings goal ✅

**DELETE Endpoints (inconsistent → use `deleteResponse()`)**
- [x] `server/api/persons/[id].ts` (DELETE) ✅
- [x] `server/api/users/[id].ts` (DELETE) ✅
- [x] `server/api/income-sources/[id].ts` (DELETE) ✅
- [x] `server/api/loans/[id].ts` (DELETE) ✅
- [x] `server/api/broker-accounts/[id].ts` (DELETE) ✅
- [x] `server/api/savings-goals/[id].ts` (DELETE) ✅

**Total:** 40 endpoint methods updated ✅

**Note:** households/index.ts POST and households/[id].ts DELETE do not exist.

#### 2.3 Import Pattern

Added to top of each file:
```typescript
import { successResponse, deleteResponse } from "../../utils/api-response";
// Or adjust path based on file depth (e.g., "../../../utils/api-response" for nested routes)
```

**TypeScript Status:** Zero compilation errors ✅

---

### Phase 3: Frontend Refactor

// AFTER (standardized):
import { successResponse, deleteResponse } from "../../utils/api-response";

export default defineEventHandler(async (event) => {
  const users = await db.select().from(tables.users);
  return successResponse(users); // ✅ Wrapped
});

**TypeScript Status:** Zero compilation errors ✅

---

### Phase 3: Test Updates
**Status:** ✅ COMPLETE
**Time Taken:** ~1 hour  
**Test Results:** 183/183 tests passing ✅

#### 3.1 Update Test Helper ✅ COMPLETE

**Updated:** `tests/nuxt/utils/test-data.ts` - `authenticatedFetch` helper
- Now automatically unwraps `response.data` for GET/POST/PUT requests  
- Returns raw response for DELETE requests (which have `.success` property)
- This means most tests work without modification!

**Pattern:**
```typescript
// Helper now handles unwrapping automatically
const response = await $fetch<unknown>(url, options);

// Unwrap ApiSuccessResponse for GET/POST/PUT (response has .data property)
if (response && typeof response === 'object' && 'data' in response) {
  return response.data as T;
}

return response as T; // DELETE responses pass through
```

#### 3.2 Updated Test Files ✅ COMPLETE

**Files Modified:**
- [x] `tests/nuxt/utils/test-data.ts` - Updated `authenticatedFetch` helper ✅
- [x] `tests/nuxt/api/persons/index.test.ts` - Removed `.data` access, tests now use unwrapped responses ✅
- [x] `tests/nuxt/api/persons/[id].test.ts` - Already had correct DELETE expectation ✅
- [x] `tests/nuxt/api/loans/[id].test.ts` - Updated DELETE expectation to include `success: true` ✅
- [x] `tests/nuxt/api/broker-accounts/[id].test.ts` - Updated DELETE expectation ✅
- [x] `tests/nuxt/api/savings-goals/[id].test.ts` - Updated DELETE expectation ✅

**Changes Made:**
1. **Test Helper Pattern:**
   - `authenticatedFetch` now returns unwrapped data for GET/POST/PUT
   - Returns raw response for DELETE (includes `{ success: true, message: "..." }`)

2. **DELETE Expectations Updated:**
   ```typescript
   // OLD:
   expect(result).toEqual({ message: "..." });
   
   // NEW:
   expect(result).toEqual({ 
     success: true, 
     message: "..." 
   });
   ```

3. **GET/POST/PUT Tests:**
   - Changed from `authenticatedFetch<ApiSuccessResponse<T>>` to `authenticatedFetch<T>`
   - Removed `.data` property access (handled automatically by helper)

#### 3.3 Test Results ✅ COMPLETE

```bash
✓ Test Files  15 passed (15)
✓ Tests      183 passed (183)
  Duration   30.98s
```

**All tests passing!** The smart helper approach worked perfectly - minimal changes needed.

---

### Phase 4: Frontend Refactor
**Status:** 🔜 NEXT - Ready to begin
**Estimated Time:** 2-3 hours  
**Files to Update:** All composables and components using `$fetch`
const response = await $fetch(`/api/users/${id}`);
const user = response.data;
```

---

### Phase 3: Test Updates
**Status:** 🔄 IN PROGRESS
**Estimated Time:** 2-3 hours  
**Test Files:** 183 tests across 6 files

#### 3.1 Update Test Expectations

**Pattern to Follow:**

```typescript
// BEFORE:
const response = await authenticatedFetch<SelectUser[]>(user, "/api/users");
expect(response).toBeInstanceOf(Array);
expect(response[0]).toMatchObject({ id: expect.any(Number) });

// AFTER:
import type { ApiSuccessResponse } from "~/server/utils/api-response";

const response = await authenticatedFetch<ApiSuccessResponse<SelectUser[]>>(
  user, 
  "/api/users"
);
expect(response).toHaveProperty("data");
expect(response.data).toBeInstanceOf(Array);
expect(response.data[0]).toMatchObject({ id: expect.any(Number) });
```

**DELETE Test Updates:**
```typescript
// BEFORE:
expect(response).toMatchObject({ message: "User deleted successfully" });
// OR:
expect(response).toMatchObject({ success: true });

// AFTER (consistent):
expect(response).toMatchObject({ 
  success: true,
  message: expect.any(String) 
});
```

#### 3.2 Test Files to Update

**Test Files in tests/api/:**
- [ ] `tests/api/database.test.ts` (if applicable)
- [ ] `tests/api/households.test.ts` (~10 tests)
- [ ] `tests/api/persons.test.ts` (~12 tests)
- [ ] `tests/api/users.test.ts` (~10 tests)
- [ ] `tests/api/users.nuxt.test.ts` (~8 tests)
- [ ] `tests/api/users.integration.test.ts` (~15 tests)

#### 3.3 Test Helper Update

Update `tests/setup.ts` if there's a test helper:
```typescript
// Add helper to unwrap standardized responses in tests
export function unwrapResponse<T>(response: ApiSuccessResponse<T>): T {
  return response.data;
}
```

---

### Phase 4: Frontend Refactor
**Status:** 🔜 NEXT - After tests pass
**Estimated Time:** 2-3 hours  
**Files to Update:** All composables and components using `$fetch`

#### 4.1 Update Composables
**Estimated Time:** 1 hour

#### 5.1 Validation Checklist
- [ ] All endpoints return standardized responses
- [ ] All tests pass (183/183)
- [ ] No TypeScript errors
- [ ] Frontend correctly unwraps `response.data`
- [ ] DELETE endpoints consistently use `deleteResponse()`
- [ ] No regression in functionality

#### 5.2 Run Full Test Suite
```bash
npm run test:e2e
npm run lint
npx tsc --noEmit
```

#### 5.3 Update Documentation
- [ ] Update README.md with new API response format
- [ ] Add examples of standardized responses
- [ ] Document breaking changes
- [ ] Update any API documentation

---

## 🚀 Execution Strategy

### Recommended Approach: **Big Bang** (All at once)

Since the app isn't live yet, do it all in one go:

1. **Create feature branch:** `git checkout -b refactor/standardize-api-responses`

2. **Backend first** (Phase 2):
   - Update all endpoints in one session
   - Add imports for `successResponse`, `deleteResponse`
   - Wrap all return statements

3. **Frontend second** (Phase 3):
   - Update all composables
   - Update all components
   - Add type imports

4. **Tests last** (Phase 4):
   - Update all test expectations
   - Run tests frequently to catch issues early

5. **Validate** (Phase 5):
   - Full test suite
   - Manual testing
   - TypeScript validation

6. **Merge:** Once everything passes, merge to main

### Time Estimate
- **Backend:** 2-3 hours
- **Frontend:** 2-3 hours  
- **Tests:** 2-3 hours
- **Validation:** 1 hour
- **Total:** 7-10 hours

### Risk Mitigation
- ✅ App not live = No user impact
- ✅ Comprehensive test suite will catch issues
- ✅ TypeScript will catch type mismatches
- ✅ Can do in feature branch and test thoroughly before merge
- ✅ Single atomic change = easier to review and revert if needed

---

## 📝 Example Transformations

### Example 1: Simple GET Endpoint

**Before:**
```typescript
// server/api/users/index.ts
export default defineEventHandler(async (event) => {
  const db = useDrizzle();
  const users = await db.select().from(tables.users);
  return users; // Returns: User[]
});
```

**After:**
```typescript
// server/api/users/index.ts
import { successResponse } from "../../utils/api-response";

export default defineEventHandler(async (event) => {
  const db = useDrizzle();
  const users = await db.select().from(tables.users);
  return successResponse(users); // Returns: { data: User[] }
});
```

**Frontend Update:**
```typescript
// BEFORE:
const { data: users } = useFetch<User[]>("/api/users");
// users.value = [...]

// AFTER:
import type { ApiSuccessResponse } from "~~/server/utils/api-response";
const { data: response } = useFetch<ApiSuccessResponse<User[]>>("/api/users");
const users = computed(() => response.value?.data ?? []);
// users.value = [...]
```

**Test Update:**
```typescript
// BEFORE:
const response = await $fetch("/api/users");
expect(Array.isArray(response)).toBe(true);

// AFTER:
const response = await $fetch("/api/users");
expect(response).toHaveProperty("data");
expect(Array.isArray(response.data)).toBe(true);
```

---

### Example 2: POST Endpoint

**Before:**
```typescript
// server/api/users/index.ts (POST)
export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const [user] = await db.insert(tables.users).values(body).returning();
  return user; // Returns: User
});
```

**After:**
```typescript
import { successResponse } from "../../utils/api-response";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const [user] = await db.insert(tables.users).values(body).returning();
  return successResponse(user); // Returns: { data: User }
});
```

**Frontend Update:**
```typescript
// BEFORE:
const newUser = await $fetch("/api/users", {
  method: "POST",
  body: userData
});
console.log(newUser.id); // Direct access

// AFTER:
const response = await $fetch("/api/users", {
  method: "POST",
  body: userData
});
console.log(response.data.id); // Access via .data
```

---

### Example 3: DELETE Endpoint

**Before:**
```typescript
// server/api/users/[id].ts (DELETE)
export default defineEventHandler(async (event) => {
  const id = parseIdParam(event, "id", "User ID is required");
  await db.delete(tables.users).where(eq(tables.users.id, id));
  return { message: "User deleted successfully" }; // Inconsistent
});
```

**After:**
```typescript
import { deleteResponse } from "../../utils/api-response";

export default defineEventHandler(async (event) => {
  const id = parseIdParam(event, "id", "User ID is required");
  await db.delete(tables.users).where(eq(tables.users.id, id));
  return deleteResponse("User deleted successfully"); // Consistent
});
```

**Test Update:**
```typescript
// BEFORE (inconsistent across files):
expect(response).toMatchObject({ message: "User deleted successfully" });
// OR:
expect(response).toMatchObject({ success: true });

// AFTER (consistent):
expect(response).toMatchObject({
  success: true,
  message: "User deleted successfully"
});
```

---

### Example 4: Paginated Response (Future)

**With Pagination Support:**
```typescript
import { paginatedResponse } from "../../utils/api-response";

export default defineEventHandler(async (event) => {
  const page = parseInt(getQuery(event).page as string) || 1;
  const pageSize = 10;
  
  const [countResult] = await db.select({ count: count() }).from(tables.users);
  const total = countResult.count;
  
  const users = await db
    .select()
    .from(tables.users)
    .limit(pageSize)
    .offset((page - 1) * pageSize);
  
  return paginatedResponse(users, page, pageSize, total);
  // Returns: { 
  //   data: User[], 
  //   meta: { page: 1, pageSize: 10, total: 45, totalPages: 5 }
  // }
});
```

---

## ✅ Success Criteria

- [ ] All 40+ endpoint methods return standardized responses
- [ ] All 183 tests pass
- [ ] Zero TypeScript errors
- [ ] Frontend correctly unwraps all `response.data`
- [ ] Consistent DELETE response format across all endpoints
- [ ] Documentation updated
- [ ] Code review completed
- [ ] Merged to main branch

---

## 🔄 Rollback Plan

If issues arise:
1. **Feature branch:** Simply don't merge, continue fixing
2. **After merge:** `git revert` the merge commit
3. **Partial completion:** Commit after each phase for granular rollback

---

## 📚 Additional Notes

### Type Safety Benefits
```typescript
// Frontend gets full type inference:
const response = await $fetch<ApiSuccessResponse<User[]>>("/api/users");
// TypeScript knows: response.data is User[]
// TypeScript knows: response.meta is optional metadata

// Error handling is type-safe too:
if (isErrorResponse(response)) {
  console.error(response.error.message);
}
```

### Future Enhancements
Once standardized, we can easily add:
- Response caching headers in `meta`
- Request IDs for debugging
- API version information
- Deprecation warnings
- Performance metrics

### Migration Script (Optional)
Could create a codemod script to automate some transformations:
```bash
# Find all return statements in API files
# Add successResponse() wrapper
# Update test expectations
```

---

**Questions or Concerns?**
- Discuss in team meeting before starting
- Estimate could vary based on complexity discovered
- Consider pairing for faster completion
- Keep communication open during refactor
