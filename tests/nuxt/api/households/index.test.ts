import { describe, it, expect, beforeAll } from "vitest";
import { setup, $fetch } from "@nuxt/test-utils/e2e";
import {
  TestDataBuilder,
  authenticatedFetch,
  type TestUser,
} from "@test/nuxt/utils/test-data";
import { db } from "@s/utils/drizzle";
import { households } from "@db/schema";

interface Household {
  id: number;
  name: string;
  userId: string;
  createdAt: string | Date;
  ownerName: string;
}

interface FetchError {
  status: number;
  statusText: string;
  data?: unknown;
}

describe("/api/households integration tests", async () => {
  await setup({
    host: `http://localhost:${process.env.NUXT_DEVSERVER_PORT || 5000}`,
  });

  let testUsers: {
    user1: TestUser;
    user2: TestUser;
    userWithMultipleHouseholds: TestUser;
  };

  beforeAll(async () => {
    // Create basic test users (each gets one household automatically)
    const user1 = await TestDataBuilder.createUser("User1");
    const user2 = await TestDataBuilder.createUser("User2");
    const userWithMultiple = await TestDataBuilder.createUser("UserMultiple");

    // Create additional households for userWithMultiple to test multi-household scenarios
    await db.insert(households).values([
      {
        name: "Second Household",
        userId: userWithMultiple.getUser().id,
      },
      {
        name: "Third Household",
        userId: userWithMultiple.getUser().id,
      },
    ]);

    testUsers = {
      user1: user1.build(),
      user2: user2.build(),
      userWithMultipleHouseholds: userWithMultiple.build(),
    };
  });

  describe("GET /api/households", () => {
    it("should return 401 when no authentication provided", async () => {
      try {
        await $fetch("/api/households");
        expect.fail("Should have thrown an error");
      } catch (error) {
        const fetchError = error as FetchError;
        expect(fetchError.status).toBe(401);
        expect(fetchError.statusText).toContain("Unauthorized");
      }
    });

    it("should return households for authenticated user", async () => {
      const households = await authenticatedFetch<Household[]>(
        testUsers.userWithMultipleHouseholds,
        "/api/households"
      );

      expect(households).toHaveLength(3); // 1 auto-created + 2 additional
      expect(households).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            userId: testUsers.userWithMultipleHouseholds.id,
            ownerName: "UserMultiple",
          }),
        ])
      );

      // All households should belong to the authenticated user
      expect(
        households.every(
          (h) => h.userId === testUsers.userWithMultipleHouseholds.id
        )
      ).toBe(true);
    });

    it("should return single household for basic user", async () => {
      const households = await authenticatedFetch<Household[]>(
        testUsers.user1,
        "/api/households"
      );

      expect(households).toHaveLength(1);
      expect(households[0]).toEqual(
        expect.objectContaining({
          userId: testUsers.user1.id,
          ownerName: "User1",
        })
      );
    });

    it("should only return households owned by the authenticated user", async () => {
      const user1Households = await authenticatedFetch<Household[]>(
        testUsers.user1,
        "/api/households"
      );

      const user2Households = await authenticatedFetch<Household[]>(
        testUsers.user2,
        "/api/households"
      );

      // User 1 should have 1 household
      expect(user1Households).toHaveLength(1);
      expect(
        user1Households.every((h) => h.userId === testUsers.user1.id)
      ).toBe(true);

      // User 2 should have 1 household
      expect(user2Households).toHaveLength(1);
      expect(
        user2Households.every((h) => h.userId === testUsers.user2.id)
      ).toBe(true);

      // No cross-contamination
      expect(user1Households[0].id).not.toBe(user2Households[0].id);
    });

    it("should include proper owner information in the response", async () => {
      const households = await authenticatedFetch<Household[]>(
        testUsers.user1,
        "/api/households"
      );

      expect(households).toHaveLength(1);
      const household = households[0];
      expect(household.ownerName).toBe("User1");
      expect(household.userId).toBe(testUsers.user1.id);
    });
  });
});
