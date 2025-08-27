# Copilot Instructions for AI Coding Agents

## Project Overview

This project is a financial planning tool built with TypeScript and Nuxt 4, supporting both frontend and backend logic. It models scenarios over months or years, comparing the impact of income, spending, savings, and loans (e.g., paying off a car loan vs. investing in stocks).

## Architecture & Key Components

- **Frontend:** Nuxt 4 (Vue-based), Nuxt UI 3.X components, styled with Tailwind CSS.
- **Backend:** Nuxt 4 server, PostgreSQL database.
- **Database ORM:** Drizzle ORM for type-safe database operations and schema management.
- **Authentication:** Handled using Better-Auth for secure user management.
- **Testing:** Vitest and the Nuxt testing utilities is used for unit tests.
- **Linting:** ESLint and Prettier are used for code quality and formatting.
- **Database:** PostgreSQL, with Drizzle migrations to keep local and production schemas in sync.
- **Local Development:** Uses Docker Compose for running a local PostgreSQL instance.
- **Seed Data:** CLI tools (expected in `cmd/` directory) for populating the database.

## Developer Workflows

- **Start Local Environment:**
  - Use Docker Compose to start PostgreSQL: `docker compose up`
- **Database Migrations:**
  - Use Drizzle: `npm run db:migrate` to apply schema changes
  - Schema defined in TypeScript files under `db/schema/`
- **Database Operations:**
  - Use `npm run db:push` for development schema sync
  - Use `npm run db:studio` to open Drizzle Studio for database inspection
- **Seeding Data:**
  - Use CLI tools in `cmd/` (if present) to seed the database for local testing.
- **Frontend/Backend Development:**
  - Nuxt commands (`npm run dev`, `npm run build`) apply to both frontend and backend.
- **Testing:**
  - Use Vitest and the Nuxt testing utilities for unit tests, with a focus on testing both frontend and backend logic.
- **Linting:**
  - Use ESLint and Prettier for code quality and formatting.

## Project-Specific Conventions

- **Unified Nuxt Stack:** Both frontend and backend are managed in Nuxt, so shared logic/components may exist.
- **Nuxt UI Components:** Prefer using Nuxt UI 3.X components for consistency.
- **Tailwind for Styling:** All UI should use Tailwind CSS utility classes.
- **Drizzle ORM:** All database operations use Drizzle for type safety and better DX.
- **TypeScript-First Database Schema:** Schema is defined in TypeScript, migrations auto-generated.

## Integration Points

- **PostgreSQL:** All persistent data is stored here; ensure connection details match local Docker setup.
- **CLI Tools:** Use for database seeding and possibly other admin tasks.

## Examples & Patterns

- **Scenario Modeling:** Core logic should allow for flexible modeling of financial scenarios over time.
- **Nuxt Pages/Components:** Look for reusable components and composables for financial calculations.
- **Drizzle Schema:** Schema definitions in `db/schema/` provide the single source of truth for data models.
- **Type Safety:** Use Drizzle's inferred types throughout the application for compile-time safety.

## Data Model & Entity Relationships

- **Users vs Persons:**
  - **Users** are application users with authentication data (name, email, password)
  - **Persons** are household members with financial data (income, expenses, etc.)
  - A User creates and owns Households, but is NOT the same as a Person in the household
- **Household Structure:**
  - A User creates a Household and adds Person entities to it
  - Persons are NOT other application users, just entities within a household
  - A Person can have multiple income sources, expenses, savings accounts, loans, etc.
- **Financial Modeling:**
  - Each Person has their own financial profile within the household
  - Scenarios model the combined household finances over time
- **Financial Scenario Modeling:** Users need to model various financial scenarios over time, including income, expenses, savings, and loans.
- **Data Visualization:** Users require clear visualizations of their financial data and projections.
- **User-Friendly Interface:** The application should be easy to use, with intuitive navigation and input methods.
- **Performance:** The tool must handle complex calculations efficiently, even with large datasets.

## Key Files & Directories

- `README.md`: High-level project overview and stack.
- `.github/copilot-instructions.md`: This file—update as project evolves.
- `cmd/`: CLI tools for database seeding (if/when present).
- `docker-compose.yml`: Local database setup (if/when present).
- `db/schema/`: Drizzle schema definitions (TypeScript-first).
- `drizzle.config.ts`: Drizzle configuration file.

---

**If any section is unclear or incomplete, please provide feedback or point to missing files so this guide can be improved.**
