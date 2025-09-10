import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    testTimeout: 10000, // 10 seconds for regular tests
    setupFiles: ["./tests/setup.ts"],
    // Only exclude specific problematic files, not entire directories
    exclude: ["**/node_modules/**", "**/dist/**", "**/*.integration.test.ts"],
  },
});
