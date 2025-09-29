import { describe, it, expect, beforeAll } from "vitest";
import { setup, $fetch } from "@nuxt/test-utils/e2e";
import {
  TestDataBuilder,
  authenticatedFetch,
  type TestUser,
} from "../../utils/test-data";
import { db } from "../../../../server/utils/drizzle";
import { households } from "../../../../database/schema";
import { eq } from "drizzle-orm";

interface Household {
  id: number;
  name: string;
  userId: string;
  createdAt: string;
}

describe("/api/households/[id]", async () => {
  await setup({
    nuxtConfig: {
      ssr: false,
    },
  });

  let testUser: TestUser;
  let secondUser: TestUser;
  let householdId: number;
  let otherHouseholdId: number;

  beforeAll(async () => {
    // Create test users with auto-generated households
    const user1Builder = await TestDataBuilder.createUser("TestUserOne");
    const user2Builder = await TestDataBuilder.createUser("TestUserTwo");

    testUser = user1Builder.build();
    secondUser = user2Builder.build();

    // Get their household IDs (already available in testUser.householdId)
    householdId = testUser.householdId;
    otherHouseholdId = secondUser.householdId;
  });

  describe("GET /api/households/[id]", () => {
    it("should return household details for owner", async () => {
      const household = await authenticatedFetch(
        testUser,
        `/api/households/${householdId}`
      );

      expect(household).toMatchObject({
        id: householdId,
        name: expect.any(String),
        userId: testUser.id,
        createdAt: expect.any(String),
      });
    });

    it("should return 401 when unauthenticated", async () => {
      const response = await $fetch(`/api/households/${householdId}`, {
        method: "GET",
        ignoreResponseError: true,
      });

      expect(response).toMatchObject({
        statusCode: 401,
        statusMessage: "Unauthorized",
      });
    });

    it("should return 404 when accessing other user's household", async () => {
      const response = await authenticatedFetch(
        testUser,
        `/api/households/${otherHouseholdId}`,
        { ignoreResponseError: true }
      );

      expect(response).toMatchObject({
        statusCode: 404,
        statusMessage: "Not Found",
      });
    });

    it("should return 400 for invalid household ID", async () => {
      const response = await authenticatedFetch(
        testUser,
        `/api/households/invalid-id`,
        { ignoreResponseError: true }
      );

      expect(response).toMatchObject({
        statusCode: 400,
        statusMessage: "Bad Request",
        message: "Household ID is required",
      });
    });

    it("should return 404 for non-existent household", async () => {
      const response = await authenticatedFetch(
        testUser,
        `/api/households/99999`,
        { ignoreResponseError: true }
      );

      expect(response).toMatchObject({
        statusCode: 404,
        statusMessage: "Not Found",
        message: "Household not found or access denied",
      });
    });
  });

  describe("PUT /api/households/[id]", () => {
    it("should update household name", async () => {
      const updateData = {
        name: "Updated Test Household",
      };

      const updatedHousehold = await authenticatedFetch(
        testUser,
        `/api/households/${householdId}`,
        {
          method: "PUT",
          body: JSON.stringify(updateData),
          headers: { "Content-Type": "application/json" },
        }
      );

      expect(updatedHousehold).toMatchObject({
        id: householdId,
        name: "Updated Test Household",
        userId: testUser.id,
      });

      // Verify the update persisted
      const household = await authenticatedFetch<Household>(
        testUser,
        `/api/households/${householdId}`
      );

      expect(household.name).toBe("Updated Test Household");
    });

    it("should return 401 when unauthenticated", async () => {
      const response = await $fetch(`/api/households/${householdId}`, {
        method: "PUT",
        body: JSON.stringify({ name: "Should not work" }),
        headers: { "Content-Type": "application/json" },
        ignoreResponseError: true,
      });

      expect(response).toMatchObject({
        statusCode: 401,
        statusMessage: "Unauthorized",
      });
    });

    it("should return 404 when updating other user's household", async () => {
      const response = await authenticatedFetch(
        testUser,
        `/api/households/${otherHouseholdId}`,
        {
          method: "PUT",
          body: JSON.stringify({ name: "Should not work" }),
          headers: { "Content-Type": "application/json" },
          ignoreResponseError: true,
        }
      );

      expect(response).toMatchObject({
        statusCode: 404,
        statusMessage: "Not Found",
      });
    });

    it("should return 400 for invalid household ID", async () => {
      const response = await authenticatedFetch(
        testUser,
        `/api/households/invalid-id`,
        {
          method: "PUT",
          body: JSON.stringify({ name: "Should not work" }),
          headers: { "Content-Type": "application/json" },
          ignoreResponseError: true,
        }
      );

      expect(response).toMatchObject({
        statusCode: 400,
        statusMessage: "Bad Request",
        message: "Household ID is required",
      });
    });

    it("should return 404 for non-existent household", async () => {
      const response = await authenticatedFetch(
        testUser,
        `/api/households/99999`,
        {
          method: "PUT",
          body: JSON.stringify({ name: "Should not work" }),
          headers: { "Content-Type": "application/json" },
          ignoreResponseError: true,
        }
      );

      expect(response).toMatchObject({
        statusCode: 404,
        statusMessage: "Not Found",
        message: "Household not found or access denied",
      });
    });

    it("should validate required fields", async () => {
      const response = await authenticatedFetch(
        testUser,
        `/api/households/${householdId}`,
        {
          method: "PUT",
          body: JSON.stringify({}),
          headers: { "Content-Type": "application/json" },
          ignoreResponseError: true,
        }
      );

      expect(response).toMatchObject({
        statusCode: 400,
        statusMessage: "Bad Request",
        message: "Name is required",
      });
    });

    it("should validate name length", async () => {
      const response = await authenticatedFetch(
        testUser,
        `/api/households/${householdId}`,
        {
          method: "PUT",
          body: JSON.stringify({ name: "" }),
          headers: { "Content-Type": "application/json" },
          ignoreResponseError: true,
        }
      );

      expect(response).toMatchObject({
        statusCode: 400,
        statusMessage: "Bad Request",
        message: "Name is required",
      });
    });
  });
});
