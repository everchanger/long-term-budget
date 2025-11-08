import { describe, it, expect, beforeAll } from "vitest";
import { setup, $fetch } from "@nuxt/test-utils/e2e";
import type { InferSelectModel } from "drizzle-orm";
import type { savingsGoals } from "../../../../database/schema";
import {
  TestDataBuilder,
  authenticatedFetch,
  type TestUser,
  type TestPerson,
} from "../../utils/test-data";

// Use Drizzle-inferred savings goal type
type SavingsGoal = InferSelectModel<typeof savingsGoals>;

interface EnrichedSavingsGoal extends SavingsGoal {
  currentAmount: number;
  progressPercentage: number;
  remainingAmount: number;
  estimatedMonthsToGoal: number | null;
  estimatedCompletionDate: Date | null;
  savingsAccountIds?: number[];
}

interface FetchError {
  status: number;
  statusText: string;
  data?: unknown;
}

describe("/api/savings-goals/[id] integration tests", async () => {
  await setup({
    host: `http://localhost:${process.env.NUXT_DEVSERVER_PORT || 5000}`,
  });

  let testUsers: {
    user1: TestUser & { persons: TestPerson[] };
    user2: TestUser & { persons: TestPerson[] };
  };
  let user1GoalId: number;
  let user2GoalId: number;

  beforeAll(async () => {
    // Set up test data
    const user1 = await TestDataBuilder.createUser("GoalIDTestUser1")
      .then((b) => b.addPerson("Alice ID Test", 30))
      .then((b) =>
        b.addSavingsAccount({
          name: "Alice Account 1",
          currentBalance: "5000",
        })
      )
      .then((b) => b.addPerson("Bob ID Test", 28))
      .then((b) =>
        b.addSavingsAccount({
          name: "Bob Account 1",
          currentBalance: "3000",
        })
      );

    const builtUser1 = await user1.build();

    await user1.addSavingsGoal({
      name: "User1 Test Goal",
      targetAmount: "20000",
      priority: 2,
      category: "test",
      linkedAccountIds: [builtUser1.persons[0].savingsAccounts![0].id],
    });

    const user2 = await TestDataBuilder.createUser("GoalIDTestUser2")
      .then((b) => b.addPerson("Charlie ID Test", 35))
      .then((b) =>
        b.addSavingsAccount({
          name: "Charlie Account",
          currentBalance: "10000",
        })
      );

    const builtUser2 = await user2.build();

    await user2.addSavingsGoal({
      name: "User2 Test Goal",
      targetAmount: "30000",
      priority: 3,
      linkedAccountIds: [builtUser2.persons[0].savingsAccounts![0].id],
    });

    testUsers = {
      user1: builtUser1,
      user2: builtUser2,
    };

    // Get goal IDs
    const user1Goals = await authenticatedFetch<EnrichedSavingsGoal[]>(
      testUsers.user1,
      "/api/savings-goals"
    );
    user1GoalId = user1Goals[0].id;

    const user2Goals = await authenticatedFetch<EnrichedSavingsGoal[]>(
      testUsers.user2,
      "/api/savings-goals"
    );
    user2GoalId = user2Goals[0].id;
  });

  describe("GET /api/savings-goals/[id]", () => {
    it("should return 401 when no authentication provided", async () => {
      try {
        await $fetch(`/api/savings-goals/${user1GoalId}`);
        expect.fail("Expected request to fail with 401");
      } catch (error) {
        const fetchError = error as FetchError;
        expect(fetchError.status).toBe(401);
      }
    });

    it("should return 404 when goal does not exist", async () => {
      try {
        await authenticatedFetch<EnrichedSavingsGoal>(
          testUsers.user1,
          "/api/savings-goals/999999"
        );
        expect.fail("Expected request to fail with 404");
      } catch (error) {
        const fetchError = error as FetchError;
        expect(fetchError.status).toBe(404);
      }
    });

    it("should return 404 when trying to access another user's goal", async () => {
      try {
        await authenticatedFetch<EnrichedSavingsGoal>(
          testUsers.user1,
          `/api/savings-goals/${user2GoalId}`
        );
        expect.fail("Expected request to fail with 404");
      } catch (error) {
        const fetchError = error as FetchError;
        expect(fetchError.status).toBe(404);
      }
    });

    it("should return goal with enriched data for authenticated user", async () => {
      const goal = await authenticatedFetch<EnrichedSavingsGoal>(
        testUsers.user1,
        `/api/savings-goals/${user1GoalId}`
      );

      expect(goal).toMatchObject({
        id: user1GoalId,
        name: "User1 Test Goal",
        targetAmount: "20000.00",
        priority: 2,
        category: "test",
        householdId: testUsers.user1.householdId,
      });
      expect(goal.currentAmount).toBeDefined();
      expect(goal.progressPercentage).toBeDefined();
      expect(goal.remainingAmount).toBeDefined();
      expect(goal.savingsAccountIds).toBeDefined();
      expect(goal.savingsAccountIds).toContain(
        testUsers.user1.persons[0].savingsAccounts![0].id
      );
    });
  });

  describe("PUT /api/savings-goals/[id]", () => {
    it("should return 401 when no authentication provided", async () => {
      try {
        await $fetch(`/api/savings-goals/${user1GoalId}`, {
          method: "PUT",
          body: {
            name: "Updated Goal",
          },
        });
        expect.fail("Expected request to fail with 401");
      } catch (error) {
        const fetchError = error as FetchError;
        expect(fetchError.status).toBe(401);
      }
    });

    it("should return 404 when trying to update another user's goal", async () => {
      try {
        await authenticatedFetch<SavingsGoal>(
          testUsers.user1,
          `/api/savings-goals/${user2GoalId}`,
          {
            method: "PUT",
            body: {
              name: "Unauthorized Update",
            },
          }
        );
        expect.fail("Expected request to fail with 404");
      } catch (error) {
        const fetchError = error as FetchError;
        expect(fetchError.status).toBe(404);
      }
    });

    it("should update goal name and description", async () => {
      const updated = await authenticatedFetch<SavingsGoal>(
        testUsers.user1,
        `/api/savings-goals/${user1GoalId}`,
        {
          method: "PUT",
          body: {
            name: "Updated Goal Name",
            description: "Updated description",
          },
        }
      );

      expect(updated).toMatchObject({
        id: user1GoalId,
        name: "Updated Goal Name",
        description: "Updated description",
      });
    });

    it("should update goal target amount and priority", async () => {
      const updated = await authenticatedFetch<SavingsGoal>(
        testUsers.user1,
        `/api/savings-goals/${user1GoalId}`,
        {
          method: "PUT",
          body: {
            targetAmount: "25000",
            priority: 3,
          },
        }
      );

      expect(updated).toMatchObject({
        id: user1GoalId,
        targetAmount: "25000.00",
        priority: 3,
      });
    });

    it("should update linked savings accounts", async () => {
      const account2Id = testUsers.user1.persons[1].savingsAccounts![0].id;

      const updated = await authenticatedFetch<SavingsGoal>(
        testUsers.user1,
        `/api/savings-goals/${user1GoalId}`,
        {
          method: "PUT",
          body: {
            savingsAccountIds: [account2Id],
          },
        }
      );

      expect(updated.id).toBe(user1GoalId);

      // Verify the links were updated
      const goal = await authenticatedFetch<EnrichedSavingsGoal>(
        testUsers.user1,
        `/api/savings-goals/${user1GoalId}`
      );

      expect(goal.savingsAccountIds).toHaveLength(1);
      expect(goal.savingsAccountIds).toContain(account2Id);
    });

    it("should mark goal as completed", async () => {
      const updated = await authenticatedFetch<SavingsGoal>(
        testUsers.user1,
        `/api/savings-goals/${user1GoalId}`,
        {
          method: "PUT",
          body: {
            isCompleted: true,
          },
        }
      );

      expect(updated.isCompleted).toBe(true);
      expect(updated.completedAt).toBeDefined();
    });

    it("should return 400 when linking accounts from different household", async () => {
      const otherAccountId = testUsers.user2.persons[0].savingsAccounts![0].id;

      try {
        await authenticatedFetch<SavingsGoal>(
          testUsers.user1,
          `/api/savings-goals/${user1GoalId}`,
          {
            method: "PUT",
            body: {
              savingsAccountIds: [otherAccountId],
            },
          }
        );
        expect.fail("Expected request to fail with 400");
      } catch (error) {
        const fetchError = error as FetchError;
        expect(fetchError.status).toBe(400);
      }
    });
  });

  describe("DELETE /api/savings-goals/[id]", () => {
    it("should return 401 when no authentication provided", async () => {
      // Create a goal for this test
      const goalToDelete = await authenticatedFetch<SavingsGoal>(
        testUsers.user1,
        "/api/savings-goals",
        {
          method: "POST",
          body: {
            name: "Goal to Delete",
            targetAmount: "5000",
            householdId: testUsers.user1.householdId,
          },
        }
      );

      try {
        await $fetch(`/api/savings-goals/${goalToDelete.id}`, {
          method: "DELETE",
        });
        expect.fail("Expected request to fail with 401");
      } catch (error) {
        const fetchError = error as FetchError;
        expect(fetchError.status).toBe(401);
      }
    });

    it("should return 404 when trying to delete another user's goal", async () => {
      try {
        await authenticatedFetch(
          testUsers.user1,
          `/api/savings-goals/${user2GoalId}`,
          {
            method: "DELETE",
          }
        );
        expect.fail("Expected request to fail with 404");
      } catch (error) {
        const fetchError = error as FetchError;
        expect(fetchError.status).toBe(404);
      }
    });

    it("should delete goal successfully", async () => {
      // Create a goal for this test
      const goalToDelete = await authenticatedFetch<SavingsGoal>(
        testUsers.user1,
        "/api/savings-goals",
        {
          method: "POST",
          body: {
            name: "Goal to Delete",
            targetAmount: "5000",
            householdId: testUsers.user1.householdId,
          },
        }
      );

      const response = await authenticatedFetch(
        testUsers.user1,
        `/api/savings-goals/${goalToDelete.id}`,
        {
          method: "DELETE",
        }
      );

      expect(response).toEqual({
        success: true,
        message: "Savings goal deleted successfully",
      });

      // Verify goal was deleted
      try {
        await authenticatedFetch(
          testUsers.user1,
          `/api/savings-goals/${goalToDelete.id}`
        );
        expect.fail("Expected request to fail with 404");
      } catch (error) {
        const fetchError = error as FetchError;
        expect(fetchError.status).toBe(404);
      }
    });

    it("should return 404 when trying to delete non-existent goal", async () => {
      try {
        await authenticatedFetch(testUsers.user1, "/api/savings-goals/999999", {
          method: "DELETE",
        });
        expect.fail("Expected request to fail with 404");
      } catch (error) {
        const fetchError = error as FetchError;
        expect(fetchError.status).toBe(404);
      }
    });
  });
});
