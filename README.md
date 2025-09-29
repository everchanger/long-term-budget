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

### Getting Started

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

4. **Start the development server:**
   ```bash
   npm run dev
   ```

### Database Management

The project uses Drizzle ORM for database operations. Available database scripts:

- `npm run db:generate` - Generate migration files from schema changes
- `npm run db:migrate` - Apply pending migrations to the database
- `npm run db:push` - Push current schema directly to database (development only)
- `npm run db:studio` - Open Drizzle Studio for visual database inspection

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
