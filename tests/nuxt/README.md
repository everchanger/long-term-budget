# Test Data Utilities

This folder contains utilities for creating test data in integration tests using real database schemas and authentication.

## TestDataBuilder - Chainable API

The `TestDataBuilder` provides a fluent, chainable API for creating test users with financial data that gets inserted into the actual test database.

### Basic Usage

#### Simple User with Persons
```typescript
import { TestDataBuilder } from '../utils/test-data';

const userData = await TestDataBuilder
  .createUser("TestUser")
  .then(b => b.addPerson("John", 30))
  .then(b => b.addPerson("Jane", 28))
  .then(b => b.build());

console.log(userData.persons.length); // 2
```

#### Just Get the User (No Financial Data)
```typescript
const user = await TestDataBuilder
  .createUser("SimpleUser")
  .then(b => b.getUser());

console.log(user.sessionCookie); // For authentication in API tests
```

### Financial Instruments

All financial instruments are inserted into the actual database with proper foreign key relationships.

#### Income Sources
```typescript
const user = await TestDataBuilder
  .createUser("IncomeUser")
  .then(b => b.addPerson("Worker", 30))
  .then(b => b.addIncomeSource({
    name: "Software Engineer",
    amount: 8000,
    frequency: "monthly",
    startDate: new Date(),
    isActive: true
  }))
  .then(b => b.addIncomeSource({
    name: "Freelance",
    amount: 2000,
    frequency: "monthly"
  }))
  .then(b => b.build());
```

#### Expenses
```typescript
const user = await TestDataBuilder
  .createUser("ExpenseUser")
  .then(b => b.addPerson("Spender", 25))
  .then(b => b.addExpense({
    name: "Rent",
    amount: 2500,
    frequency: "monthly",
    category: "housing",
    isFixed: true
  }))
  .then(b => b.addExpense({
    name: "Groceries",
    amount: 600,
    frequency: "monthly",
    category: "food",
    isFixed: false
  }))
  .then(b => b.build());
```

#### Savings Accounts
```typescript
const user = await TestDataBuilder
  .createUser("SaverUser")
  .then(b => b.addPerson("Saver", 35))
  .then(b => b.addSavingsAccount({
    name: "Emergency Fund",
    currentBalance: 15000,
    interestRate: 0.025,
    accountType: "savings"
  }))
  .then(b => b.addSavingsAccount({
    name: "Investment Account",
    currentBalance: 50000,
    interestRate: 0.07,
    accountType: "investment"
  }))
  .then(b => b.build());
```

#### Loans
```typescript
const user = await TestDataBuilder
  .createUser("BorrowerUser")
  .then(b => b.addPerson("Borrower", 28))
  .then(b => b.addLoan({
    name: "Student Loan",
    originalAmount: 45000,
    currentBalance: 42000,
    interestRate: 0.045,
    monthlyPayment: 450,
    loanType: "education",
    startDate: new Date('2020-01-01')
  }))
  .then(b => b.addLoan({
    name: "Car Loan",
    originalAmount: 25000,
    currentBalance: 18000,
    interestRate: 0.039,
    monthlyPayment: 380,
    loanType: "auto"
  }))
  .then(b => b.build());
```

### Comprehensive Financial Profile

Create a user with all types of financial data:

```typescript
const comprehensiveUser = await TestDataBuilder
  .createUser("FinancialUser")
  .then(b => b.addPerson("John Doe", 35))
  
  // Income sources
  .then(b => b.addIncomeSource({
    name: "Primary Job",
    amount: 9000,
    frequency: "monthly"
  }))
  .then(b => b.addIncomeSource({
    name: "Side Business",
    amount: 1500,
    frequency: "monthly"
  }))
  
  // Expenses
  .then(b => b.addExpense({
    name: "Mortgage",
    amount: 3200,
    frequency: "monthly",
    category: "housing",
    isFixed: true
  }))
  .then(b => b.addExpense({
    name: "Utilities",
    amount: 300,
    frequency: "monthly",
    category: "utilities"
  }))
  
  // Savings
  .then(b => b.addSavingsAccount({
    name: "Emergency Fund",
    currentBalance: 25000,
    interestRate: 0.02
  }))
  .then(b => b.addSavingsAccount({
    name: "Retirement 401k",
    currentBalance: 150000,
    interestRate: 0.08,
    accountType: "retirement"
  }))
  
  // Loans
  .then(b => b.addLoan({
    name: "Mortgage",
    originalAmount: 400000,
    currentBalance: 350000,
    interestRate: 0.035,
    monthlyPayment: 1800,
    loanType: "mortgage"
  }))
  
  .then(b => b.build());
```

### Multiple Users for Cross-User Testing

```typescript
const user1 = await TestDataBuilder
  .createUser("User1")
  .then(b => b.addPerson("Person1", 30))
  .then(b => b.addIncomeSource({ amount: 5000 }));

const user2 = await TestDataBuilder
  .createUser("User2")
  .then(b => b.addPerson("Person2A", 25))
  .then(b => b.addPerson("Person2B", 28))
  .then(b => b.addIncomeSource({ amount: 4000 }));

// Use in tests to verify cross-user authorization
const user1Data = user1.build();
const user2Data = user2.build();
```

## Common Test Patterns

Here are some common patterns you can build with `TestDataBuilder`:

```typescript
// Basic persons test (2 users with 2 persons each)
const user1 = await TestDataBuilder
  .createUser("TestUser1")
  .then(b => b.addPerson("John User1", 30))
  .then(b => b.addPerson("Jane User1", 28));

const user2 = await TestDataBuilder
  .createUser("TestUser2")
  .then(b => b.addPerson("Bob User2", 35))
  .then(b => b.addPerson("Alice User2", 32));

const testUsers = {
  user1: user1.build(),
  user2: user2.build()
};

// Comprehensive financial test (1 user with all financial data)
const financialUser = await TestDataBuilder
  .createUser("FinancialTestUser")
  .then(b => b.addPerson("John Doe", 30))
  .then(b => b.addIncomeSource({ name: "Tech Job", amount: 8000, frequency: "monthly" }))
  .then(b => b.addExpense({ name: "Rent", amount: 2000, category: "housing" }))
  .then(b => b.addSavingsAccount({ name: "Emergency Fund", currentBalance: 15000, interestRate: 0.025 }))
  .then(b => b.addLoan({ name: "Student Loan", originalAmount: 45000, interestRate: 0.045 }))
  .then(b => b.build());

// Multi-user financial comparison (wealthy vs budget users)
const wealthyUser = await TestDataBuilder
  .createUser("WealthyUser")
  .then(b => b.addPerson("Rich Person", 45))
  .then(b => b.addIncomeSource({ amount: 15000 }))
  .then(b => b.addSavingsAccount({ currentBalance: 100000 }))
  .then(b => b.build());

const budgetUser = await TestDataBuilder
  .createUser("BudgetUser")
  .then(b => b.addPerson("Budget Person", 25))
  .then(b => b.addIncomeSource({ amount: 3000 }))
  .then(b => b.addExpense({ amount: 2500 }))
  .then(b => b.build());
```

## Authentication in Tests

All created users have valid session cookies for API testing:

```typescript
const user = await TestDataBuilder.createUser("ApiUser").then(b => b.getUser());

// Use in API calls
const response = await $fetch("/api/persons", {
  headers: {
    cookie: `better-auth.session_token=${user.sessionCookie}`
  }
});
```

## Data Cleanup

Always clean up test data after tests:

```typescript
import { cleanupTestData } from '../utils/test-data';

afterAll(async () => {
  await cleanupTestData();
});
```

## Database Integration

- **Real Database Inserts**: All data is inserted into the test database using Drizzle ORM
- **Proper Foreign Keys**: Person → Income Sources/Expenses/Savings/Loans relationships work correctly
- **Database Types**: Decimal fields return as strings (e.g., "8000.00"), dates as Date objects
- **Cascade Deletes**: Cleaning up users automatically removes all related data

## Error Handling

The builder will throw errors for invalid usage patterns:

```typescript
// ❌ This will throw - must create user first
await TestDataBuilder.addPerson("John", 30);

// ❌ This will throw - must add person before financial data
await TestDataBuilder
  .createUser("User")
  .then(b => b.addIncomeSource({ amount: 5000 })); // No person added yet

// ✅ Correct usage
await TestDataBuilder
  .createUser("User")
  .then(b => b.addPerson("John", 30))
  .then(b => b.addIncomeSource({ amount: 5000 }));
```

## Best Practices

1. **Use specific names** for test users to make debugging easier
2. **Create minimal data** - only add what your specific test needs  
3. **Clean up after tests** - use `cleanupTestData()` in `afterAll`
4. **Use real values** - amounts, dates, etc. that make sense for your test scenarios
5. **Chain operations** - build complex test data step by step with the fluent API

## Available Methods

### TestDataBuilder
The chainable API for creating test data:

- `TestDataBuilder.createUser(name)` - Start the chain with a new authenticated user
- `.addPerson(name, age?)` - Add person to household (returns personId)
- `.addIncomeSource(personId, data?)` - Add income source to specific person
- `.addExpense(personId, data?)` - Add expense to specific person  
- `.addSavingsAccount(personId, data?)` - Add savings account to specific person
- `.addLoan(personId, data?)` - Add loan to specific person
- `.build()` - Get complete user data with all financial instruments
- `.getUser()` - Get just user data (for auth testing)

All methods return promises and can be chained with `.then()` for sequential operations.

### Utility Functions
- `cleanupTestData()` - Remove all test data from database (use in afterAll)
- `createTestUser(name)` - Create single authenticated user
- `createTestPerson(householdId, name, age)` - Create single person

