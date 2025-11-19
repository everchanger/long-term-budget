import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./database/schema/*",
  out: "./database/migrations",
  dialect: "postgresql",
  dbCredentials: {
    host: process.env.NUXT_DB_HOST || "localhost",
    port: parseInt(process.env.NUXT_DB_PORT || "5432"),
    user: process.env.NUXT_DB_USER || "budgetuser",
    password: process.env.NUXT_DB_PASSWORD || "budgetpass",
    database: process.env.NUXT_DB_NAME || "budgetdb",
    ssl: process.env.NUXT_DB_SSL === "true" ? true : false,
  },
});
