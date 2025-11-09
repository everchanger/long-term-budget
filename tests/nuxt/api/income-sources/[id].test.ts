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

describe("/api/income-sources/[id] integration tests", async () => {
  await setup({
    host: `http://localhost:${process.env.NUXT_DEVSERVER_PORT || 5000}`,
  });

  let testUsers: {
    user1: TestUser & { persons: TestPerson[] };
    user2: TestUser & { persons: TestPerson[] };
  };

  beforeAll(async () => {
    // Set up test data - create two users with persons and income sources
    const user1 = await TestDataBuilder.createUser("IncomeIdTestUser1")
      .then((b) => b.addPerson("John Income1", 30))
      .then((b) =>
        b.addIncomeSource({
          name: "Salary John",
          amount: "5000",
          frequency: "monthly",
        })
      )
      .then((b) => b.addPerson("Jane Income1", 28))
      .then((b) =>
        b.addIncomeSource({
          name: "Freelance Jane",
          amount: "2000",
          frequency: "weekly",
        })
      );

    const user2 = await TestDataBuilder.createUser("IncomeIdTestUser2")
      .then((b) => b.addPerson("Bob Income2", 35))
      .then((b) =>
        b.addIncomeSource({
          name: "Salary Bob",
          amount: "6000",
          frequency: "monthly",
        })
      );

    testUsers = {
      user1: user1.build(),
      user2: user2.build(),
    };
  });

  describe("GET /api/income-sources/[id]", () => {
    it("should return 401 when no authentication provided", async () => {
      const incomeSourceId = testUsers.user1.persons[0].incomeSources![0].id;

      try {
        await $fetch(`/api/income-sources/${incomeSourceId}`);
        expect.fail("Should have thrown 401 error");
      } catch (error) {
        const fetchError = error as FetchError;
        expect(fetchError.status).toBe(401);
        expect(fetchError.statusText).toContain("Unauthorized");
      }
    });

    it("should return income source when user owns the person", async () => {
      const incomeSource = testUsers.user1.persons[0].incomeSources![0];

      const fetchedIncomeSource = await authenticatedFetch<IncomeSource>(
        testUsers.user1,
        `/api/income-sources/${incomeSource.id}`
      );

      expect(fetchedIncomeSource).toMatchObject({
        id: incomeSource.id,
        name: "Salary John",
        amount: "5000.00",
        frequency: "monthly",
        personId: testUsers.user1.persons[0].id,
        isActive: true,
      });
      expect(fetchedIncomeSource.createdAt).toBeDefined();
    });

    it("should return 403 when income source belongs to another user's person", async () => {
      const user2IncomeSourceId =
        testUsers.user2.persons[0].incomeSources![0].id;

      try {
        await authenticatedFetch(
          testUsers.user1,
          `/api/income-sources/${user2IncomeSourceId}`
        );
        expect.fail("Should have thrown 403 error");
      } catch (error) {
        const fetchError = error as FetchError;
        expect(fetchError.status).toBe(403);
        expect(fetchError.statusText).toContain(
          "Access denied: Person does not belong to your household"
        );
      }
    });

    it("should return 404 when income source does not exist", async () => {
      const nonExistentId = 999;

      try {
        await authenticatedFetch(
          testUsers.user1,
          `/api/income-sources/${nonExistentId}`
        );
        expect.fail("Should have thrown 404 error");
      } catch (error) {
        const fetchError = error as FetchError;
        expect(fetchError.status).toBe(404);
        expect(fetchError.statusText).toContain("Income source not found");
      }
    });

    it("should return 400 for invalid income source ID", async () => {
      try {
        await authenticatedFetch(
          testUsers.user1,
          `/api/income-sources/invalid`
        );
        expect.fail("Should have thrown 400 error");
      } catch (error) {
        const fetchError = error as FetchError;
        expect(fetchError.status).toBe(400);
        expect(fetchError.statusText).toContain("Income source ID is required");
      }
    });
  });

  describe("PUT /api/income-sources/[id]", () => {
    it("should return 401 when no authentication provided", async () => {
      const incomeSourceId = testUsers.user1.persons[0].incomeSources![0].id;

      try {
        await $fetch(`/api/income-sources/${incomeSourceId}`, {
          method: "PUT",
          body: {
            name: "Updated Salary",
            amount: "5500",
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

    it("should update income source when user owns it", async () => {
      const incomeSource = testUsers.user1.persons[1].incomeSources![0]; // Jane's freelance

      const updatedIncomeSource = await authenticatedFetch<IncomeSource>(
        testUsers.user1,
        `/api/income-sources/${incomeSource.id}`,
        {
          method: "PUT",
          body: {
            name: "Updated Freelance",
            amount: "2500",
            frequency: "weekly",
            startDate: "2024-01-01",
            endDate: "2024-12-31",
            isActive: true,
          },
        }
      );

      expect(updatedIncomeSource).toMatchObject({
        id: incomeSource.id,
        name: "Updated Freelance",
        amount: "2500.00",
        frequency: "weekly",
        personId: testUsers.user1.persons[1].id,
        isActive: true,
      });
      expect(updatedIncomeSource.startDate).toBeDefined();
      expect(updatedIncomeSource.endDate).toBeDefined();
    });

    it("should return 403 when trying to update another user's income source", async () => {
      const user2IncomeSourceId =
        testUsers.user2.persons[0].incomeSources![0].id;

      try {
        await authenticatedFetch(
          testUsers.user1,
          `/api/income-sources/${user2IncomeSourceId}`,
          {
            method: "PUT",
            body: {
              name: "Hacked Salary",
              amount: "100000",
              frequency: "monthly",
            },
          }
        );
        expect.fail("Should have thrown 403 error");
      } catch (error) {
        const fetchError = error as FetchError;
        expect(fetchError.status).toBe(403);
        expect(fetchError.statusText).toContain(
          "Access denied: Person does not belong to your household"
        );
      }
    });

    it("should return 404 when trying to update non-existent income source", async () => {
      const nonExistentId = 999;

      try {
        await authenticatedFetch(
          testUsers.user1,
          `/api/income-sources/${nonExistentId}`,
          {
            method: "PUT",
            body: {
              name: "Non-existent",
              amount: "1000",
              frequency: "monthly",
            },
          }
        );
        expect.fail("Should have thrown 404 error");
      } catch (error) {
        const fetchError = error as FetchError;
        expect(fetchError.status).toBe(404);
        expect(fetchError.statusText).toContain("Income source not found");
      }
    });

    it("should return 400 when required fields are missing", async () => {
      const incomeSource = testUsers.user1.persons[0].incomeSources![0];

      try {
        await authenticatedFetch(
          testUsers.user1,
          `/api/income-sources/${incomeSource.id}`,
          {
            method: "PUT",
            body: {
              // Missing required fields
              name: "Updated Salary",
            },
          }
        );
        expect.fail("Should have thrown 400 error");
      } catch (error) {
        const fetchError = error as FetchError;
        expect(fetchError.status).toBe(400);
        expect(fetchError.statusText).toContain(
          "Name, amount, and frequency are required"
        );
      }
    });

    it("should update income source with minimal required fields", async () => {
      // Create a new income source first for this test
      const newIncomeSource = await authenticatedFetch<IncomeSource>(
        testUsers.user1,
        "/api/income-sources",
        {
          method: "POST",
          body: {
            personId: testUsers.user1.persons[0].id,
            name: "Test Update Income",
            amount: "1000",
            frequency: "monthly",
          },
        }
      );

      const updatedIncomeSource = await authenticatedFetch<IncomeSource>(
        testUsers.user1,
        `/api/income-sources/${newIncomeSource.id}`,
        {
          method: "PUT",
          body: {
            name: "Minimal Update",
            amount: "1200",
            frequency: "monthly",
          },
        }
      );

      expect(updatedIncomeSource).toMatchObject({
        id: newIncomeSource.id,
        name: "Minimal Update",
        amount: "1200.00",
        frequency: "monthly",
        personId: testUsers.user1.persons[0].id,
        isActive: true,
      });
      expect(updatedIncomeSource.startDate).toBeNull();
      expect(updatedIncomeSource.endDate).toBeNull();
    });
  });

  describe("DELETE /api/income-sources/[id]", () => {
    it("should return 401 when no authentication provided", async () => {
      // Create a test income source to delete
      const newIncomeSource = await authenticatedFetch<IncomeSource>(
        testUsers.user1,
        "/api/income-sources",
        {
          method: "POST",
          body: {
            personId: testUsers.user1.persons[0].id,
            name: "To Delete Income",
            amount: "1000",
            frequency: "monthly",
          },
        }
      );

      try {
        await $fetch(`/api/income-sources/${newIncomeSource.id}`, {
          method: "DELETE",
        });
        expect.fail("Should have thrown 401 error");
      } catch (error) {
        const fetchError = error as FetchError;
        expect(fetchError.status).toBe(401);
        expect(fetchError.statusText).toContain("Unauthorized");
      }
    });

    it("should delete income source when user owns it", async () => {
      // Create a new income source to delete
      const newIncomeSource = await authenticatedFetch<IncomeSource>(
        testUsers.user1,
        "/api/income-sources",
        {
          method: "POST",
          body: {
            personId: testUsers.user1.persons[0].id,
            name: "Delete Test Income",
            amount: "1000",
            frequency: "monthly",
          },
        }
      );

      const deleteResponse = await authenticatedFetch<{ message: string }>(
        testUsers.user1,
        `/api/income-sources/${newIncomeSource.id}`,
        {
          method: "DELETE",
        }
      );

      expect(deleteResponse).toMatchObject({
        message: "Income source deleted successfully",
      });

      // Verify the income source is actually deleted
      try {
        await authenticatedFetch(
          testUsers.user1,
          `/api/income-sources/${newIncomeSource.id}`
        );
        expect.fail("Should have thrown 404 error");
      } catch (error) {
        const fetchError = error as FetchError;
        expect(fetchError.status).toBe(404);
        expect(fetchError.statusText).toContain("Income source not found");
      }
    });

    it("should return 403 when trying to delete another user's income source", async () => {
      const user2IncomeSourceId =
        testUsers.user2.persons[0].incomeSources![0].id;

      try {
        await authenticatedFetch(
          testUsers.user1,
          `/api/income-sources/${user2IncomeSourceId}`,
          {
            method: "DELETE",
          }
        );
        expect.fail("Should have thrown 403 error");
      } catch (error) {
        const fetchError = error as FetchError;
        expect(fetchError.status).toBe(403);
        expect(fetchError.statusText).toContain(
          "Access denied: Person does not belong to your household"
        );
      }
    });

    it("should return 404 when trying to delete non-existent income source", async () => {
      const nonExistentId = 999;

      try {
        await authenticatedFetch(
          testUsers.user1,
          `/api/income-sources/${nonExistentId}`,
          {
            method: "DELETE",
          }
        );
        expect.fail("Should have thrown 404 error");
      } catch (error) {
        const fetchError = error as FetchError;
        expect(fetchError.status).toBe(404);
        expect(fetchError.statusText).toContain("Income source not found");
      }
    });

    it("should return 400 for invalid income source ID", async () => {
      try {
        await authenticatedFetch(
          testUsers.user1,
          `/api/income-sources/invalid`,
          {
            method: "DELETE",
          }
        );
        expect.fail("Should have thrown 400 error");
      } catch (error) {
        const fetchError = error as FetchError;
        expect(fetchError.status).toBe(400);
        expect(fetchError.statusText).toContain("Income source ID is required");
      }
    });
  });
});
