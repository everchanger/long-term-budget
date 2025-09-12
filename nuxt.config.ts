import { fileURLToPath } from "node:url";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  devServer: {
    port: process.env.NUXT_DEVSERVER_PORT
      ? parseInt(process.env.NUXT_DEVSERVER_PORT)
      : 3000,
  },
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
    "@nuxt/test-utils/module",
  ],
  runtimeConfig: {
    dbHost: "",
    dbPort: "",
    dbUser: "",
    dbPassword: "",
    dbName: "",
    dbSsl: false,
  },
});
