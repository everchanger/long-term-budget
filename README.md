This project is meant to create a financial plan ranging from a couple of months to years to see the effects that different income, spendings, savings and loans. For instance, is it better to pay of a car loan than investing in stocks over two years?

The project is using TypeScript and Nuxt as both frontend and backend, it stores data in a PostgreSQL database.

Frontend stack:
Nuxt
Tailwind

Backend:
Nuxt
PostgreSQL
Database migrations to make sure the local database can always mimic the database in production.

Local development is achieved by using a docker compose file to run a local copy of the PostgreSQL database. Seed data can be added using a CLI tool found in the "cmd" directory.