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
    "@db": fileURLToPath(new URL("./database", import.meta.url)),
    "@test": fileURLToPath(new URL("./tests", import.meta.url)),
  },
  css: ["~/assets/css/main.css"],
  modules: [
    "@nuxt/eslint",
    "@nuxt/icon",
    "@nuxt/image",
    "@nuxt/test-utils",
    "@nuxt/ui",
    "@nuxt/test-utils/module",
    "@nuxtjs/i18n",
  ],
  i18n: {
    locales: ["sv", "en"],
    defaultLocale: "sv",
    strategy: "no_prefix",
    vueI18n: "./i18n.config.ts",
  },
  runtimeConfig: {
    dbHost: "",
    dbPort: "",
    dbUser: "",
    dbPassword: "",
    dbName: "",
    dbSsl: false,
  },
});
