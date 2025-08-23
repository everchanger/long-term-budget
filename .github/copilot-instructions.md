# Copilot Instructions for AI Coding Agents

## Project Overview
This project is a financial planning tool built with TypeScript and Nuxt 4, supporting both frontend and backend logic. It models scenarios over months or years, comparing the impact of income, spending, savings, and loans (e.g., paying off a car loan vs. investing in stocks).

## Architecture & Key Components
- **Frontend:** Nuxt 4 (Vue-based), styled with Tailwind CSS.
- **Backend:** Nuxt 4 server, PostgreSQL database.
- **Testing:** Vitest and the Nuxt testing utilities is used for unit tests.
- **Linting:** ESLint and Prettier are used for code quality and formatting.
- **Database:** PostgreSQL, with migrations to keep local and production schemas in sync.
- **Local Development:** Uses Docker Compose for running a local PostgreSQL instance.
- **Seed Data:** CLI tools (expected in `cmd/` directory) for populating the database.

## Developer Workflows
- **Start Local Environment:**
  - Use Docker Compose to start PostgreSQL: `docker compose up`
- **Database Migrations:**
  - Ensure migrations are run to sync schema. (Migration scripts should be referenced if present.)
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
- **Tailwind for Styling:** All UI should use Tailwind CSS utility classes.
- **Database Migration Discipline:** Always run migrations before seeding or testing against the database.

## Integration Points
- **PostgreSQL:** All persistent data is stored here; ensure connection details match local Docker setup.
- **CLI Tools:** Use for database seeding and possibly other admin tasks.

## Examples & Patterns
- **Scenario Modeling:** Core logic should allow for flexible modeling of financial scenarios over time.
- **Nuxt Pages/Components:** Look for reusable components and composables for financial calculations.
- **Migrations:** Migration scripts (if present) are critical for database changes—never edit schema directly.
- **Testing:** Ensure both frontend and backend logic is covered by unit tests.

## User needs
- **Need to support multiple persons in a household:** The application should allow modeling of financial scenarios for multiple individuals living together.
- **A user creates the household:** Users should be able to create a household and add members to it, the members are not other users just an entity in the household.
- **A person in the application can have multiple income sources, expanses, etc:** Users should be able to model various income sources, expenses, and other financial aspects for each person in the household.
- **Financial Scenario Modeling:** Users need to model various financial scenarios over time, including income, expenses, savings, and loans.
- **Data Visualization:** Users require clear visualizations of their financial data and projections.
- **User-Friendly Interface:** The application should be easy to use, with intuitive navigation and input methods.
- **Performance:** The tool must handle complex calculations efficiently, even with large datasets.

## Key Files & Directories
- `README.md`: High-level project overview and stack.
- `.github/copilot-instructions.md`: This file—update as project evolves.
- `cmd/`: CLI tools for database seeding (if/when present).
- `docker-compose.yml`: Local database setup (if/when present).
- `migrations/`: Database migration scripts (if/when present).

---
**If any section is unclear or incomplete, please provide feedback or point to missing files so this guide can be improved.**
