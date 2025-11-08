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

describe("/api/savings-goals integration tests", async () => {
  await setup({
    host: `http://localhost:${process.env.NUXT_DEVSERVER_PORT || 5000}`,
  });

  let testUsers: {
    user1: TestUser & { persons: TestPerson[] };
    user2: TestUser & { persons: TestPerson[] };
  };

  beforeAll(async () => {
    // Set up test data - create two users with persons, savings accounts, and goals
    const user1 = await TestDataBuilder.createUser("GoalsTestUser1")
      .then((b) => b.addPerson("Alice Goals", 30))
      .then((b) =>
        b.addSavingsAccount({
          name: "Alice Emergency Fund",
          currentBalance: "5000",
          interestRate: "2",
        })
      )
      .then((b) => b.addPerson("Bob Goals", 28))
      .then((b) =>
        b.addSavingsAccount({
          name: "Bob Vacation Fund",
          currentBalance: "2000",
          interestRate: "1.5",
        })
      );

    const builtUser1 = await user1.build();

    // Add savings goal with linked accounts
    await user1.addSavingsGoal({
      name: "House Down Payment",
      description: "Save for 20% down payment",
      targetAmount: "50000",
      priority: 3,
      category: "house",
      linkedAccountIds: [
        builtUser1.persons[0].savingsAccounts![0].id,
        builtUser1.persons[1].savingsAccounts![0].id,
      ],
    });

    // Add goal without linked accounts
    await user1.addSavingsGoal({
      name: "Emergency Fund Goal",
      targetAmount: "10000",
      priority: 2,
      category: "emergency",
    });

    const user2 = await TestDataBuilder.createUser("GoalsTestUser2")
      .then((b) => b.addPerson("Charlie Goals", 35))
      .then((b) =>
        b.addSavingsAccount({
          name: "Charlie Retirement",
          currentBalance: "15000",
          interestRate: "5",
        })
      );

    const builtUser2 = await user2.build();

    await user2.addSavingsGoal({
      name: "Retirement Goal",
      targetAmount: "100000",
      priority: 3,
      category: "retirement",
      linkedAccountIds: [builtUser2.persons[0].savingsAccounts![0].id],
    });

    testUsers = {
      user1: builtUser1,
      user2: builtUser2,
    };
  });

  describe("GET /api/savings-goals", () => {
    it("should return 401 when no authentication provided", async () => {
      try {
        await $fetch("/api/savings-goals");
        expect.fail("Expected request to fail with 401");
      } catch (error) {
        const fetchError = error as FetchError;
        expect(fetchError.status).toBe(401);
      }
    });

    it("should return empty array when household has no goals", async () => {
      const userWithoutGoals = await TestDataBuilder.createUser("NoGoalsUser")
        .then((b) => b.addPerson("No Goals Person", 25))
        .then((b) => b.build());

      const goals = await authenticatedFetch<EnrichedSavingsGoal[]>(
        userWithoutGoals,
        "/api/savings-goals"
      );

      expect(goals).toEqual([]);
    });

    it("should return all savings goals for authenticated user's household", async () => {
      const goals = await authenticatedFetch<EnrichedSavingsGoal[]>(
        testUsers.user1,
        "/api/savings-goals"
      );

      expect(goals).toHaveLength(2);
      expect(goals).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: "House Down Payment",
            targetAmount: "50000.00",
            priority: 3,
            category: "house",
            householdId: testUsers.user1.householdId,
          }),
          expect.objectContaining({
            name: "Emergency Fund Goal",
            targetAmount: "10000.00",
            priority: 2,
            category: "emergency",
            householdId: testUsers.user1.householdId,
          }),
        ])
      );
    });

    it("should return goals with enriched progress data", async () => {
      const goals = await authenticatedFetch<EnrichedSavingsGoal[]>(
        testUsers.user1,
        "/api/savings-goals"
      );

      const houseGoal = goals.find((g) => g.name === "House Down Payment");
      expect(houseGoal).toBeDefined();
      expect(houseGoal!.currentAmount).toBeDefined();
      expect(houseGoal!.progressPercentage).toBeDefined();
      expect(houseGoal!.remainingAmount).toBeDefined();
      expect(houseGoal!.estimatedMonthsToGoal).toBeDefined();
      expect(houseGoal!.estimatedCompletionDate).toBeDefined();
    });

    it("should return goals with linked savings account IDs", async () => {
      const goals = await authenticatedFetch<EnrichedSavingsGoal[]>(
        testUsers.user1,
        "/api/savings-goals"
      );

      const houseGoal = goals.find((g) => g.name === "House Down Payment");
      expect(houseGoal).toBeDefined();
      expect(houseGoal!.savingsAccountIds).toBeDefined();
      expect(houseGoal!.savingsAccountIds).toHaveLength(2);
      expect(houseGoal!.savingsAccountIds).toEqual(
        expect.arrayContaining([
          testUsers.user1.persons[0].savingsAccounts![0].id,
          testUsers.user1.persons[1].savingsAccounts![0].id,
        ])
      );
    });

    it("should only return goals for the authenticated user's household", async () => {
      const goals = await authenticatedFetch<EnrichedSavingsGoal[]>(
        testUsers.user2,
        "/api/savings-goals"
      );

      expect(goals).toHaveLength(1);
      expect(goals[0]).toMatchObject({
        name: "Retirement Goal",
        householdId: testUsers.user2.householdId,
      });
    });
  });

  describe("POST /api/savings-goals", () => {
    it("should return 401 when no authentication provided", async () => {
      try {
        await $fetch("/api/savings-goals", {
          method: "POST",
          body: {
            name: "Test Goal",
            targetAmount: "5000",
            householdId: testUsers.user1.householdId,
          },
        });
        expect.fail("Expected request to fail with 401");
      } catch (error) {
        const fetchError = error as FetchError;
        expect(fetchError.status).toBe(401);
      }
    });

    it("should return 400 when required fields are missing", async () => {
      try {
        await authenticatedFetch<SavingsGoal>(
          testUsers.user1,
          "/api/savings-goals",
          {
            method: "POST",
            body: {
              // Missing name and targetAmount
              householdId: testUsers.user1.householdId,
            },
          }
        );
        expect.fail("Expected request to fail with 400");
      } catch (error) {
        const fetchError = error as FetchError;
        expect(fetchError.status).toBe(400);
      }
    });

    it("should create a new savings goal", async () => {
      const newGoal = await authenticatedFetch<SavingsGoal>(
        testUsers.user1,
        "/api/savings-goals",
        {
          method: "POST",
          body: {
            name: "New Car Fund",
            description: "Save for a reliable used car",
            targetAmount: "15000",
            priority: 2,
            category: "vehicle",
            householdId: testUsers.user1.householdId,
          },
        }
      );

      expect(newGoal).toMatchObject({
        name: "New Car Fund",
        description: "Save for a reliable used car",
        targetAmount: "15000.00",
        priority: 2,
        category: "vehicle",
        householdId: testUsers.user1.householdId,
        isCompleted: false,
      });
      expect(newGoal.id).toBeDefined();
      expect(newGoal.createdAt).toBeDefined();
    });

    it("should create a goal with linked savings accounts", async () => {
      const accountId = testUsers.user1.persons[0].savingsAccounts![0].id;

      const newGoal = await authenticatedFetch<SavingsGoal>(
        testUsers.user1,
        "/api/savings-goals",
        {
          method: "POST",
          body: {
            name: "Vacation Fund",
            targetAmount: "3000",
            priority: 1,
            category: "vacation",
            householdId: testUsers.user1.householdId,
            savingsAccountIds: [accountId],
          },
        }
      );

      expect(newGoal).toMatchObject({
        name: "Vacation Fund",
        targetAmount: "3000.00",
      });

      // Verify the link was created by fetching goals
      const goals = await authenticatedFetch<EnrichedSavingsGoal[]>(
        testUsers.user1,
        "/api/savings-goals"
      );

      const vacationGoal = goals.find((g) => g.name === "Vacation Fund");
      expect(vacationGoal).toBeDefined();
      expect(vacationGoal!.savingsAccountIds).toContain(accountId);
    });

    it("should return 403 when trying to create goal for another user's household", async () => {
      try {
        await authenticatedFetch<SavingsGoal>(
          testUsers.user1,
          "/api/savings-goals",
          {
            method: "POST",
            body: {
              name: "Unauthorized Goal",
              targetAmount: "5000",
              householdId: testUsers.user2.householdId,
            },
          }
        );
        expect.fail("Expected request to fail with 403");
      } catch (error) {
        const fetchError = error as FetchError;
        expect(fetchError.status).toBe(403);
      }
    });

    it("should return 400 when linking accounts from different household", async () => {
      const otherUserAccountId =
        testUsers.user2.persons[0].savingsAccounts![0].id;

      try {
        await authenticatedFetch<SavingsGoal>(
          testUsers.user1,
          "/api/savings-goals",
          {
            method: "POST",
            body: {
              name: "Invalid Link Goal",
              targetAmount: "5000",
              householdId: testUsers.user1.householdId,
              savingsAccountIds: [otherUserAccountId],
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
});
