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

describe("/api/savings-accounts integration tests", async () => {
  await setup({
    host: `http://localhost:${process.env.NUXT_DEVSERVER_PORT || 5000}`,
  });

  let testUsers: {
    user1: TestUser & { persons: TestPerson[] };
    user2: TestUser & { persons: TestPerson[] };
  };

  beforeAll(async () => {
    // Set up test data before running tests - create two users with persons and savings accounts
    const user1 = await TestDataBuilder.createUser("SavingsTestUser1")
      .then((b) => b.addPerson("John Savings1", 30))
      .then((b) =>
        b.addSavingsAccount({
          name: "Emergency Fund John",
          currentBalance: 10000,
          interestRate: 0.025,
          accountType: "emergency",
        })
      )
      .then((b) => b.addPerson("Jane Savings1", 28))
      .then((b) =>
        b.addSavingsAccount({
          name: "Investment Account Jane",
          currentBalance: 25000,
          interestRate: 0.045,
          accountType: "investment",
        })
      );

    const user2 = await TestDataBuilder.createUser("SavingsTestUser2")
      .then((b) => b.addPerson("Bob Savings2", 35))
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

  describe("GET /api/savings-accounts", () => {
    it("should return 401 when no authentication provided", async () => {
      try {
        await $fetch("/api/savings-accounts?personId=1");
        expect.fail("Expected request to fail with 401");
      } catch (error) {
        const fetchError = error as FetchError;
        expect(fetchError.status).toBe(401);
      }
    });

    it("should return 403 when requesting savings accounts for another user's person", async () => {
      const otherUserPersonId = testUsers.user2.persons[0].id;

      try {
        await authenticatedFetch<SavingsAccount[]>(
          testUsers.user1,
          `/api/savings-accounts?personId=${otherUserPersonId}`
        );
        expect.fail("Expected request to fail with 403");
      } catch (error) {
        const fetchError = error as FetchError;
        expect(fetchError.status).toBe(403);
        expect(fetchError.statusText).toContain(
          "Access denied: Person does not belong to your household"
        );
      }
    });

    it("should return empty array when person has no savings accounts", async () => {
      // Create a person with no savings accounts
      const userWithoutSavings = await TestDataBuilder.createUser(
        "NoSavingsUser"
      )
        .then((b) => b.addPerson("No Savings Person", 25))
        .then((b) => b.build());

      const savingsAccounts = await authenticatedFetch<SavingsAccount[]>(
        userWithoutSavings,
        `/api/savings-accounts?personId=${userWithoutSavings.persons[0].id}`
      );

      expect(savingsAccounts).toEqual([]);
    });

    it("should return savings accounts for own person", async () => {
      const savingsAccounts = await authenticatedFetch<SavingsAccount[]>(
        testUsers.user1,
        `/api/savings-accounts?personId=${testUsers.user1.persons[0].id}`
      );

      expect(savingsAccounts).toHaveLength(1);
      expect(savingsAccounts[0]).toMatchObject({
        name: "Emergency Fund John",
        currentBalance: "10000.00",
        interestRate: "0.0250",
        accountType: "emergency",
        personId: testUsers.user1.persons[0].id,
      });
      expect(savingsAccounts[0].id).toBeDefined();
      expect(savingsAccounts[0].createdAt).toBeDefined();
    });

    it("should return all savings accounts when no personId provided", async () => {
      const savingsAccounts = await authenticatedFetch<SavingsAccount[]>(
        testUsers.user1,
        "/api/savings-accounts"
      );

      expect(savingsAccounts).toHaveLength(2);
      expect(savingsAccounts).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: "Emergency Fund John",
            currentBalance: "10000.00",
            personId: testUsers.user1.persons[0].id,
          }),
          expect.objectContaining({
            name: "Investment Account Jane",
            currentBalance: "25000.00",
            personId: testUsers.user1.persons[1].id,
          }),
        ])
      );
    });

    it("should return empty array when user has no persons", async () => {
      const userWithoutPersons = await TestDataBuilder.createUser(
        "NoPersonsUser"
      ).then((b) => b.build());

      const savingsAccounts = await authenticatedFetch<SavingsAccount[]>(
        userWithoutPersons,
        "/api/savings-accounts"
      );

      expect(savingsAccounts).toEqual([]);
    });
  });

  describe("POST /api/savings-accounts", () => {
    it("should return 401 when no authentication provided", async () => {
      try {
        await $fetch("/api/savings-accounts", {
          method: "POST",
          body: {
            name: "Test Account",
            currentBalance: 5000,
            personId: testUsers.user1.persons[0].id,
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
        await authenticatedFetch<SavingsAccount>(
          testUsers.user1,
          "/api/savings-accounts",
          {
            method: "POST",
            body: {
              name: "Incomplete Account",
              // Missing required fields
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

    it("should return 403 when trying to create savings account for another user's person", async () => {
      try {
        await authenticatedFetch<SavingsAccount>(
          testUsers.user1,
          "/api/savings-accounts",
          {
            method: "POST",
            body: {
              name: "Unauthorized Account",
              currentBalance: 5000,
              personId: testUsers.user2.persons[0].id, // Another user's person
            },
          }
        );
        expect.fail("Expected request to fail with 403");
      } catch (error) {
        const fetchError = error as FetchError;
        expect(fetchError.status).toBe(403);
        expect(fetchError.statusText).toContain(
          "Access denied: Person does not belong to your household"
        );
      }
    });

    it("should allow creating savings account for own person", async () => {
      const newAccount = await authenticatedFetch<SavingsAccount>(
        testUsers.user1,
        "/api/savings-accounts",
        {
          method: "POST",
          body: {
            name: "New Vacation Fund",
            currentBalance: 3000,
            interestRate: 0.02,
            accountType: "vacation",
            personId: testUsers.user1.persons[1].id,
          },
        }
      );

      expect(newAccount).toMatchObject({
        name: "New Vacation Fund",
        currentBalance: "3000.00",
        interestRate: "0.0200",
        accountType: "vacation",
        personId: testUsers.user1.persons[1].id,
      });
      expect(newAccount.id).toBeDefined();
      expect(newAccount.createdAt).toBeDefined();
    });

    it("should create savings account with minimal required fields", async () => {
      const minimalAccount = await authenticatedFetch<SavingsAccount>(
        testUsers.user1,
        "/api/savings-accounts",
        {
          method: "POST",
          body: {
            name: "Minimal Account",
            currentBalance: 1000,
            personId: testUsers.user1.persons[0].id,
          },
        }
      );

      expect(minimalAccount).toMatchObject({
        name: "Minimal Account",
        currentBalance: "1000.00",
        personId: testUsers.user1.persons[0].id,
      });
      expect(minimalAccount.interestRate).toBeNull();
      expect(minimalAccount.accountType).toBeNull();
      expect(minimalAccount.monthlyDeposit).toBeNull();
    });

    it("should create savings account with monthly deposit", async () => {
      const accountWithDeposit = await authenticatedFetch<SavingsAccount>(
        testUsers.user1,
        "/api/savings-accounts",
        {
          method: "POST",
          body: {
            name: "Monthly Savings",
            currentBalance: 5000,
            monthlyDeposit: 500,
            interestRate: 0.03,
            personId: testUsers.user1.persons[0].id,
          },
        }
      );

      expect(accountWithDeposit).toMatchObject({
        name: "Monthly Savings",
        currentBalance: "5000.00",
        monthlyDeposit: "500.00",
        interestRate: "0.0300",
        personId: testUsers.user1.persons[0].id,
      });
    });
  });
});
