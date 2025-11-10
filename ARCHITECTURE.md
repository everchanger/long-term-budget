# ARCHITECTURE.md - LLM-OPTIMIZED CODEBASE DOCUMENTATION

**CRITICAL CONTEXT FOR AI AGENTS:** This document contains structured information about repository patterns, conventions, and decision rationale. Parse this sequentially when analyzing the codebase or making changes.

**Last Updated:** 2025-11-10

---

## SYSTEM_CONTEXT

**Domain:** Financial planning tool for household budget modeling over time periods (months to years)
**Architecture:** Full-stack TypeScript monolith using Nuxt 4 (unified frontend/backend)
**Scale:** ~20 API endpoints, 10 entity types, single database, no microservices
**Primary Use Cases:**
- Multi-person household financial tracking
- Income/expense/savings/loan management
- Long-term savings goal modeling with linked accounts
- Scenario comparison (e.g., loan payoff vs investment)
- Financial projections with interest calculations

**Key Architectural Decisions:**
- USES: Utils-based architecture (NOT service layer - see ARCHITECTURAL_PATTERNS.service_layer_decision)
- USES: Drizzle ORM for type-safe database operations
- USES: Better Auth for authentication
- USES: Text/string storage for all monetary values (precision)
- USES: Decimal storage for interest rates (0.025 = 2.5%)
- CONVENTION: File-based routing for both frontend pages and API endpoints
- CONVENTION: Composables pattern for frontend state management
- CONVENTION: Thin API handlers that call utility functions

---

## TECHNOLOGY_STACK

**Core:**
- Nuxt 4: Full-stack framework (frontend: Vue 3, backend: Nitro server)
- TypeScript: All code is type-safe
- Node.js: Runtime (via Nitro)
- PostgreSQL: Primary data store
- Drizzle ORM: Type-safe database operations with migrations
- Better Auth: Authentication (session-based)

**Frontend:**
- Vue 3 (via Nuxt)
- Nuxt UI 3.X: Component library (Tailwind-based)
- Tailwind CSS: Utility-first styling
- Vue Router: File-based routing

**Backend:**
- Nitro: Server engine (Nuxt's backend)
- H3: HTTP framework (Nitro's foundation)
- Drizzle Kit: Schema migrations

**Testing:**
- Vitest: Unit tests
- @nuxt/test-utils: E2E API tests with database integration
- @vue/test-utils: Component testing
- Playwright: Browser automation (not yet implemented)

**Development:**
- ESLint: Linting
- Docker Compose: Local PostgreSQL
- Drizzle Studio: Database GUI (npm run db:studio)
- tsx: TypeScript script execution

**Key Package Versions (check package.json for current):**
- nuxt: ^4.0.3
- drizzle-orm: ^0.44.4
- better-auth: ^1.3.7
- pg: ^8.16.3
- vitest: ^3.2.4

---

## ARCHITECTURAL_PATTERNS

### service_layer_decision
**CRITICAL: This project does NOT use a service layer architecture**
**Current pattern:** Utils-based architecture with thin API handlers
**Why NOT service layer:**
- Current scale: ~20 endpoints, low complexity CRUD operations
- Strong utilities already in place: authorization.ts, api-helpers.ts, api-response.ts, interest-rate.ts, savingsGoalCalculations.ts
- Utils already eliminate duplication effectively
- Direct DB access maintains full Drizzle type inference
- No performance benefits from adding indirection
- Simpler mental model for current team size
**When to reconsider:** If project grows to 100+ endpoints or complex transaction patterns emerge

### api_handler_pattern
**Standard API endpoint structure:**
```typescript
// server/api/[entity]/index.ts or [id].ts
export default defineEventHandler(async (event) => {
  const method = getMethod(event);
  const session = await requireUserSession(event);  // Auth requirement
  const db = useDrizzle();  // Database access
  
  if (method === 'GET') {
    const id = parseIdParam(event);  // Use utility for parsing
    const resource = await verifyResourceAccessOrThrow(session, id, db);  // Use utility for authz
    return successResponse(resource);  // Use utility for response
  }
  
  if (method === 'POST') {
    const body = await readBody(event);
    await verifyParentAccessOrThrow(session, body.parentId, db);
    const [created] = await db.insert(table).values(body).returning();
    return successResponse(created);
  }
  // ... PUT, DELETE similar pattern
});
```
**Required steps:**
1. Get HTTP method
2. Require authenticated session (throws 401 if missing)
3. Parse parameters using api-helpers utilities
4. Verify authorization using authorization.ts utilities (throws 403 if denied)
5. Execute database operation using Drizzle
6. Return standardized response using api-response.ts utilities

### composable_pattern
**Frontend state management using Vue composables:**
```typescript
// app/composables/use[Entity].ts
export const useEntity = () => {
  const items = ref<Entity[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  
  const fetchItems = async (parentId: number) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await $fetch(`/api/entities?parentId=${parentId}`);
      items.value = response.data;
    } catch (e) {
      error.value = 'Failed to load';
      console.error(e);
    } finally {
      loading.value = false;
    }
  };
  
  const createItem = async (data: CreateInput) => {
    const response = await $fetch('/api/entities', { method: 'POST', body: data });
    return response.data;
  };
  
  return { items, loading, error, fetchItems, createItem };
};
```
**Usage pattern:** Import composable in component, call methods in lifecycle hooks or event handlers

### type_safe_database_pattern
**Drizzle ORM provides full type inference from schema:**
```typescript
// Define schema (database/schema/[entity].ts)
export const entities = pgTable('entities', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  amount: text('amount').notNull(),  // Text for money
});

// TypeScript automatically infers:
export type Entity = typeof entities.$inferSelect;  // { id: number; name: string; amount: string }
export type NewEntity = typeof entities.$inferInsert;  // Omit<Entity, 'id'>

// Use with full type safety (no manual type definitions needed):
const results: Entity[] = await db.select().from(entities);
```

### authorization_pattern
**Centralized authorization utilities in server/utils/authorization.ts:**
```typescript
// 1. Require session (throws 401)
const session = await requireUserSession(event);

// 2. Verify access to specific resource (throws 403)
const person = await verifyPersonAccessOrThrow(session, personId, db);
const household = await verifyHouseholdAccessOrThrow(session, householdId, db);
const account = await verifySavingsAccountAccessOrThrow(session, accountId, db);
const loan = await verifyLoanAccessOrThrow(session, loanId, db);

// 3. Use verified resource ID in queries
const items = await db.select().from(table).where(eq(table.personId, person.id));
```
**Authorization chain:** User → Household → Person → Financial Instruments
**All financial instruments verify person access, which verifies household access, which verifies user access**

---

## DIRECTORY_STRUCTURE

```
/
├── app/                          # FRONTEND: Nuxt application layer
│   ├── pages/                    # FILE-BASED ROUTES: Vue pages map to URLs
│   │   ├── index.vue            # Route: /
│   │   ├── auth.vue             # Route: /auth (login/signup)
│   │   ├── dashboard.vue        # Route: /dashboard
│   │   ├── economy.vue          # Route: /economy
│   │   ├── scenarios.vue        # Route: /scenarios
│   │   └── persons/[id].vue     # Route: /persons/:id (dynamic)
│   ├── components/              # REUSABLE VUE COMPONENTS: UI building blocks
│   │   ├── *Modal.vue           # Modal dialogs for CRUD operations
│   │   ├── *Tab.vue             # Tab content components
│   │   └── *Cards.vue           # Card-based UI components
│   ├── composables/             # FRONTEND STATE: Vue composables for API calls and state
│   │   ├── useAuth.ts           # Authentication state management
│   │   ├── useIncomeSources.ts  # Income source CRUD operations
│   │   ├── useLoans.ts          # Loan CRUD operations
│   │   ├── useSavingsAccounts.ts # Savings account CRUD operations
│   │   └── use*.ts              # Pattern: one composable per entity
│   ├── layouts/default.vue      # Default page layout (navigation, footer)
│   ├── middleware/auth.ts       # Route middleware for auth protection
│   ├── assets/css/main.css      # Global CSS styles
│   └── app.vue                  # Root Vue component
│
├── server/                       # BACKEND: Nitro server layer
│   ├── api/                     # FILE-BASED API ROUTES: File structure = URL structure
│   │   ├── auth/[...all].ts    # Route: /api/auth/* (Better Auth handler)
│   │   ├── households/         # Routes: /api/households, /api/households/:id
│   │   │   ├── index.ts        # GET/POST /api/households
│   │   │   ├── [id].ts         # GET/PUT/DELETE /api/households/:id
│   │   │   └── [id]/persons.ts # GET /api/households/:id/persons
│   │   ├── persons/            # Routes: /api/persons, /api/persons/:id
│   │   ├── income-sources/     # Routes: /api/income-sources, /api/income-sources/:id
│   │   ├── savings-accounts/   # Routes: /api/savings-accounts, /api/savings-accounts/:id
│   │   ├── savings-goals/      # Routes: /api/savings-goals, /api/savings-goals/:id
│   │   ├── loans/              # Routes: /api/loans, /api/loans/:id
│   │   └── broker-accounts/    # Routes: /api/broker-accounts, /api/broker-accounts/:id
│   ├── utils/                   # REUSABLE BACKEND LOGIC: Utility functions (NOT service layer)
│   │   ├── authorization.ts    # Access control: verify*AccessOrThrow() functions
│   │   ├── api-helpers.ts      # Request parsing: parseIdParam(), parseQueryInt()
│   │   ├── api-response.ts     # Response formatting: successResponse(), deleteResponse()
│   │   ├── drizzle.ts          # Database connection singleton: useDrizzle()
│   │   ├── interest-rate.ts    # Interest rate conversions: percentageToDecimal(), decimalToPercentage()
│   │   └── savingsGoalCalculations.ts # Financial calculations for goals
│   └── middleware/auth.ts       # Server middleware: inject session into event.context
│
├── database/                     # DATABASE LAYER: Schema and migrations
│   ├── schema/                  # DRIZZLE SCHEMA: TypeScript table definitions (source of truth)
│   │   ├── users.ts            # Table: users (Better Auth)
│   │   ├── households.ts       # Table: households
│   │   ├── persons.ts          # Table: persons
│   │   ├── income-sources.ts   # Table: income_sources
│   │   ├── expenses.ts         # Table: expenses
│   │   ├── savings-accounts.ts # Table: savings_accounts
│   │   ├── savings-goals.ts    # Table: savings_goals
│   │   ├── savings-goal-accounts.ts # Table: savings_goal_accounts (junction)
│   │   ├── loans.ts            # Table: loans
│   │   ├── broker-accounts.ts  # Table: broker_accounts
│   │   ├── scenarios.ts        # Table: scenarios
│   │   └── index.ts            # Exports all schema tables
│   ├── migrations/              # AUTO-GENERATED SQL: Do not edit manually
│   │   ├── 0000_*.sql          # Migration files
│   │   └── meta/               # Migration metadata
│   ├── index.ts                 # Database client export
│   ├── validation-helpers.ts   # Zod validation utilities
│   └── validation-schemas.ts   # Request validation schemas (Zod)
│
├── utils/                        # ISOMORPHIC UTILITIES: Shared between client and server
│   └── financial-calculations.ts # Shared calculation logic
│
├── tests/                        # TEST SUITES
│   ├── nuxt/api/                # E2E API TESTS: Full request/response with DB
│   │   ├── households/
│   │   ├── persons/
│   │   ├── income-sources/
│   │   └── utils/test-data.ts  # TestDataBuilder pattern for test data
│   ├── unit/                    # UNIT TESTS: Pure function tests without DB
│   │   ├── interest-rate.test.ts
│   │   └── *.test.ts
│   ├── e2e/                     # BROWSER TESTS: Playwright (not yet implemented)
│   └── setup.ts                 # Test configuration
│
├── scripts/                      # AUTOMATION SCRIPTS
│   ├── dev-up.sh               # Full environment reset (Docker + DB + seed)
│   ├── e2e-tests.sh            # E2E test runner with DB setup/teardown
│   ├── seed-test-user.js       # Seed test user via API
│   ├── test-db-setup.js        # Create test database
│   └── test-db-teardown.js     # Drop test database
│
├── docs/                         # DOCUMENTATION
│   └── TYPE_SHARING.md          # Type sharing patterns
│
├── .github/                      # GITHUB CONFIG
│   └── copilot-instructions.md  # AI agent guidance (concise version)
│
├── docker-compose.yml            # Local PostgreSQL setup
├── drizzle.config.ts            # Drizzle ORM configuration
├── nuxt.config.ts               # Nuxt framework configuration
├── vitest.config.ts             # Test runner configuration
├── eslint.config.mjs            # Linting rules
├── tsconfig.json                # TypeScript configuration
├── package.json                 # Dependencies and scripts
├── README.md                    # Setup and usage guide (human-focused)
└── ARCHITECTURE.md              # This file (LLM-optimized)
```

**Directory Purpose Quick Reference:**
- `app/pages/` → Add new frontend routes
- `app/components/` → Add reusable UI components
- `app/composables/` → Add client-side state management
- `server/api/` → Add new API endpoints
- `server/utils/` → Add reusable backend logic
- `database/schema/` → Add/modify database tables
- `database/migrations/` → Auto-generated, don't edit
- `tests/nuxt/api/` → Add API integration tests
- `tests/unit/` → Add utility function tests
- `utils/` → Add isomorphic code (client + server)

---

## DATA_MODEL

**Entity Hierarchy:**
User (auth) → Household → Person → [IncomeSources, Expenses, SavingsAccounts, Loans, BrokerAccounts]

**Relationships:**
1. User:Household = 1:N (user owns multiple households)
2. Household:Person = 1:N (household contains multiple members)
3. Person:FinancialInstruments = 1:N (each person has multiple income sources, expenses, accounts, loans)
4. Household:SavingsGoal = 1:N (household has multiple shared goals)
5. SavingsGoal:SavingsAccount = N:M via savings_goal_accounts junction table

**CRITICAL DISTINCTION - Users vs Persons:**
- User = Application account with authentication (email/password), owns households
- Person = Household member entity (e.g., "Alice", "Bob"), NO authentication, belongs to household
- User creates household, then adds Person entities to it
- Person is NOT another user account, just a data entity

**Schema Files (database/schema/):**
- users.ts → users table (Better Auth managed)
- households.ts → households table (user_id FK)
- persons.ts → persons table (household_id FK)
- income-sources.ts → income_sources table (person_id FK)
- expenses.ts → expenses table (person_id FK)
- savings-accounts.ts → savings_accounts table (person_id FK)
- savings-goals.ts → savings_goals table (household_id FK)
- savings-goal-accounts.ts → savings_goal_accounts junction table (goal_id FK, savings_account_id FK)
- loans.ts → loans table (person_id FK)
- broker-accounts.ts → broker_accounts table (person_id FK)
- scenarios.ts → scenarios table (household_id FK)

**Data Type Conventions:**
- PRIMARY KEYS: serial('id').primaryKey()
- FOREIGN KEYS: integer('parent_id').notNull().references(() => parentTable.id, { onDelete: 'cascade' })
- MONEY: text('amount').notNull() → Store as string (e.g., "15000.00") to avoid floating-point errors
- INTEREST RATES: text('interest_rate') → Store as decimal string (e.g., "0.025" = 2.5%)
  - API receives: "2.5" (percentage)
  - Database stores: "0.025" (decimal)
  - Use server/utils/interest-rate.ts for conversion
- TIMESTAMPS: timestamp('created_at').defaultNow().notNull()
- COLUMN NAMING: snake_case in database, camelCase in TypeScript (Drizzle auto-converts)

**Type Inference Pattern:**
```typescript
// database/schema/savings-accounts.ts
export const savingsAccounts = pgTable('savings_accounts', { /* columns */ });
export type SavingsAccount = typeof savingsAccounts.$inferSelect;  // SELECT type
export type NewSavingsAccount = typeof savingsAccounts.$inferInsert;  // INSERT type
```

**Authorization Chain:**
All financial instrument access verification follows: User → Household → Person → Instrument
Example: To access a savings account, verify user owns household that contains person who owns account

---

## API_PATTERNS

**File-based routing:** File path in server/api/ = URL path
- server/api/households/index.ts → GET/POST /api/households
- server/api/households/[id].ts → GET/PUT/DELETE /api/households/:id
- server/api/households/[id]/persons.ts → GET /api/households/:id/persons

**Standard CRUD endpoint implementation:**
```typescript
export default defineEventHandler(async (event) => {
  const method = getMethod(event);
  const session = await requireUserSession(event);  // Always require auth
  const db = useDrizzle();
  
  if (method === 'GET') {
    // List or get single resource
    const id = parseIdParam(event);  // parseIdParam() throws 400 if invalid
    const resource = await verifyResourceAccessOrThrow(session, id, db);  // Throws 403 if denied
    return successResponse(resource);  // Standardized response format
  }
  
  if (method === 'POST') {
    const body = await readBody(event);
    await verifyParentAccessOrThrow(session, body.parentId, db);
    const [created] = await db.insert(table).values(body).returning();
    return successResponse(created);
  }
  
  if (method === 'PUT') {
    const id = parseIdParam(event);
    const body = await readBody(event);
    await verifyResourceAccessOrThrow(session, id, db);
    const [updated] = await db.update(table).set(body).where(eq(table.id, id)).returning();
    return successResponse(updated);
  }
  
  if (method === 'DELETE') {
    const id = parseIdParam(event);
    await verifyResourceAccessOrThrow(session, id, db);
    await db.delete(table).where(eq(table.id, id));
    return deleteResponse('Resource deleted');
  }
});
```

**Authorization utilities (server/utils/authorization.ts):**
- requireUserSession(event) → Returns session or throws 401
- verifyHouseholdAccessOrThrow(session, householdId, db) → Returns household or throws 403
- verifyPersonAccessOrThrow(session, personId, db) → Returns person or throws 403
- verifySavingsAccountAccessOrThrow(session, accountId, db) → Returns account or throws 403
- verifyLoanAccessOrThrow(session, loanId, db) → Returns loan or throws 403

**Request parsing utilities (server/utils/api-helpers.ts):**
- parseIdParam(event, paramName = 'id', errorMessage?) → number (throws 400 if invalid)
- parseQueryInt(event, paramName, required = false, errorMessage?) → number | undefined (throws 400 if required and missing)

**Response utilities (server/utils/api-response.ts):**
- successResponse(data) → { success: true, data: {...} }
- paginatedResponse(items, total, page, pageSize) → { success: true, data: [...], meta: { total, page, pageSize, totalPages } }
- deleteResponse(message?) → { success: true, message: '...' }
- Use createError() for errors: throw createError({ statusCode: 400, statusMessage: 'Invalid input' })

**Interest rate conversion pattern:**
```typescript
import { percentageToDecimal, decimalToPercentage, convertInterestRateForDisplay } from '~/server/utils/interest-rate';

// POST: Convert percentage to decimal for storage
const interestRate = body.interestRate ? percentageToDecimal(body.interestRate) : null;
await db.insert(table).values({ ...body, interestRate });

// GET: Convert decimal to percentage for display
const accounts = await db.select().from(savingsAccounts);
return successResponse(accounts.map(convertInterestRateForDisplay));
```

---

## FRONTEND_PATTERNS

**Composable pattern (app/composables/use[Entity].ts):**
```typescript
export const useEntity = () => {
  const items = ref<Entity[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  
  const fetchItems = async (parentId: number) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await $fetch(`/api/entities?parentId=${parentId}`);
      items.value = response.data;
    } catch (e) {
      error.value = 'Failed to load items';
      console.error(e);
    } finally {
      loading.value = false;
    }
  };
  
  const createItem = async (data: CreateInput) => {
    const response = await $fetch('/api/entities', { method: 'POST', body: data });
    return response.data;
  };
  
  const updateItem = async (id: number, data: UpdateInput) => {
    const response = await $fetch(`/api/entities/${id}`, { method: 'PUT', body: data });
    return response.data;
  };
  
  const deleteItem = async (id: number) => {
    await $fetch(`/api/entities/${id}`, { method: 'DELETE' });
  };
  
  return { items, loading, error, fetchItems, createItem, updateItem, deleteItem };
};
```

**Component usage:**
```vue
<script setup lang="ts">
const route = useRoute();
const parentId = computed(() => Number(route.params.id));
const { items, loading, error, fetchItems, createItem } = useEntity();

onMounted(() => fetchItems(parentId.value));

const handleCreate = async (formData) => {
  await createItem({ parentId: parentId.value, ...formData });
  await fetchItems(parentId.value);  // Refresh
};
</script>
```

**Modal component pattern:**
```vue
<template>
  <UModal v-model="isOpen">
    <UForm :state="formState" @submit="handleSubmit">
      <!-- form fields -->
      <UButton type="submit">{{ isEditing ? 'Update' : 'Create' }}</UButton>
    </UForm>
  </UModal>
</template>

<script setup lang="ts">
const props = defineProps<{ entity?: Entity; parentId: number }>();
const emit = defineEmits<{ saved: [entity: Entity] }>();

const isOpen = ref(false);
const isEditing = computed(() => !!props.entity);
const formState = ref({ ...props.entity });

const handleSubmit = async () => {
  const { createEntity, updateEntity } = useEntities();
  if (isEditing.value) {
    const updated = await updateEntity(props.entity!.id, formState.value);
    emit('saved', updated);
  } else {
    const created = await createEntity({ ...formState.value, parentId: props.parentId });
    emit('saved', created);
  }
  isOpen.value = false;
};

defineExpose({ open: () => { isOpen.value = true; } });
</script>
```

**Authentication (app/composables/useAuth.ts):**
```typescript
export const useAuth = () => {
  const { data: session, status, signOut } = useSession();  // Better Auth composable
  const isAuthenticated = computed(() => !!session.value);
  const user = computed(() => session.value?.user);
  return { session, status, isAuthenticated, user, signOut };
};
```

**Route protection (app/middleware/auth.ts):**
```typescript
export default defineNuxtRouteMiddleware((to, from) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated.value && to.path !== '/auth') {
    return navigateTo('/auth');
  }
});
```

---

## DATABASE_PATTERNS

**Schema definition pattern (database/schema/[entity].ts):**
```typescript
import { pgTable, serial, integer, text, timestamp } from 'drizzle-orm/pg-core';
import { parentTable } from './parent-entity';

export const entities = pgTable('entities', {
  id: serial('id').primaryKey(),
  parentId: integer('parent_id').notNull().references(() => parentTable.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  amount: text('amount').notNull(),  // Text for money
  interestRate: text('interest_rate'),  // Text for decimal rates
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Entity = typeof entities.$inferSelect;
export type NewEntity = typeof entities.$inferInsert;
```

**Column naming conventions:**
- snake_case in database schema definitions
- Drizzle auto-converts to camelCase in TypeScript
- Example: created_at (DB) → createdAt (TS)

**Migration workflow:**
1. Modify schema files in database/schema/
2. Development: `npm run db:push` (skip migrations, direct sync)
3. Production: `npm run db:generate` → `npm run db:migrate`
4. Review generated SQL in database/migrations/ before applying

**Query patterns:**
```typescript
// SELECT
const items = await db.select().from(entities).where(eq(entities.parentId, parentId));

// INSERT with returning
const [created] = await db.insert(entities).values({ name: 'Test', amount: '1000' }).returning();

// UPDATE with returning
const [updated] = await db.update(entities).set({ amount: '2000' }).where(eq(entities.id, id)).returning();

// DELETE
await db.delete(entities).where(eq(entities.id, id));

// JOIN
const withParent = await db.select().from(entities)
  .innerJoin(parentTable, eq(entities.parentId, parentTable.id))
  .where(eq(parentTable.userId, userId));

// TRANSACTION (multi-step operations)
await db.transaction(async (tx) => {
  const [entity] = await tx.insert(entities).values(data).returning();
  await tx.insert(relatedTable).values({ entityId: entity.id, ...otherData });
});
```

**Database access:**
- Use `useDrizzle()` to get database instance (auto-imported in Nuxt)
- Connection details in drizzle.config.ts
- Local: PostgreSQL via Docker Compose (port 5432)
- Test: budgetdb_test database (auto-created by scripts)

**Data type best practices:**
- Money: text('amount') → Store as string ("15000.00")
- Interest rates: text('interest_rate') → Store as decimal string ("0.025" = 2.5%)
- Primary keys: serial('id').primaryKey()
- Foreign keys: integer('parent_id').references(() => parent.id, { onDelete: 'cascade' })
- Timestamps: timestamp('created_at').defaultNow().notNull()
- Required fields: .notNull()
- Optional fields: omit .notNull()

---

## TESTING_PATTERNS

**Test types:**
1. E2E API tests (tests/nuxt/api/) - Full request/response with database integration
2. Unit tests (tests/unit/) - Pure function tests without database
3. Component tests (future) - Vue component behavior
4. Browser E2E tests (future) - Playwright full application flow

**E2E API test pattern (tests/nuxt/api/[entity]/):**
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { setup, $fetch } from '@nuxt/test-utils/e2e';
import { TestDataBuilder } from '../../utils/test-data';

describe('/api/entities', async () => {
  await setup({ server: true });  // Start Nuxt server + test database
  
  let testData: TestDataBuilder;
  
  beforeEach(async () => {
    testData = new TestDataBuilder();
    await testData.createUser('test@example.com', 'password123');
    await testData.createHousehold('Test Household');
    await testData.createPerson('Alice', 30);
  });
  
  it('should create entity', async () => {
    const response = await $fetch('/api/entities', {
      method: 'POST',
      body: { personId: testData.person.id, name: 'Test', amount: '1000' },
      headers: testData.authHeaders,
    });
    
    expect(response.success).toBe(true);
    expect(response.data.name).toBe('Test');
  });
  
  it('should reject unauthorized access', async () => {
    const otherUser = new TestDataBuilder();
    await otherUser.createUser('other@example.com', 'password');
    
    await expect(() =>
      $fetch('/api/entities', {
        method: 'POST',
        body: { personId: testData.person.id, name: 'Hack' },
        headers: otherUser.authHeaders,
      })
    ).rejects.toThrow();  // Should throw 403
  });
});
```

**Unit test pattern (tests/unit/):**
```typescript
import { describe, it, expect } from 'vitest';
import { utilityFunction } from '~/server/utils/utility';

describe('utilityFunction', () => {
  it('should transform input correctly', () => {
    expect(utilityFunction('5.25')).toBe('0.0525');
  });
  
  it('should handle edge cases', () => {
    expect(utilityFunction('0')).toBe('0');
    expect(utilityFunction(null)).toBe(null);
  });
});
```

**TestDataBuilder pattern (tests/nuxt/utils/test-data.ts):**
```typescript
export class TestDataBuilder {
  user: User;
  household: Household;
  person: Person;
  authHeaders: Record<string, string>;
  
  async createUser(email: string, password: string) {
    const response = await $fetch('/api/auth/sign-up', {
      method: 'POST',
      body: { email, password, name: 'Test User' },
    });
    this.user = response.user;
    this.authHeaders = { Cookie: response.headers['set-cookie'] };
  }
  
  async createHousehold(name: string) {
    const response = await $fetch('/api/households', {
      method: 'POST',
      body: { name },
      headers: this.authHeaders,
    });
    this.household = response.data;
  }
  
  async createPerson(name: string, age: number) {
    const response = await $fetch('/api/persons', {
      method: 'POST',
      body: { householdId: this.household.id, name, age },
      headers: this.authHeaders,
    });
    this.person = response.data;
  }
}
```

**Running tests:**
- All E2E: `npm run test:e2e` (includes DB setup/teardown)
- Specific file: `npm run test:e2e -- "tests/nuxt/api/savings-accounts"`
- Unit only: `vitest run tests/unit/`
- Watch mode: `vitest watch`

**Test database:**
- Auto-created: budgetdb_test (separate from budgetdb dev database)
- Auto-migrated: Latest schema applied before tests
- Auto-isolated: Each test creates its own test data
- Cleanup: Database reset between test runs

---

## DEVELOPMENT_WORKFLOWS

**Initial setup:**
```bash
npm install
docker compose up -d  # Start PostgreSQL
npm run db:push  # Sync schema
npm run db:seed:test-user  # Optional: seed test user (test@test.com / Test12345!)
npm run dev  # Start dev server
```

**Full environment reset (use when DB corrupted or schema broken):**
```bash
npm run dev:up  # Kills servers, wipes Docker volumes, recreates schema, seeds test user
```

**Making schema changes:**
```bash
# 1. Edit database/schema/*.ts
# 2. Development sync (skip migrations):
npm run db:push
# 3. Test changes:
npm run dev
# 4. Production migrations:
npm run db:generate  # Generate SQL
# Review database/migrations/0001_*.sql
npm run db:migrate  # Apply migration
```

**Adding new API endpoint (example: expenses):**
1. Create `database/schema/expenses.ts` with pgTable definition
2. Export from `database/schema/index.ts`: `export * from './expenses';`
3. Run `npm run db:push` to sync schema
4. Create `server/api/expenses/index.ts` (GET/POST handler)
5. Create `server/api/expenses/[id].ts` (GET/PUT/DELETE handler)
6. Add authorization helper to `server/utils/authorization.ts` if needed
7. Create `app/composables/useExpenses.ts` for frontend
8. Create `tests/nuxt/api/expenses/index.test.ts` for tests
9. Run `npm run test:e2e` to verify

**Common commands:**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix linting issues
- `npm run test:e2e` - Run E2E tests
- `npm run db:generate` - Generate migrations
- `npm run db:migrate` - Apply migrations
- `npm run db:push` - Sync schema (dev only)
- `npm run db:studio` - Open Drizzle Studio GUI

---
npm run db:push

# 3. Test changes
npm run dev

# 4. Generate migration for production
npm run db:generate

# 5. Review SQL
cat database/migrations/0001_*.sql

# 6. Apply migration
npm run db:migrate
```

### Adding a New API Endpoint

**Example: Add `/api/expenses` endpoint**

1. **Create schema** (`database/schema/expenses.ts`):
```typescript
export const expenses = pgTable('expenses', {
  id: serial('id').primaryKey(),
  personId: integer('person_id')
    .notNull()
    .references(() => persons.id, { onDelete: 'cascade' }),
  category: text('category').notNull(),
  amount: text('amount').notNull(),
  frequency: text('frequency').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

2. **Export schema** (`database/schema/index.ts`):
```typescript
export * from './expenses';
```

3. **Create API handler** (`server/api/expenses/index.ts`):
```typescript
export default defineEventHandler(async (event) => {
  const method = getMethod(event);
  const session = await requireUserSession(event);
  const db = useDrizzle();
  
  if (method === 'GET') {
    const personId = parseQueryInt(event, 'personId', true);
    await verifyPersonAccessOrThrow(session, personId, db);
    
    const results = await db.select()
      .from(expenses)
      .where(eq(expenses.personId, personId));
    
    return successResponse(results);
  }
  
  if (method === 'POST') {
    const body = await readBody(event);
    await verifyPersonAccessOrThrow(session, body.personId, db);
    
    const [expense] = await db.insert(expenses)
      .values(body)
      .returning();
    
    return successResponse(expense);
  }
});
```

4. **Create API handler for single resource** (`server/api/expenses/[id].ts`):
```typescript
export default defineEventHandler(async (event) => {
  const method = getMethod(event);
  const session = await requireUserSession(event);
  const expenseId = parseIdParam(event);
  const db = useDrizzle();
  
  // Authorization helper (add to server/utils/authorization.ts)
  const expense = await verifyExpenseAccessOrThrow(session, expenseId, db);
  
  if (method === 'GET') {
    return successResponse(expense);
  }
  
  if (method === 'PUT') {
    const body = await readBody(event);
    const [updated] = await db.update(expenses)
      .set(body)
      .where(eq(expenses.id, expenseId))
      .returning();
    
    return successResponse(updated);
  }
  
  if (method === 'DELETE') {
    await db.delete(expenses).where(eq(expenses.id, expenseId));
    return deleteResponse('Expense deleted');
  }
});
```

5. **Create composable** (`app/composables/useExpenses.ts`):
```typescript
export const useExpenses = () => {
  const expenses = ref<Expense[]>([]);
  
  const fetchExpenses = async (personId: number) => {
    const response = await $fetch('/api/expenses', {
      query: { personId },
    });
    expenses.value = response.data;
  };
  
  const createExpense = async (data: CreateExpenseInput) => {
    const response = await $fetch('/api/expenses', {
      method: 'POST',
      body: data,
    });
    return response.data;
  };
  
  return { expenses, fetchExpenses, createExpense };
};
```

6. **Create tests** (`tests/nuxt/api/expenses/index.test.ts`):
```typescript
describe('/api/expenses', async () => {
  await setup({ server: true });
  
  let testData: TestDataBuilder;
  
  beforeEach(async () => {
    testData = new TestDataBuilder();
    await testData.createUser('test@example.com', 'password');
    await testData.createHousehold('Test Household');
    await testData.createPerson('Alice', 30);
  });
  
  it('should create an expense', async () => {
    const response = await $fetch('/api/expenses', {
      method: 'POST',
      body: {
        personId: testData.person.id,
        category: 'Groceries',
        amount: '500',
        frequency: 'monthly',
      },
      headers: testData.authHeaders,
    });
    
    expect(response.success).toBe(true);
    expect(response.data.category).toBe('Groceries');
  });
});
```

7. **Run tests:**
```bash
npm run test:e2e
```

---

## CODE_CONVENTIONS

**File naming:**
- Vue components: PascalCase (`SavingsAccountModal.vue`)
- Composables: camelCase with `use` prefix (`useSavingsAccounts.ts`)
- API routes: kebab-case or `[id]` (`savings-accounts/index.ts`, `[id].ts`)
- Utilities: kebab-case (`interest-rate.ts`)
- Schema files: kebab-case (`savings-accounts.ts`)
- Test files: kebab-case with `.test.ts` (`interest-rate.test.ts`)

**Import patterns:**
- Use Nuxt auto-imports when available: `useDrizzle()`, `requireUserSession()`
- Use `~/` alias for explicit imports: `import { func } from '~/server/utils/file'`
- Use `~~/` for root files: `import { auth } from '~~/lib/auth'`
- Use type imports: `import type { Type } from '~/path'`

**Error handling:**
- API errors: `throw createError({ statusCode: 400, statusMessage: 'Error' })`
- Include data: `throw createError({ statusCode: 422, statusMessage: 'Validation failed', data: { errors } })`
- Never throw raw Error in API handlers (becomes 500)
- Composables: Use try/catch, set error ref, log to console

**Database queries:**
- Always use parameterized queries (Drizzle): `where(eq(table.id, id))`
- Never use template strings for SQL
- Use transactions for multi-step operations: `await db.transaction(async (tx) => { ... })`

**Comments:**
- Use JSDoc for exported functions with @param, @returns, @example
- Avoid inline comments unless explaining complex logic
- Don't comment obvious code

**TypeScript:**
- Prefer explicit types for function parameters and returns
- Use Drizzle inferred types: `type Entity = typeof entities.$inferSelect`
- Use type imports: `import type { ... }`

---
| Vue components | PascalCase | `SavingsAccountModal.vue` |
| Composables | camelCase with `use` prefix | `useSavingsAccounts.ts` |
| API routes | kebab-case or `[id]` | `savings-accounts/index.ts`, `[id].ts` |
| Utilities | kebab-case | `interest-rate.ts` |
| Schema files | kebab-case | `savings-accounts.ts` |
| Test files | kebab-case with `.test.ts` | `interest-rate.test.ts` |

### Import Aliases

```typescript
// ✅ Use Nuxt's auto-imports when possible
const db = useDrizzle();  // No import needed
const session = await requireUserSession(event);

// ✅ Use `~/` alias for explicit imports
import { percentageToDecimal } from '~/server/utils/interest-rate';
import type { SavingsAccount } from '~/database/schema';

// ✅ Use `~~/` for root-level files
import { auth } from '~~/lib/auth';
```

### Error Handling

**Use `createError` for API errors:**
```typescript
// ✅ Good
throw createError({
  statusCode: 400,
  statusMessage: 'Invalid account ID',
});

// ✅ Good (with data)
throw createError({
  statusCode: 422,
  statusMessage: 'Validation failed',
  data: { errors: validationErrors },
});

// ❌ Bad
throw new Error('Invalid account ID');  // Becomes 500
```

**Handle errors in composables:**
```typescript
const { data, error } = await useFetch('/api/savings-accounts');

if (error.value) {
  console.error('Failed to fetch accounts:', error.value);
  // Show toast notification
}
```

### Database Queries

**Always use parameterized queries:**
```typescript
// ✅ Good (safe from SQL injection)
const accounts = await db.select()
  .from(savingsAccounts)
  .where(eq(savingsAccounts.personId, personId));

// ❌ Bad (never do this)
const accounts = await db.execute(
  `SELECT * FROM savings_accounts WHERE person_id = ${personId}`
);
```

**Use transactions for multi-step operations:**
```typescript
await db.transaction(async (tx) => {
  const [goal] = await tx.insert(savingsGoals)
    .values({ householdId, targetAmount })
    .returning();
  
  for (const accountId of savingsAccountIds) {
    await tx.insert(savingsGoalAccounts)
      .values({ goalId: goal.id, savingsAccountId: accountId });
  }
});
```

### Comments

**Use JSDoc for functions:**
```typescript
/**
 * Convert a percentage interest rate to decimal format for database storage.
 * 
 * @param rate - Interest rate as percentage (e.g., "5.25" or 5.25)
 * @returns Decimal format (e.g., "0.0525")
 * 
 * @example
 * percentageToDecimal("5.25")  // Returns "0.0525"
 * percentageToDecimal(5.25)    // Returns "0.0525"
 */
export function percentageToDecimal(rate: string | number): string {
  return String(Number(rate) / 100);
}
```

**Use inline comments sparingly:**
```typescript
// Only for complex logic that needs explanation
const roundedRate = Math.round(Number(rate) * 100 * 100) / 100;
// Multiply by 100 twice: once for percentage, once for rounding precision
```

---

## KEY_DECISIONS_RATIONALE

**Q: Why Nuxt 4?**
A: Full-stack framework with unified frontend/backend, type sharing, auto-imports, file-based routing, SSR capability

**Q: Why utils-based architecture instead of service layer?**
A: Current scale (~20 endpoints) doesn't justify service layer complexity. Utils already eliminate duplication. Direct DB access maintains full Drizzle type inference. Less abstraction = easier maintenance.

**Q: Why Drizzle ORM?**
A: Full TypeScript inference from schema, intuitive query builder, TypeScript-first migrations, minimal overhead, built-in GUI (Drizzle Studio)

**Q: Why Better Auth?**
A: Modern DX, full TypeScript support, easy customization, built for Nuxt ecosystem

**Q: Why text/string for money values?**
A: Avoid floating-point precision errors, matches PostgreSQL numeric type, financial industry standard

**Q: Why PostgreSQL?**
A: Industry-standard RDBMS, ACID compliance (critical for financial data), JSON support, strong tooling ecosystem

---

## RELATED_DOCUMENTATION

- README.md → Setup instructions, project overview (human-focused)
- .github/copilot-instructions.md → Concise AI agent guidance
- docs/TYPE_SHARING.md → Type sharing patterns
- database/SCHEMA_CONSISTENCY.md → Schema conventions

---

## MAINTENANCE_NOTES

**Update this document when:**
- New architectural patterns introduced
- Significant refactoring occurs
- New technologies added to stack
- Conventions change
- Major decisions made

**Last reviewed:** 2025-11-10
**Document purpose:** LLM-optimized codebase documentation for AI coding agents
**Target audience:** AI assistants, not human developers (see README.md for human-readable docs)
---

## Maintenance

This document should be updated when:
- New architectural patterns are introduced
- Significant refactoring occurs
- New technologies are added to the stack
- Conventions change
- Major decisions are made

**Last reviewed:** 2025-11-10
