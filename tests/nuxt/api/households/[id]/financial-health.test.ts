import { describe, it, expect, beforeAll } from "vitest";
import { $fetch, setup } from "@nuxt/test-utils/e2e";
import type { ApiSuccessResponse } from "../../../../../server/utils/api-response";
import { createTestUser } from "../../../utils/test-data";

await setup();

describe("GET /api/households/:id/financial-health", () => {
  let authCookie: string;
  let householdId: number;

  beforeAll(async () => {
    const testUser = await createTestUser("HealthTest");
    authCookie = `better-auth.session_token=${testUser.sessionCookie}`;
    householdId = testUser.householdId;
  });

  it("should require authentication", async () => {
    await expect(
      $fetch(`/api/households/${householdId}/financial-health`)
    ).rejects.toThrow();
  });

  it("should return 404 for non-existent household", async () => {
    await expect(
      $fetch("/api/households/99999/financial-health", {
        headers: { cookie: authCookie },
      })
    ).rejects.toThrow();
  });

  it("should return financial health data structure", async () => {
    const { data } = await $fetch<
      ApiSuccessResponse<{
        netWorth: {
          total: number;
          assets: number;
          liabilities: number;
          breakdown: { savings: number; investments: number; debt: number };
        };
        cashFlow: {
          monthly: {
            income: number;
            expenses: number;
            debtPayments: number;
            netCashFlow: number;
          };
          annual: {
            income: number;
            expenses: number;
            debtPayments: number;
            netCashFlow: number;
          };
          savingsRate: number;
          status: string;
        };
        debtToIncome: {
          ratio: number;
          monthlyPayments: number;
          monthlyIncome: number;
          status: string;
        };
        emergencyFund: {
          currentBalance: number;
          monthsOfExpenses: number;
          targetMonths: number;
          isAdequate: boolean;
          status: string;
        };
        summary: { overallHealth: string };
      }>
    >(`/api/households/${householdId}/financial-health`, {
      headers: { cookie: authCookie },
    });

    // Verify structure
    expect(data.netWorth).toBeDefined();
    expect(data.netWorth.total).toBeDefined();
    expect(data.netWorth.assets).toBeDefined();
    expect(data.netWorth.liabilities).toBeDefined();
    expect(data.netWorth.breakdown).toBeDefined();

    expect(data.cashFlow).toBeDefined();
    expect(data.cashFlow.monthly).toBeDefined();
    expect(data.cashFlow.annual).toBeDefined();
    expect(data.cashFlow.savingsRate).toBeDefined();
    expect(data.cashFlow.status).toBeDefined();

    expect(data.debtToIncome).toBeDefined();
    expect(data.debtToIncome.ratio).toBeDefined();
    expect(data.debtToIncome.status).toBeDefined();

    expect(data.emergencyFund).toBeDefined();
    expect(data.emergencyFund.monthsOfExpenses).toBeDefined();
    expect(data.emergencyFund.targetMonths).toBe(6);
    expect(data.emergencyFund.status).toBeDefined();

    expect(data.summary).toBeDefined();
    expect(data.summary.overallHealth).toBeDefined();
    expect(["excellent", "good", "fair", "poor"]).toContain(
      data.summary.overallHealth
    );
  });

  it("should return zero values for empty household", async () => {
    const { data } = await $fetch<
      ApiSuccessResponse<{
        netWorth: { total: number };
        cashFlow: { monthly: { income: number; expenses: number } };
      }>
    >(`/api/households/${householdId}/financial-health`, {
      headers: { cookie: authCookie },
    });

    // New household should have all zeros
    expect(data.netWorth.total).toBe(0);
    expect(data.cashFlow.monthly.income).toBe(0);
    expect(data.cashFlow.monthly.expenses).toBe(0);
  });
});
