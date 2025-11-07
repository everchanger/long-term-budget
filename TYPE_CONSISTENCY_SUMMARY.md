# Type Consistency Summary

## Overview
This project maintains consistency between database schema types, API validation, and frontend/backend code by following a clear pattern for handling decimal/numeric data.

## The Pattern

### Financial Data Flow
```
Frontend (JavaScript)
    ↓ sends number
API Endpoint (Validation)
    ↓ validates as number (Zod schema)
API Endpoint (Processing)
    ↓ converts to string (.toString())
Database (PostgreSQL)
    ↓ stores as decimal
Database (Return)
    ↓ returns as string (prevents precision loss)
Frontend
    ↓ receives string in "12345.67" format
```

### Why This Pattern?

1. **Frontend Sends Numbers**: JavaScript naturally works with numbers for calculations
2. **Validation Expects Numbers**: Zod schemas validate the incoming number format
3. **Convert to String**: API endpoints convert to string before database insertion
4. **Database Stores as Decimal**: PostgreSQL decimal type preserves precision
5. **Database Returns String**: Drizzle ORM returns decimals as strings to prevent floating-point errors

## Schema Consistency

### ✅ All Financial Entities Follow This Pattern:

- **Savings Accounts**: `currentBalance`, `monthlyDeposit`, `interestRate`
- **Loans**: `originalAmount`, `currentBalance`, `interestRate`, `monthlyPayment`
- **Savings Goals**: `targetAmount`
- **Income Sources**: `amount`
- **Expenses**: `amount`
- **Broker Accounts**: `currentValue`

### Database Schema (Drizzle)
```typescript
// All financial amounts use decimal type
currentBalance: decimal("current_balance", { precision: 12, scale: 2 })
amount: decimal("amount", { precision: 10, scale: 2 })
interestRate: decimal("interest_rate", { precision: 5, scale: 4 })
```

### Validation Schemas (Zod)
```typescript
// All validation schemas expect numbers from frontend
currentBalance: z.number().min(0, "Balance must be non-negative")
amount: z.number().min(0, "Amount must be positive")
interestRate: z.number().min(0).max(100)
```

### API Endpoints
```typescript
// All endpoints convert numbers to strings before DB insertion
.insert(table).values({
  amount: amount.toString(),
  currentBalance: currentBalance.toString(),
  interestRate: interestRate.toString()
})
```

### Test Files
```typescript
// Tests send numbers (not strings) to match frontend behavior
body: {
  targetAmount: 15000,      // ✅ Correct - number
  currentBalance: 10000,    // ✅ Correct - number
  amount: 5000             // ✅ Correct - number
}

// NOT like this:
body: {
  targetAmount: "15000",    // ❌ Wrong - string
}
```

## Recent Changes

### Added Broker Account Validation Schemas
Previously missing, now added:
- `insertBrokerAccountSchema`
- `selectBrokerAccountSchema`
- `updateBrokerAccountSchema`

### Standardized All Validation Schemas
All decimal fields now consistently expect `number` type in validation:
- Income Sources
- Expenses
- Savings Accounts
- Loans
- Savings Goals
- Broker Accounts

## Key Takeaways

1. **Frontend always sends numbers** for financial data
2. **Zod validation always expects numbers**
3. **API endpoints always convert to strings** via `.toString()`
4. **Database always stores as decimal**
5. **Database always returns strings** (via Drizzle ORM)
6. **Tests must send numbers**, not strings

## Benefits of This Approach

- ✅ Prevents floating-point precision errors
- ✅ Consistent API contract
- ✅ Type-safe validation
- ✅ Clear data flow
- ✅ Matches frontend JavaScript behavior
