This project is meant to create a financial plan ranging from a couple of months to years to see the effects that different income, spendings, savings and loans. For instance, is it better to pay of a car loan than investing in stocks over two years?

The project is using TypeScript and Nuxt as both frontend and backend, it stores data in a PostgreSQL database.

Frontend stack:
Nuxt
Tailwind

Backend:
Nuxt
PostgreSQL
Drizzle ORM for type-safe database operations
Database migrations to make sure the local database can always mimic the database in production.

## Local Development Setup

### Prerequisites
- Node.js (version 18 or higher)
- Docker and Docker Compose
- npm or yarn

### Quick Start

**Bootstrap the entire development environment:**
```bash
npm run dev:up
```
This single command will:
1. Stop and remove any existing containers and volumes (clean slate)
2. Start PostgreSQL in Docker
3. Wait for the database to be ready
4. Push the database schema
5. Seed a test user account

Then start the development server:
```bash
npm run dev
```

The test user credentials are:
- Email: `test@test.com`
- Password: `Test12345!`

### Manual Setup (Step-by-Step)

If you prefer to run each step manually:

1. **Clone the repository and install dependencies:**
   ```bash
   npm install
   ```

2. **Start the local PostgreSQL database:**
   ```bash
   docker compose up -d
   ```
   This will start a PostgreSQL database with the following credentials:
   - Host: localhost:5432
   - Database: budgetdb
   - Username: budgetuser
   - Password: budgetpass

3. **Set up the database schema:**
   ```bash
   # Push the current schema to the database (for development)
   npm run db:push
   
   # OR apply migrations (for production-like setup)
   npm run db:migrate
   ```

4. **Seed a test user (optional):**
   ```bash
   npm run db:seed:test-user
   ```
   This creates a test user account that you can use to log in immediately:
   - Email: `test@test.com`
   - Password: `Test12345!`

5. **Start the development server:**
   ```bash
   npm run dev
   ```

### Database Management

The project uses Drizzle ORM for database operations. Available database scripts:

- `npm run dev:up` - **Recommended**: Full environment reset and setup (stops containers, wipes volumes, recreates schema, seeds test user)
- `npm run db:generate` - Generate migration files from schema changes
- `npm run db:migrate` - Apply pending migrations to the database
- `npm run db:push` - Push current schema directly to database (development only)
- `npm run db:studio` - Open Drizzle Studio for visual database inspection
- `npm run db:seed:test-user` - Create a demo user account (requires dev server running)

#### Resetting Your Environment

If you need a clean slate (corrupted data, schema conflicts, etc.):
```bash
npm run dev:up
```
This will:
1. Kill any running dev servers
2. Wipe all database containers and volumes
3. Recreate the database schema
4. Start a temporary dev server
5. Seed a test user via the auth API
6. Stop the temporary server

This ensures the test user is created using the exact same code path as real signups, including proper password hashing, validation, and auth hooks.

#### Seeding Test Data

The seed script creates a demo user by calling the Better Auth signup API and verifies everything through API calls. This ensures:
- **Proper bcrypt password hashing** (works with actual login)
- **All auth hooks are executed** (e.g., household creation)
- **Complete API verification** (sign-in works, household access granted)
- **Schema changes are automatically respected**
- **No direct database dependencies** (uses same APIs as the frontend)

**Note:** The `db:seed:test-user` script requires the dev server to be running. Use `npm run dev:up` for a complete automated setup.

**Default credentials:**
- Email: `test@test.com`
- Password: `Test12345!`

**Seeded test data includes:**
- **Alice** (30 years old)
  - Income: Software Engineer Salary ($5,000/month)
  - Savings: Emergency Fund ($15,000 @ 2.5%)
  - Debt: Student Loan ($20,000 balance @ 4.5%, $400/month)
- **Bob** (32 years old)
  - Income: Product Manager Salary ($6,000/month)
  - Savings: Investment Account ($25,000 @ 5.0%)
  - Debt: Car Loan ($18,000 balance @ 3.9%, $500/month)
- **Household Goal**
  - House Down Payment ($50,000 target, 2 years)
  - Current savings: $40,000 (80% of goal)

**Custom credentials via environment variables:**
```bash
SEED_TEST_USER_NAME="Jane Developer" \
SEED_TEST_USER_EMAIL="jane@example.com" \
SEED_TEST_USER_PASSWORD="SecurePass123" \
npm run db:seed:test-user
```

The script will skip creation if a user with the same email already exists.

### Development Workflow

1. Make changes to your schema files in `database/schema/`
2. For development: Run `npm run db:push` to sync changes immediately
3. For production: Run `npm run db:generate` to create migrations, then `npm run db:migrate`
4. Use `npm run db:studio` to inspect your database visually

## Testing

### Running API Tests

The project includes comprehensive end-to-end API tests using Vitest and Nuxt's testing utilities.

**Run all API tests:**
```bash
npm run test:e2e
```

**Run specific test files:**
```bash
# Test specific endpoint
npm run test:e2e -- "tests/nuxt/api/households"

# Test specific file
npm run test:e2e -- "tests/nuxt/api/households/index.test.ts"
```

**What happens when you run tests:**

1. **Test Database Setup**: Automatically creates a clean PostgreSQL test database (`budgetdb_test`)
2. **Development Server**: Starts a Nuxt dev server on port 5000 for testing
3. **Database Migration**: Applies the latest schema to the test database
4. **Test Execution**: Runs the specified tests with full authentication and database integration
5. **Cleanup**: Test database is reset between test runs for isolation

**Test Database Details:**
- Database: `budgetdb_test` (separate from development database)
- Schema: Automatically synced with your current Drizzle schema
- Data: Each test creates its own isolated test data using the TestDataBuilder pattern

**Test Coverage:**
- Authentication and authorization flows
- CRUD operations for all entities (households, persons, income sources, loans, etc.)
- Financial calculations and aggregations
- Error handling and edge cases
- Cross-user data isolation

The tests use a comprehensive TestDataBuilder pattern that automatically creates users, households, and associated financial data for realistic testing scenarios.
