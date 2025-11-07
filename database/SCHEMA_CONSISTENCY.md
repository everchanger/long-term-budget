# Database Schema Type Consistency Guide

## Standard Pattern for Decimal Fields

All financial amounts (money, percentages, etc.) follow this consistent pattern:

### The Flow
```
Frontend (number) 
  → Validation Schema (z.number()) 
  → API (.toString()) 
  → Database (decimal) 
  → Returns as string
```

### Why This Pattern?

- **Frontend**: JavaScript numbers are natural for user input and calculations
- **Validation**: Zod validates numbers before they reach the database
- **API Conversion**: `.toString()` converts to string for PostgreSQL decimal type
- **Database**: PostgreSQL `decimal` type prevents floating-point precision errors
- **Return**: Drizzle returns decimals as strings to preserve precision

### Example Implementation

```typescript
// Database Schema
amount: decimal('amount', { precision: 12, scale: 2 }).notNull()

// Validation Schema
amount: z.number().min(0, "Amount must be positive")

// API Endpoint (POST/PUT)
const { amount } = body;
await db.insert(table).values({
  amount: amount.toString(), // Convert number to string
})

// Frontend receives
{ amount: "1234.56" } // String from database
```

## Entity-Specific Patterns

### ✅ Savings Accounts
- `currentBalance`: number → string (decimal)
- `monthlyDeposit`: number → string (decimal)
- `interestRate`: number → string (decimal)

### ✅ Loans
- `originalAmount`: number → string (decimal)
- `currentBalance`: number → string (decimal)
- `interestRate`: number → string (decimal)
- `monthlyPayment`: number → string (decimal)

### ✅ Savings Goals
- `targetAmount`: number → string (decimal)

### ✅ Income Sources
- `amount`: number → string (decimal)

### ✅ Expenses
- `amount`: number → string (decimal)

### ✅ Broker Accounts
- `currentValue`: number → string (decimal)

## Validation Schema Status

All entities now have complete validation schemas:
- ✅ Users
- ✅ Households
- ✅ Persons
- ✅ Income Sources
- ✅ Expenses
- ✅ Savings Accounts
- ✅ Loans
- ✅ Broker Accounts (newly added)
- ✅ Savings Goals
- ✅ Scenarios

## Important Notes

1. **Never use JavaScript number for precise decimal arithmetic** - Always convert to string for database storage
2. **Validation happens on numbers** - More intuitive for frontend developers
3. **Database precision is preserved** - Strings prevent floating-point errors
4. **Consistency is key** - All financial fields follow the same pattern across the entire application

## Recent Consistency Fixes (Nov 7, 2025)

1. ✅ **Added broker account validation schemas** - Were completely missing
2. ✅ **Fixed savings goals POST** - Added `.toString()` for `targetAmount`
3. ✅ **Fixed savings goals PUT** - Added `.toString()` for `targetAmount`
4. ✅ **Standardized all validation schemas** - All decimal fields expect numbers
5. ✅ **Fixed seed script** - Changed `targetAmount: '50000'` to `targetAmount: 50000`
6. ✅ **Fixed frontend modals** - Convert string inputs to numbers before submission:
   - `SavingsGoalModal.vue`: Convert `targetAmount` to number
   - `SavingsAccountModal.vue`: Convert `currentBalance`, `interestRate`, `monthlyDeposit` to numbers
   - `LoanModal.vue`: Convert `originalAmount`, `currentBalance`, `interestRate`, `monthlyPayment` to numbers
   - `IncomeSourceModal.vue`: Already converting correctly ✓
7. ✅ **All 183 tests passing** - Full type consistency verified

## Common Mistakes to Avoid

❌ **DON'T** send strings in request bodies:
```javascript
body: { targetAmount: '50000' }  // Wrong!
```

✅ **DO** send numbers in request bodies:
```javascript
body: { targetAmount: 50000 }    // Correct!
```

❌ **DON'T** expect numbers in responses:
```javascript
expect(goal.targetAmount).toBe(50000)  // Wrong!
```

✅ **DO** expect strings in responses:
```javascript
expect(goal.targetAmount).toBe("50000.00")  // Correct!
```
