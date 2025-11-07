import { describe, it, expect, beforeAll } from "vitest";
import { setup, $fetch } from "@nuxt/test-utils/e2e";
import type { InferSelectModel } from "drizzle-orm";
import type { incomeSources } from "../../../../database/schema";
import {
  TestDataBuilder,
  authenticatedFetch,
  type TestUser,
  type TestPerson,
} from "../../utils/test-data";

// Use Drizzle-inferred income source type
type IncomeSource = InferSelectModel<typeof incomeSources>;

interface FetchError {
  status: number;
  statusText: string;
  data?: unknown;
}

describe("/api/income-sources integration tests", async () => {
  await setup({
    host: `http://localhost:${process.env.NUXT_DEVSERVER_PORT || 5000}`,
  });

  let testUsers: {
    user1: TestUser & { persons: TestPerson[] };
    user2: TestUser & { persons: TestPerson[] };
  };

  beforeAll(async () => {
    // Set up test data before running tests - create two users with persons and income sources
    const user1 = await TestDataBuilder.createUser("IncomeTestUser1")
      .then((b) => b.addPerson("John Income1", 30))
      .then((b) =>
        b.addIncomeSource({
          name: "Salary John",
          amount: 5000,
          frequency: "monthly",
        })
      )
      .then((b) => b.addPerson("Jane Income1", 28))
      .then((b) =>
        b.addIncomeSource({
          name: "Freelance Jane",
          amount: 2000,
          frequency: "weekly",
        })
      );

    const user2 = await TestDataBuilder.createUser("IncomeTestUser2")
      .then((b) => b.addPerson("Bob Income2", 35))
      .then((b) =>
        b.addIncomeSource({
          name: "Salary Bob",
          amount: 6000,
          frequency: "monthly",
        })
      );

    testUsers = {
      user1: user1.build(),
      user2: user2.build(),
    };
  });

  describe("GET /api/income-sources", () => {
    it("should return 401 when no authentication provided", async () => {
      try {
        await $fetch("/api/income-sources");
        expect.fail("Should have thrown 401 error");
      } catch (error) {
        const fetchError = error as FetchError;
        expect(fetchError.status).toBe(401);
        expect(fetchError.statusText).toContain("Unauthorized");
      }
    });

    it("should only return income sources for authenticated user's persons", async () => {
      // Make request as user1 using session cookie
      const user1IncomeSources = await authenticatedFetch<IncomeSource[]>(
        testUsers.user1,
        "/api/income-sources"
      );

      // Should only get user1's income sources, not user2's
      expect(user1IncomeSources).toHaveLength(2);

      // Verify specific income sources are returned
      const incomeNames = user1IncomeSources.map((income) => income.name);
      expect(incomeNames).toContain("Salary John");
      expect(incomeNames).toContain("Freelance Jane");

      // Verify user2's income sources are NOT returned
      expect(incomeNames).not.toContain("Salary Bob");

      // Verify person IDs belong to user1's persons
      const user1PersonIds = testUsers.user1.persons.map((p) => p.id);
      expect(
        user1IncomeSources.every((income) =>
          user1PersonIds.includes(income.personId)
        )
      ).toBe(true);
    });

    it("should return different income sources for different users", async () => {
      // Get income sources for user1
      const user1IncomeSources = await authenticatedFetch<IncomeSource[]>(
        testUsers.user1,
        "/api/income-sources"
      );

      // Get income sources for user2
      const user2IncomeSources = await authenticatedFetch<IncomeSource[]>(
        testUsers.user2,
        "/api/income-sources"
      );

      // Verify each user gets different data
      expect(user1IncomeSources).toHaveLength(2);
      expect(user2IncomeSources).toHaveLength(1);

      // Verify no overlap in returned income source IDs
      const user1IncomeIds = user1IncomeSources.map((income) => income.id);
      const user2IncomeIds = user2IncomeSources.map((income) => income.id);

      expect(user1IncomeIds).not.toEqual(user2IncomeIds);
      expect(user1IncomeIds.some((id) => user2IncomeIds.includes(id))).toBe(
        false
      );
    });

    it("should return empty array when user has no income sources", async () => {
      // Create a user with persons but no income sources
      const emptyUser = await TestDataBuilder.createUser("EmptyIncomeUser")
        .then((b) => b.addPerson("Person No Income", 25))
        .then((b) => b.getUser());

      // Make request as this user
      const emptyUserIncomeSources = await authenticatedFetch<IncomeSource[]>(
        emptyUser,
        "/api/income-sources"
      );

      // Should get empty array
      expect(emptyUserIncomeSources).toEqual([]);
      expect(emptyUserIncomeSources).toHaveLength(0);
    });

    it("should return empty array when user has no persons", async () => {
      // Create a user with no persons
      const userNoPersons = await TestDataBuilder.createUser(
        "UserNoPersons"
      ).then((b) => b.getUser());

      // Make request as this user
      const userNoPersonsIncomeSources = await authenticatedFetch<
        IncomeSource[]
      >(userNoPersons, "/api/income-sources");

      // Should get empty array
      expect(userNoPersonsIncomeSources).toEqual([]);
      expect(userNoPersonsIncomeSources).toHaveLength(0);
    });
  });

  describe("POST /api/income-sources", () => {
    it("should return 401 when no authentication provided", async () => {
      try {
        await $fetch("/api/income-sources", {
          method: "POST",
          body: {
            person_id: testUsers.user1.persons[0].id,
            name: "Test Income",
            amount: 3000,
            frequency: "monthly",
          },
        });
        expect.fail("Should have thrown 401 error");
      } catch (error) {
        const fetchError = error as FetchError;
        expect(fetchError.status).toBe(401);
        expect(fetchError.statusText).toContain("Unauthorized");
      }
    });

    it("should return 400 when required fields are missing", async () => {
      try {
        await authenticatedFetch(testUsers.user1, "/api/income-sources", {
          method: "POST",
          body: {
            // Missing required fields
            person_id: testUsers.user1.persons[0].id,
          },
        });
        expect.fail("Should have thrown 400 error");
      } catch (error) {
        const fetchError = error as FetchError;
        expect(fetchError.status).toBe(400);
        expect(fetchError.statusText).toContain(
          "Name, amount, frequency, and person_id are required"
        );
      }
    });

    it("should prevent creating income source for another user's person", async () => {
      // Try to create income source for user2's person while authenticated as user1
      try {
        await authenticatedFetch(testUsers.user1, "/api/income-sources", {
          method: "POST",
          body: {
            person_id: testUsers.user2.persons[0].id, // user2's person!
            name: "Malicious Income",
            amount: 1000,
            frequency: "monthly",
          },
        });
        expect.fail("Should have thrown 403 error");
      } catch (error) {
        const fetchError = error as FetchError;
        expect(fetchError.status).toBe(403);
        expect(fetchError.statusText).toContain(
          "Access denied: Person does not belong to your household"
        );
      }
    });

    it("should allow creating income source for own person", async () => {
      const newIncomeSource = await authenticatedFetch<IncomeSource>(
        testUsers.user1,
        "/api/income-sources",
        {
          method: "POST",
          body: {
            person_id: testUsers.user1.persons[0].id,
            name: "New Side Hustle",
            amount: 1500,
            frequency: "weekly",
            start_date: "2024-01-01",
            end_date: "2024-12-31",
            is_active: true,
          },
        }
      );

      expect(newIncomeSource).toMatchObject({
        name: "New Side Hustle",
        amount: "1500.00",
        frequency: "weekly",
        personId: testUsers.user1.persons[0].id,
        isActive: true,
      });
      expect(newIncomeSource.id).toBeDefined();
      expect(newIncomeSource.createdAt).toBeDefined();
      expect(newIncomeSource.startDate).toBeDefined();
      expect(newIncomeSource.endDate).toBeDefined();
    });

    it("should create income source with minimal required fields", async () => {
      const minimalIncomeSource = await authenticatedFetch<IncomeSource>(
        testUsers.user1,
        "/api/income-sources",
        {
          method: "POST",
          body: {
            person_id: testUsers.user1.persons[1].id,
            name: "Minimal Income",
            amount: 500,
            frequency: "monthly",
          },
        }
      );

      expect(minimalIncomeSource).toMatchObject({
        name: "Minimal Income",
        amount: "500.00",
        frequency: "monthly",
        personId: testUsers.user1.persons[1].id,
        isActive: true, // Default value
      });
      expect(minimalIncomeSource.id).toBeDefined();
      expect(minimalIncomeSource.createdAt).toBeDefined();
      expect(minimalIncomeSource.startDate).toBeNull();
      expect(minimalIncomeSource.endDate).toBeNull();
    });
  });
});
