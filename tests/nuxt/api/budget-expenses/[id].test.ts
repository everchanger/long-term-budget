import { describe, it, expect, beforeAll } from "vitest";
import { setup } from "@nuxt/test-utils/e2e";
import type { InferSelectModel } from "drizzle-orm";
import type { budgetExpenses } from "../../../../database/schema";
import {
  TestDataBuilder,
  authenticatedFetch,
  type TestUser,
} from "../../utils/test-data";

// Use Drizzle-inferred budget expense type
type BudgetExpense = InferSelectModel<typeof budgetExpenses>;

interface FetchError {
  status: number;
  statusText: string;
  data?: unknown;
}

describe("/api/budget-expenses/[id] integration tests", async () => {
  await setup({
    host: `http://localhost:${process.env.NUXT_DEVSERVER_PORT || 5000}`,
  });

  let testUsers: {
    user1: TestUser;
    user2: TestUser;
  };
  let user1Expense: BudgetExpense;

  beforeAll(async () => {
    // Set up test data
    const user1 = await TestDataBuilder.createUser("BudgetExpenseIdTestUser1");
    const user2 = await TestDataBuilder.createUser("BudgetExpenseIdTestUser2");

    testUsers = {
      user1: await user1.build(),
      user2: await user2.build(),
    };

    // Create a budget expense for user1
    user1Expense = await authenticatedFetch<BudgetExpense>(
      testUsers.user1,
      "/api/budget-expenses",
      {
        method: "POST",
        body: {
          name: "Test Expense",
          amount: "100",
        },
      }
    );
  });

  describe("GET /api/budget-expenses/[id]", () => {
    it("should get a specific budget expense for authenticated user", async () => {
      const response = await authenticatedFetch<BudgetExpense>(
        testUsers.user1,
        `/api/budget-expenses/${user1Expense.id}`
      );

      expect(response.id).toBe(user1Expense.id);
      expect(response.name).toBe("Test Expense");
      expect(response.amount).toBe("100.00");
    });

    it("should return 404 for non-existent budget expense", async () => {
      try {
        await authenticatedFetch(testUsers.user1, "/api/budget-expenses/99999");
        expect.fail("Should have thrown an error");
      } catch (error) {
        const err = error as FetchError;
        expect(err.status).toBe(404);
      }
    });

    it("should return 404 when trying to access another user's budget expense", async () => {
      // Try to access user1's expense as user2
      try {
        await authenticatedFetch(
          testUsers.user2,
          `/api/budget-expenses/${user1Expense.id}`
        );
        expect.fail("Should have thrown an error");
      } catch (error) {
        const err = error as FetchError;
        expect(err.status).toBe(404);
      }
    });

    it("should return 400 for invalid budget expense ID", async () => {
      try {
        await authenticatedFetch(testUsers.user1, "/api/budget-expenses/abc");
        expect.fail("Should have thrown an error");
      } catch (error) {
        const err = error as FetchError;
        expect(err.status).toBe(400);
      }
    });
  });

  describe("PUT /api/budget-expenses/[id]", () => {
    it("should update a budget expense for authenticated user", async () => {
      const response = await authenticatedFetch<BudgetExpense>(
        testUsers.user1,
        `/api/budget-expenses/${user1Expense.id}`,
        {
          method: "PUT",
          body: {
            name: "Updated Expense",
            amount: "150",
          },
        }
      );

      expect(response.id).toBe(user1Expense.id);
      expect(response.name).toBe("Updated Expense");
      expect(response.amount).toBe("150.00");
    });

    it("should update budget expense with partial data", async () => {
      // Create a new expense
      const expense = await authenticatedFetch<BudgetExpense>(
        testUsers.user1,
        "/api/budget-expenses",
        {
          method: "POST",
          body: {
            name: "Partial Test",
            amount: "200",
          },
        }
      );

      // Update only the amount
      const response = await authenticatedFetch<BudgetExpense>(
        testUsers.user1,
        `/api/budget-expenses/${expense.id}`,
        {
          method: "PUT",
          body: {
            name: "Partial Test", // Keep same name
            amount: "250",
          },
        }
      );

      expect(response.name).toBe("Partial Test");
      expect(response.amount).toBe("250.00");
    });

    it("should return 400 for missing required fields", async () => {
      try {
        await authenticatedFetch(
          testUsers.user1,
          `/api/budget-expenses/${user1Expense.id}`,
          {
            method: "PUT",
            body: {
              name: "Only Name",
            },
          }
        );
        expect.fail("Should have thrown an error");
      } catch (error) {
        const err = error as FetchError;
        expect(err.status).toBe(400);
      }
    });

    it("should return 404 for non-existent budget expense", async () => {
      try {
        await authenticatedFetch(
          testUsers.user1,
          "/api/budget-expenses/99999",
          {
            method: "PUT",
            body: {
              name: "Test",
              amount: "100",
            },
          }
        );
        expect.fail("Should have thrown an error");
      } catch (error) {
        const err = error as FetchError;
        expect(err.status).toBe(404);
      }
    });

    it("should return 404 when trying to update another user's budget expense", async () => {
      try {
        await authenticatedFetch(
          testUsers.user2,
          `/api/budget-expenses/${user1Expense.id}`,
          {
            method: "PUT",
            body: {
              name: "Hacked",
              amount: "999",
            },
          }
        );
        expect.fail("Should have thrown an error");
      } catch (error) {
        const err = error as FetchError;
        expect(err.status).toBe(404);
      }
    });
  });

  describe("DELETE /api/budget-expenses/[id]", () => {
    it("should delete a budget expense for authenticated user", async () => {
      // Create a new expense to delete
      const expense = await authenticatedFetch<BudgetExpense>(
        testUsers.user1,
        "/api/budget-expenses",
        {
          method: "POST",
          body: {
            name: "To Delete",
            amount: "50",
          },
        }
      );

      const response = await authenticatedFetch<{ success: true }>(
        testUsers.user1,
        `/api/budget-expenses/${expense.id}`,
        {
          method: "DELETE",
        }
      );

      expect(response.success).toBe(true);

      // Verify it's deleted
      try {
        await authenticatedFetch(
          testUsers.user1,
          `/api/budget-expenses/${expense.id}`
        );
        expect.fail("Should have thrown an error");
      } catch (error) {
        const err = error as FetchError;
        expect(err.status).toBe(404);
      }
    });

    it("should return 404 for non-existent budget expense", async () => {
      try {
        await authenticatedFetch(
          testUsers.user1,
          "/api/budget-expenses/99999",
          {
            method: "DELETE",
          }
        );
        expect.fail("Should have thrown an error");
      } catch (error) {
        const err = error as FetchError;
        expect(err.status).toBe(404);
      }
    });

    it("should return 404 when trying to delete another user's budget expense", async () => {
      // Create expense for user1
      const expense = await authenticatedFetch<BudgetExpense>(
        testUsers.user1,
        "/api/budget-expenses",
        {
          method: "POST",
          body: {
            name: "Protected",
            amount: "75",
          },
        }
      );

      // Try to delete as user2
      try {
        await authenticatedFetch(
          testUsers.user2,
          `/api/budget-expenses/${expense.id}`,
          {
            method: "DELETE",
          }
        );
        expect.fail("Should have thrown an error");
      } catch (error) {
        const err = error as FetchError;
        expect(err.status).toBe(404);
      }
    });
  });

  describe("Method validation", () => {
    it("should reject unsupported HTTP methods", async () => {
      try {
        await authenticatedFetch(
          testUsers.user1,
          `/api/budget-expenses/${user1Expense.id}`,
          {
            method: "PATCH",
          }
        );
        expect.fail("Should have thrown an error");
      } catch (error) {
        const err = error as FetchError;
        expect(err.status).toBe(405);
      }
    });
  });
});
