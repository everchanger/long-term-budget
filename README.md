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

1. Make changes to your schema files in `db/schema/`
2. For development: Run `npm run db:push` to sync changes immediately
3. For production: Run `npm run db:generate` to create migrations, then `npm run db:migrate`
4. Use `npm run db:studio` to inspect your database visually
