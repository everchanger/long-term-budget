import { describe, it, expect, beforeAll } from "vitest";
import { setup, $fetch } from "@nuxt/test-utils/e2e";
import type { InferSelectModel } from "drizzle-orm";
import type { savingsAccounts } from "../../../../database/schema";
import {
  TestDataBuilder,
  authenticatedFetch,
  type TestUser,
  type TestPerson,
} from "../../utils/test-data";

// Use Drizzle-inferred savings account type
type SavingsAccount = InferSelectModel<typeof savingsAccounts>;

interface FetchError {
  status: number;
  statusText: string;
  data?: unknown;
}

describe("/api/savings-accounts/[id] integration tests", async () => {
  await setup({
    host: `http://localhost:${process.env.NUXT_DEVSERVER_PORT || 5000}`,
  });

  let testUsers: {
    user1: TestUser & { persons: TestPerson[] };
    user2: TestUser & { persons: TestPerson[] };
  };

  beforeAll(async () => {
    // Set up test data before running tests - create two users with persons and savings accounts
    const user1 = await TestDataBuilder.createUser("SavingsIdTestUser1")
      .then((b) => b.addPerson("John SavingsId1", 30))
      .then((b) =>
        b.addSavingsAccount({
          name: "Emergency Fund John",
          currentBalance: 10000,
          interestRate: 0.025,
          accountType: "emergency",
        })
      )
      .then((b) => b.addPerson("Jane SavingsId1", 28))
      .then((b) =>
        b.addSavingsAccount({
          name: "Investment Account Jane",
          currentBalance: 25000,
          interestRate: 0.045,
          accountType: "investment",
        })
      );

    const user2 = await TestDataBuilder.createUser("SavingsIdTestUser2")
      .then((b) => b.addPerson("Bob SavingsId2", 35))
      .then((b) =>
        b.addSavingsAccount({
          name: "Retirement Fund Bob",
          currentBalance: 50000,
          interestRate: 0.035,
          accountType: "retirement",
        })
      );

    testUsers = {
      user1: await user1.build(),
      user2: await user2.build(),
    };
  });

  describe("GET /api/savings-accounts/[id]", () => {
    it("should return 401 when no authentication provided", async () => {
      const account = testUsers.user1.persons[0].savingsAccounts![0];

      try {
        await $fetch(`/api/savings-accounts/${account.id}`);
        expect.fail("Expected request to fail with 401");
      } catch (error) {
        const fetchError = error as FetchError;
        expect(fetchError.status).toBe(401);
      }
    });

    it("should return savings account when user owns the person", async () => {
      const account = testUsers.user1.persons[0].savingsAccounts![0];

      const fetchedAccount = await authenticatedFetch<SavingsAccount>(
        testUsers.user1,
        `/api/savings-accounts/${account.id}`
      );

      expect(fetchedAccount).toMatchObject({
        id: account.id,
        name: "Emergency Fund John",
        currentBalance: "10000.00",
        interestRate: "0.0250",
        accountType: "emergency",
        personId: testUsers.user1.persons[0].id,
      });
    });

    it("should return 403 when savings account belongs to another user's person", async () => {
      const otherUserAccount = testUsers.user2.persons[0].savingsAccounts![0];

      try {
        await authenticatedFetch<SavingsAccount>(
          testUsers.user1,
          `/api/savings-accounts/${otherUserAccount.id}`
        );
        expect.fail("Expected request to fail with 403");
      } catch (error) {
        const fetchError = error as FetchError;
        expect(fetchError.status).toBe(403);
        expect(fetchError.statusText).toContain(
          "Access denied: Savings account does not belong to your household"
        );
      }
    });

    it("should return 404 when savings account does not exist", async () => {
      try {
        await authenticatedFetch<SavingsAccount>(
          testUsers.user1,
          "/api/savings-accounts/99999"
        );
        expect.fail("Expected request to fail with 404");
      } catch (error) {
        const fetchError = error as FetchError;
        expect(fetchError.status).toBe(404);
        expect(fetchError.statusText).toContain("Savings account not found");
      }
    });

    it("should return 400 for invalid savings account ID", async () => {
      try {
        await authenticatedFetch<SavingsAccount>(
          testUsers.user1,
          "/api/savings-accounts/invalid"
        );
        expect.fail("Expected request to fail with 400");
      } catch (error) {
        const fetchError = error as FetchError;
        expect(fetchError.status).toBe(400);
        expect(fetchError.statusText).toContain("Account ID is required");
      }
    });
  });

  describe("PUT /api/savings-accounts/[id]", () => {
    it("should return 401 when no authentication provided", async () => {
      const account = testUsers.user1.persons[0].savingsAccounts![0];

      try {
        await $fetch(`/api/savings-accounts/${account.id}`, {
          method: "PUT",
          body: {
            name: "Updated Account",
            currentBalance: 15000,
          },
        });
        expect.fail("Expected request to fail with 401");
      } catch (error) {
        const fetchError = error as FetchError;
        expect(fetchError.status).toBe(401);
      }
    });

    it("should update savings account when user owns it", async () => {
      const account = testUsers.user1.persons[1].savingsAccounts![0];

      const updatedAccount = await authenticatedFetch<SavingsAccount>(
        testUsers.user1,
        `/api/savings-accounts/${account.id}`,
        {
          method: "PUT",
          body: {
            name: "Updated Investment Account",
            currentBalance: 30000,
            interestRate: 0.05,
            accountType: "growth",
          },
        }
      );

      expect(updatedAccount).toMatchObject({
        id: account.id,
        name: "Updated Investment Account",
        currentBalance: "30000.00",
        interestRate: "0.0500",
        accountType: "growth",
        personId: testUsers.user1.persons[1].id,
      });
    });

    it("should return 403 when trying to update another user's savings account", async () => {
      const otherUserAccount = testUsers.user2.persons[0].savingsAccounts![0];

      try {
        await authenticatedFetch<SavingsAccount>(
          testUsers.user1,
          `/api/savings-accounts/${otherUserAccount.id}`,
          {
            method: "PUT",
            body: {
              name: "Unauthorized Update",
              currentBalance: 60000,
            },
          }
        );
        expect.fail("Expected request to fail with 403");
      } catch (error) {
        const fetchError = error as FetchError;
        expect(fetchError.status).toBe(403);
        expect(fetchError.statusText).toContain(
          "Access denied: Savings account does not belong to your household"
        );
      }
    });

    it("should return 404 when trying to update non-existent savings account", async () => {
      try {
        await authenticatedFetch<SavingsAccount>(
          testUsers.user1,
          "/api/savings-accounts/99999",
          {
            method: "PUT",
            body: {
              name: "Non-existent Account",
              currentBalance: 5000,
            },
          }
        );
        expect.fail("Expected request to fail with 404");
      } catch (error) {
        const fetchError = error as FetchError;
        expect(fetchError.status).toBe(404);
        expect(fetchError.statusText).toContain("Savings account not found");
      }
    });

    it("should return 400 when required fields are missing", async () => {
      const account = testUsers.user1.persons[0].savingsAccounts![0];

      try {
        await authenticatedFetch<SavingsAccount>(
          testUsers.user1,
          `/api/savings-accounts/${account.id}`,
          {
            method: "PUT",
            body: {
              name: "Incomplete Update",
              // Missing currentBalance
            },
          }
        );
        expect.fail("Expected request to fail with 400");
      } catch (error) {
        const fetchError = error as FetchError;
        expect(fetchError.status).toBe(400);
        expect(fetchError.statusText).toContain("Missing required fields");
      }
    });

    it("should update savings account with minimal required fields", async () => {
      // Create a new savings account for this test
      const newAccount = await authenticatedFetch<SavingsAccount>(
        testUsers.user1,
        "/api/savings-accounts",
        {
          method: "POST",
          body: {
            name: "Test Update Account",
            currentBalance: 5000,
            personId: testUsers.user1.persons[0].id,
          },
        }
      );

      const updatedAccount = await authenticatedFetch<SavingsAccount>(
        testUsers.user1,
        `/api/savings-accounts/${newAccount.id}`,
        {
          method: "PUT",
          body: {
            name: "Minimal Update",
            currentBalance: 6000,
          },
        }
      );

      expect(updatedAccount).toMatchObject({
        id: newAccount.id,
        name: "Minimal Update",
        currentBalance: "6000.00",
        personId: testUsers.user1.persons[0].id,
      });
      expect(updatedAccount.interestRate).toBeNull();
      expect(updatedAccount.accountType).toBeNull();
    });
  });

  describe("DELETE /api/savings-accounts/[id]", () => {
    it("should return 401 when no authentication provided", async () => {
      const account = testUsers.user1.persons[0].savingsAccounts![0];

      try {
        await $fetch(`/api/savings-accounts/${account.id}`, {
          method: "DELETE",
        });
        expect.fail("Expected request to fail with 401");
      } catch (error) {
        const fetchError = error as FetchError;
        expect(fetchError.status).toBe(401);
      }
    });

    it("should delete savings account when user owns it", async () => {
      // Create a new savings account for this test to avoid affecting other tests
      const newAccount = await authenticatedFetch<SavingsAccount>(
        testUsers.user1,
        "/api/savings-accounts",
        {
          method: "POST",
          body: {
            name: "Test Delete Account",
            currentBalance: 2000,
            personId: testUsers.user1.persons[0].id,
          },
        }
      );

      const deleteResponse = await authenticatedFetch<{ message: string }>(
        testUsers.user1,
        `/api/savings-accounts/${newAccount.id}`,
        {
          method: "DELETE",
        }
      );

      expect(deleteResponse).toEqual({
        message: "Savings account deleted successfully",
      });

      // Verify the savings account is actually deleted
      try {
        await authenticatedFetch<SavingsAccount>(
          testUsers.user1,
          `/api/savings-accounts/${newAccount.id}`
        );
        expect.fail("Expected request to fail with 404 after deletion");
      } catch (error) {
        const fetchError = error as FetchError;
        expect(fetchError.status).toBe(404);
      }
    });

    it("should return 403 when trying to delete another user's savings account", async () => {
      const otherUserAccount = testUsers.user2.persons[0].savingsAccounts![0];

      try {
        await authenticatedFetch<{ message: string }>(
          testUsers.user1,
          `/api/savings-accounts/${otherUserAccount.id}`,
          {
            method: "DELETE",
          }
        );
        expect.fail("Expected request to fail with 403");
      } catch (error) {
        const fetchError = error as FetchError;
        expect(fetchError.status).toBe(403);
        expect(fetchError.statusText).toContain(
          "Access denied: Savings account does not belong to your household"
        );
      }
    });

    it("should return 404 when trying to delete non-existent savings account", async () => {
      try {
        await authenticatedFetch<{ message: string }>(
          testUsers.user1,
          "/api/savings-accounts/99999",
          {
            method: "DELETE",
          }
        );
        expect.fail("Expected request to fail with 404");
      } catch (error) {
        const fetchError = error as FetchError;
        expect(fetchError.status).toBe(404);
        expect(fetchError.statusText).toContain("Savings account not found");
      }
    });

    it("should return 400 for invalid savings account ID", async () => {
      try {
        await authenticatedFetch<{ message: string }>(
          testUsers.user1,
          "/api/savings-accounts/invalid",
          {
            method: "DELETE",
          }
        );
        expect.fail("Expected request to fail with 400");
      } catch (error) {
        const fetchError = error as FetchError;
        expect(fetchError.status).toBe(400);
        expect(fetchError.statusText).toContain("Account ID is required");
      }
    });
  });
});
