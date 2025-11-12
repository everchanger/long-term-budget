import { defineConfig } from "vitest/config";
import { defineVitestProject } from "@nuxt/test-utils/config";

import { resolve } from "path";

const r = (p: string) => resolve(__dirname, p);

export default defineConfig({
  test: {
    projects: [
      {
        resolve: {
          alias: {
            "~~": r("."),
            "~~/": r("./"),
            "@@": r("."),
            "@@/": r("./"),
            "@s": r("./server"),
            "@db": r("./database"),
            "@test": r("./tests"),
          },
        },
        test: {
          name: "unit",
          include: ["tests/{e2e,unit}/**/*.{test,spec}.ts"],
          environment: "node",
        },
      },
      await defineVitestProject({
        resolve: {
          alias: {
            "~~": r("."),
            "~~/": r("./"),
            "@@": r("."),
            "@@/": r("./"),
            "@s": r("./server"),
            "@db": r("./database"),
            "@test": r("./tests"),
          },
        },
        test: {
          name: "nuxt",
          include: ["tests/nuxt/**/*.{test,spec}.ts"],
          environment: "nuxt",
        },
      }),
    ],
  },
  resolve: {
    alias: {
      "~~": r("."),
      "~~/": r("./"),
      "@@": r("."),
      "@@/": r("./"),
      "@s": r("./server"),
      "@db": r("./database"),
      "@test": r("./tests"),
    },
  },
});
