import { fileURLToPath } from "node:url";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  alias: {
    "@s": fileURLToPath(new URL("./server", import.meta.url)),
  },
  css: ["~/assets/css/main.css"],
  modules: [
    "@nuxt/eslint",
    "@nuxt/icon",
    "@nuxt/image",
    "@nuxt/test-utils",
    "@nuxt/ui",
  ],
  runtimeConfig: {
    dbHost: process.env.DB_HOST || "localhost",
    dbPort: process.env.DB_PORT || "5432",
    dbUser: process.env.DB_USER || "budgetuser",
    dbPassword: process.env.DB_PASSWORD || "budgetpass",
    dbName: process.env.DB_NAME || "budgetdb",
    dbSsl: process.env.DB_SSL === "true" || false,
  },
});
