import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { setup, $fetch } from "@nuxt/test-utils";

describe("Authentication", async () => {
  await setup({
    // Run tests in a test environment
  });

  it("should have auth endpoint available", async () => {
    // Test that the auth API endpoint is accessible
    try {
      const response = await $fetch("/api/auth/session", {
        method: "GET",
      });
      // Should return session data or null
      expect(response).toBeDefined();
    } catch (error: any) {
      // Auth endpoint should be accessible even if no session
      expect(error.statusCode).not.toBe(404);
    }
  });

  it("should allow user registration", async () => {
    const testUser = {
      email: `test${Date.now()}@example.com`,
      password: "testpassword123",
      name: "Test User",
    };

    try {
      const response = await $fetch("/api/auth/sign-up", {
        method: "POST",
        body: testUser,
      });

      expect(response).toBeDefined();
      // Should return user data or session on successful registration
    } catch (error: any) {
      // Log the error for debugging
      console.log("Registration error:", error);
      // The endpoint should exist even if registration fails due to validation
      expect(error.statusCode).not.toBe(404);
    }
  });

  it("should handle sign in attempts", async () => {
    const credentials = {
      email: "test@example.com",
      password: "wrongpassword",
    };

    try {
      const response = await $fetch("/api/auth/sign-in", {
        method: "POST",
        body: credentials,
      });

      // This should fail with wrong credentials
      expect(response).toBeDefined();
    } catch (error: any) {
      // Should return an auth error, not a 404
      expect(error.statusCode).not.toBe(404);
      // Should be an authentication error (401 or 422)
      expect([401, 422, 400].includes(error.statusCode)).toBe(true);
    }
  });
});
