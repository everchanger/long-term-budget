import { describe, it, expect, beforeAll } from "vitest";
import { setup, $fetch } from "@nuxt/test-utils/e2e";
import {
  TestDataBuilder,
  authenticatedFetch,
  type TestUser,
} from "../../../utils/test-data";

interface FinancialSummary {
  totalMonthlyIncome: number;
  totalAnnualIncome: number;
  totalSavings: number;
  totalInvestments: number;
  totalDebt: number;
  memberCount: number;
  incomeSourcesCount: number; // Calculated in loop, is a number
  loansCount: string; // From SQL count(), is a string
  savingsAccountsCount: string; // From SQL count(), is a string
  investmentAccountsCount: string; // From SQL count(), is a string
}

describe("/api/households/[id]/financial-summary", async () => {
  await setup({
    nuxtConfig: {
      ssr: false,
    },
  });

  let testUserWithFinances: TestUser;
  let testUserEmpty: TestUser;
  let secondUser: TestUser;
  let householdWithFinancesId: number;
  let emptyHouseholdId: number;
  let otherHouseholdId: number;

  beforeAll(async () => {
    // Create test user with financial data
    const user1Builder = await TestDataBuilder.createUser("FinancialUser")
      .then((b) => b.addPerson("John Doe", 35))
      .then((b) =>
        b.addIncomeSource({
          name: "Salary",
          amount: "75000",
          frequency: "monthly",
        })
      )
      .then((b) =>
        b.addSavingsAccount({ name: "Emergency Fund", currentBalance: "25000" })
      )
      .then((b) =>
        b.addLoan({
          name: "Mortgage",
          originalAmount: "300000",
          interestRate: "3.5",
        })
      );

    testUserWithFinances = user1Builder.build();
    householdWithFinancesId = testUserWithFinances.householdId;

    // Create test user with no financial data
    const user2Builder = await TestDataBuilder.createUser("EmptyUser");
    testUserEmpty = user2Builder.build();
    emptyHouseholdId = testUserEmpty.householdId;

    // Create another user for access control tests
    const user3Builder = await TestDataBuilder.createUser("OtherUser");
    secondUser = user3Builder.build();
    otherHouseholdId = secondUser.householdId;
  });

  describe("GET /api/households/[id]/financial-summary", () => {
    it("should return financial summary for household with data", async () => {
      const summary = await authenticatedFetch<FinancialSummary>(
        testUserWithFinances,
        `/api/households/${householdWithFinancesId}/financial-summary`
      );

      expect(summary).toMatchObject({
        totalMonthlyIncome: expect.any(Number),
        totalAnnualIncome: expect.any(Number),
        totalSavings: expect.any(Number),
        totalInvestments: expect.any(Number),
        totalDebt: expect.any(Number),
        memberCount: expect.any(Number),
        incomeSourcesCount: expect.any(Number), // Calculated count
        loansCount: expect.any(String), // SQL count result
        savingsAccountsCount: expect.any(String), // SQL count result
        investmentAccountsCount: expect.any(String), // SQL count result
      });

      // Verify the calculations make sense
      expect(summary.totalMonthlyIncome).toBeGreaterThan(0);
      expect(summary.totalAnnualIncome).toBe(summary.totalMonthlyIncome * 12);
      expect(summary.totalDebt).toBeGreaterThan(0);
      expect(summary.totalSavings).toBeGreaterThan(0);
      expect(summary.memberCount).toBe(1); // We added one person
      expect(summary.incomeSourcesCount).toBe(1); // We added one income source (calculated)
      expect(summary.loansCount).toBe("1"); // We added one loan (SQL count result)
      expect(summary.savingsAccountsCount).toBe("1"); // We added one savings account (SQL count result)
    });

    it("should return zeros for household with no financial data", async () => {
      const summary = await authenticatedFetch<FinancialSummary>(
        testUserEmpty,
        `/api/households/${emptyHouseholdId}/financial-summary`
      );

      expect(summary).toMatchObject({
        totalMonthlyIncome: 0,
        totalAnnualIncome: 0,
        totalSavings: 0,
        totalInvestments: 0,
        totalDebt: 0,
        memberCount: 0,
        incomeSourcesCount: 0,
        loansCount: 0,
        savingsAccountsCount: 0,
        investmentAccountsCount: 0,
      });
    });

    it("should return 401 when unauthenticated", async () => {
      const response = await $fetch(
        `/api/households/${householdWithFinancesId}/financial-summary`,
        {
          method: "GET",
          ignoreResponseError: true,
        }
      );

      expect(response).toMatchObject({
        statusCode: 401,
        statusMessage: "Unauthorized",
      });
    });

    it("should return 404 when accessing other user's household", async () => {
      const response = await authenticatedFetch(
        testUserWithFinances,
        `/api/households/${otherHouseholdId}/financial-summary`,
        { ignoreResponseError: true }
      );

      expect(response).toMatchObject({
        statusCode: 404,
        statusMessage: "Not Found",
      });
    });

    it("should return 400 for invalid household ID", async () => {
      const response = await authenticatedFetch(
        testUserWithFinances,
        `/api/households/invalid-id/financial-summary`,
        { ignoreResponseError: true }
      );

      expect(response).toMatchObject({
        statusCode: 400,
        statusMessage: "Household ID is required",
      });
    });

    it("should return 404 for non-existent household", async () => {
      const response = await authenticatedFetch(
        testUserWithFinances,
        `/api/households/99999/financial-summary`,
        { ignoreResponseError: true }
      );

      expect(response).toMatchObject({
        statusCode: 404,
        statusMessage: "Not Found",
        message: "Household not found or access denied",
      });
    });

    it("should handle household with multiple persons", async () => {
      // Create a user with multiple persons having different financial profiles
      const multiPersonUser = await TestDataBuilder.createUser(
        "MultiPersonUser"
      )
        .then((b) => b.addPerson("Person One", 30))
        .then((b) =>
          b.addIncomeSource({
            name: "Job 1",
            amount: "50000",
            frequency: "monthly",
          })
        )
        .then((b) =>
          b.addSavingsAccount({ name: "Savings 1", currentBalance: "15000" })
        )
        .then((b) => b.addPerson("Person Two", 32))
        .then((b) =>
          b.addIncomeSource({
            name: "Job 2",
            amount: "45000",
            frequency: "monthly",
          })
        )
        .then((b) =>
          b.addLoan({
            name: "Car Loan",
            originalAmount: "25000",
            interestRate: "4.5",
          })
        )
        .then((b) => b.build());

      const summary = await authenticatedFetch<FinancialSummary>(
        multiPersonUser,
        `/api/households/${multiPersonUser.householdId}/financial-summary`
      );

      // Should aggregate data from all persons in the household
      expect(summary.totalMonthlyIncome).toBeGreaterThan(0);
      expect(summary.totalSavings).toBeGreaterThan(0);
      expect(summary.totalDebt).toBeGreaterThan(0);
      expect(summary.memberCount).toBe(2); // Two persons added
      expect(summary.incomeSourcesCount).toBe(2); // Two income sources (calculated count)
      expect(summary.loansCount).toBe("1"); // One loan (SQL count result)
      expect(summary.savingsAccountsCount).toBe("1"); // One savings account (SQL count result)
    });

    it("should handle broker accounts in calculations", async () => {
      // Create a user with broker accounts
      const investorUser = await TestDataBuilder.createUser("InvestorUser")
        .then((b) => b.addPerson("Investor", 40))
        .then((b) =>
          b.addBrokerAccount({
            name: "Investment Portfolio",
            currentValue: "100000",
          })
        )
        .then((b) => b.build());

      const summary = await authenticatedFetch<FinancialSummary>(
        investorUser,
        `/api/households/${investorUser.householdId}/financial-summary`
      );

      // Broker accounts should be included in investments
      expect(summary.totalInvestments).toBeGreaterThanOrEqual(100000);
      expect(summary.investmentAccountsCount).toBe("1");
      expect(summary.memberCount).toBe(1);
    });
  });
});
