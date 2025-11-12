import { describe, it, expect, beforeAll } from "vitest";
import { setup } from "@nuxt/test-utils/e2e";
import type { InferSelectModel } from "drizzle-orm";
import type { budgetExpenses } from "@db/schema";
import {
  TestDataBuilder,
  authenticatedFetch,
  type TestUser,
} from "@test/nuxt/utils/test-data";

// Use Drizzle-inferred budget expense type
type BudgetExpense = InferSelectModel<typeof budgetExpenses>;

interface FetchError {
  status: number;
  statusText: string;
  data?: unknown;
}

describe("/api/budget-expenses integration tests", async () => {
  await setup({
    host: `http://localhost:${process.env.NUXT_DEVSERVER_PORT || 5000}`,
  });

  let testUsers: {
    user1: TestUser;
    user2: TestUser;
  };

  beforeAll(async () => {
    // Set up test data - create two users with households
    const user1 = await TestDataBuilder.createUser("BudgetExpenseTestUser1");
    const user2 = await TestDataBuilder.createUser("BudgetExpenseTestUser2");

    testUsers = {
      user1: await user1.build(),
      user2: await user2.build(),
    };
  });

  describe("GET /api/budget-expenses", () => {
    it("should return empty array when household has no budget expenses", async () => {
      const response = await authenticatedFetch<BudgetExpense[]>(
        testUsers.user1,
        "/api/budget-expenses"
      );

      expect(response).toEqual([]);
    });

    it("should return all budget expenses for authenticated user's household", async () => {
      // Create budget expenses for user1
      await authenticatedFetch(testUsers.user1, "/api/budget-expenses", {
        method: "POST",
        body: { name: "Rent", amount: "1500" },
      });
      await authenticatedFetch(testUsers.user1, "/api/budget-expenses", {
        method: "POST",
        body: { name: "Utilities", amount: "200" },
      });

      // Get all budget expenses
      const response = await authenticatedFetch<BudgetExpense[]>(
        testUsers.user1,
        "/api/budget-expenses"
      );

      expect(response).toHaveLength(2);
      expect(response[0].name).toBe("Utilities");
      expect(response[1].name).toBe("Rent");
    });

    it("should not return budget expenses from other households", async () => {
      // Create budget expense for user2
      await authenticatedFetch(testUsers.user2, "/api/budget-expenses", {
        method: "POST",
        body: { name: "Mortgage", amount: "2000" },
      });

      // Get budget expenses for user1
      const response = await authenticatedFetch<BudgetExpense[]>(
        testUsers.user1,
        "/api/budget-expenses"
      );

      // Should only see user1's expenses (2 from previous test)
      expect(response).toHaveLength(2);
      expect(response.every((e) => e.name !== "Mortgage")).toBe(true);
    });
  });

  describe("POST /api/budget-expenses", () => {
    it("should create a new budget expense for authenticated user's household", async () => {
      const response = await authenticatedFetch<BudgetExpense>(
        testUsers.user1,
        "/api/budget-expenses",
        {
          method: "POST",
          body: {
            name: "Internet",
            amount: "80",
          },
        }
      );

      expect(response.name).toBe("Internet");
      expect(response.amount).toBe("80.00");
    });

    it("should create budget and budget expense if budget doesn't exist", async () => {
      // Create a new user with no budget
      const user3 = await TestDataBuilder.createUser(
        "BudgetExpenseTestUser3"
      ).then((b) => b.build());

      const response = await authenticatedFetch<BudgetExpense>(
        user3,
        "/api/budget-expenses",
        {
          method: "POST",
          body: {
            name: "Phone",
            amount: "50",
          },
        }
      );

      expect(response.name).toBe("Phone");
      expect(response.amount).toBe("50.00");
    });

    it("should reject request with missing name", async () => {
      try {
        await authenticatedFetch(testUsers.user1, "/api/budget-expenses", {
          method: "POST",
          body: {
            amount: "100",
          },
        });
        expect.fail("Should have thrown an error");
      } catch (error) {
        const err = error as FetchError;
        expect(err.status).toBe(400);
      }
    });

    it("should reject request with missing amount", async () => {
      try {
        await authenticatedFetch(testUsers.user1, "/api/budget-expenses", {
          method: "POST",
          body: {
            name: "Netflix",
          },
        });
        expect.fail("Should have thrown an error");
      } catch (error) {
        const err = error as FetchError;
        expect(err.status).toBe(400);
      }
    });
  });

  describe("Method validation", () => {
    it("should reject unsupported HTTP methods", async () => {
      try {
        await authenticatedFetch(testUsers.user1, "/api/budget-expenses", {
          method: "PATCH",
        });
        expect.fail("Should have thrown an error");
      } catch (error) {
        const err = error as FetchError;
        expect(err.status).toBe(405);
      }
    });
  });
});
