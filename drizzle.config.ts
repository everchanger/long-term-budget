import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './db/schema/*',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'budgetuser',
    password: process.env.DB_PASSWORD || 'budgetpass',
    database: process.env.DB_NAME || 'budgetdb',
    ssl: false,
  },
})
