# Type Sharing Between Frontend and Backend

## Overview

This project uses **Zod schemas as the single source of truth** for type definitions across the entire stack. This eliminates type duplication and ensures consistency between frontend, backend, and database layers.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  database/validation-schemas.ts (Single Source of Truth)   │
│  - Zod schemas for all entities                            │
│  - Type exports via z.infer<typeof schema>                 │
└─────────────────────────────────────────────────────────────┘
                              │
                 ┌────────────┴────────────┐
                 ▼                         ▼
        ┌────────────────┐        ┌────────────────┐
        │   Backend API  │        │   Frontend     │
        │   - Validates  │        │   - Type-safe  │
        │   - Transforms │        │   - Reuses     │
        └────────────────┘        └────────────────┘
```

## Key Files

- **`database/validation-schemas.ts`**: All Zod schemas and type exports
- **Frontend Modals**: Import and use the exported types
- **Backend APIs**: Import and use schemas for validation

## Type Patterns

### 1. Schema Definitions (database/validation-schemas.ts)

```typescript
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { savingsGoals } from "./schema/savings-goals";

// Create schemas from Drizzle table definitions
export const insertSavingsGoalSchema = createInsertSchema(savingsGoals, {
  name: z.string().min(1, "Goal name is required"),
  targetAmount: z.number().min(0, "Target amount must be non-negative"),
  // ... other field validations
});

export const selectSavingsGoalSchema = createSelectSchema(savingsGoals);

export const updateSavingsGoalSchema = insertSavingsGoalSchema
  .partial()
  .omit({ id: true, createdAt: true, updatedAt: true, householdId: true });

// Export TypeScript types inferred from Zod schemas
export type InsertSavingsGoal = z.infer<typeof insertSavingsGoalSchema>;
export type SelectSavingsGoal = z.infer<typeof selectSavingsGoalSchema>;
export type UpdateSavingsGoal = z.infer<typeof updateSavingsGoalSchema>;
```

### 2. Frontend Usage (Vue Components)

```typescript
import type {
  SelectSavingsGoal,
  InsertSavingsGoal,
} from "~~/database/validation-schemas";

// Form state uses strings for HTML input compatibility
type FormState = {
  name: string;
  targetAmount: string | number; // HTML inputs return strings
  // ... other fields
};

interface Props {
  editingGoal?: SelectSavingsGoal | null; // For viewing/editing
}

interface Emits {
  submit: [data: Omit<InsertSavingsGoal, "householdId">]; // For creating/updating
}
```

### 3. Backend Usage (API Endpoints)

```typescript
import {
  insertSavingsGoalSchema,
  selectSavingsGoalSchema,
} from "~~/database/validation-schemas";

// Validate incoming data
const validatedData = insertSavingsGoalSchema.parse(body);

// TypeScript knows the exact shape of validatedData
// No need for manual type assertions
```

## Benefits

### ✅ Single Source of Truth
- Define types once in `validation-schemas.ts`
- Frontend and backend automatically stay in sync
- No duplicate interface definitions

### ✅ Compile-Time Safety
- TypeScript catches type mismatches at compile time
- Refactoring is safer - TypeScript shows all affected code
- IDE autocomplete works perfectly

### ✅ Runtime Validation
- Zod provides runtime validation in API endpoints
- Ensures data integrity at system boundaries
- Clear error messages for validation failures

### ✅ DRY Principle
- No more copying types between files
- Changes to schema automatically propagate
- Less code to maintain

## Common Patterns

### Pattern 1: Form State vs. Submit Data

HTML inputs bind to strings, but our schemas expect numbers. Handle this with a helper:

```typescript
// Helper to convert string | number to number
const toNumber = (value: string | number): number =>
  typeof value === "string" ? parseFloat(value) : value;

// Form state
type FormState = {
  amount: string | number; // Accommodates both Vue v-model and programmatic updates
};

// On submit, convert to the schema type
const handleSubmit = () => {
  emit("submit", {
    amount: toNumber(formState.amount),
  });
};
```

### Pattern 2: Partial Types for Updates

```typescript
// Use Omit to remove fields the frontend shouldn't provide
type SubmitData = Omit<InsertEntity, "userId" | "createdAt">;
```

### Pattern 3: Pick for Subset of Fields

```typescript
// When only submitting a subset of fields
type SubmitData = Pick<InsertLoan, "name" | "amount" | "interestRate">;
```

## Migration Guide

### Before (Duplicated Types)
```typescript
// ❌ In modal component
interface SavingsGoalFormData {
  name: string;
  targetAmount: number;
  priority: number;
  // ...
}

// ❌ In API endpoint
interface CreateSavingsGoalRequest {
  name: string;
  targetAmount: number;
  priority: number;
  // ...
}
```

### After (Shared Types)
```typescript
// ✅ In validation-schemas.ts (once)
export const insertSavingsGoalSchema = createInsertSchema(savingsGoals, {
  name: z.string().min(1),
  targetAmount: z.number().min(0),
  priority: z.number().int().min(1).max(3),
});
export type InsertSavingsGoal = z.infer<typeof insertSavingsGoalSchema>;

// ✅ In modal component
import type { InsertSavingsGoal } from "~~/database/validation-schemas";
interface Emits {
  submit: [data: Omit<InsertSavingsGoal, "householdId">];
}

// ✅ In API endpoint
import { insertSavingsGoalSchema } from "~~/database/validation-schemas";
const data = insertSavingsGoalSchema.parse(body);
```

## Current Status

All modal components now use shared types:
- ✅ `SavingsGoalModal.vue`
- ✅ `SavingsAccountModal.vue`
- ✅ `LoanModal.vue`
- ✅ `IncomeSourceModal.vue`

All have been refactored to:
1. Import types from `validation-schemas.ts`
2. Use `FormState` type for HTML input compatibility
3. Emit properly typed data using `InsertEntity` or `UpdateEntity` types

## Best Practices

1. **Always import types from `validation-schemas.ts`**
   - Never duplicate type definitions
   - Trust the Zod schema as the source of truth

2. **Use type utilities (`Omit`, `Pick`, `Partial`) for variations**
   - Don't create new interfaces when schema types can be transformed
   - Example: `Omit<InsertEntity, "userId">` for frontend submissions

3. **Handle string-to-number conversions explicitly**
   - Use the `toNumber` helper for consistency
   - Document why conversions are needed (HTML inputs)

4. **Leverage TypeScript inference**
   - Let `z.infer<typeof schema>` generate types automatically
   - No need to manually keep types in sync with schemas

5. **Update schemas first**
   - When adding/removing fields, update the Zod schema
   - TypeScript will show you everywhere that needs updating

## Future Improvements

- [ ] Consider creating a shared type utilities file for common patterns
- [ ] Add JSDoc comments to exported types for better IDE hints
- [ ] Create custom Zod transforms for common conversions (string → number)
- [ ] Generate OpenAPI schema from Zod schemas for API documentation
