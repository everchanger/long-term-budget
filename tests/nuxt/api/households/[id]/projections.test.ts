import { describe, it, expect, beforeAll } from "vitest";
import { setup, $fetch } from "@nuxt/test-utils/e2e";
import { createTestUser } from "../../../utils/test-data";
import type { ApiSuccessResponse } from "../../../../../server/utils/api-response";

await setup();

describe("Financial Projections API", () => {
  let authCookie: string;
  let householdId: number;

  beforeAll(async () => {
    const testUser = await createTestUser("ProjectionsTest");
    authCookie = `better-auth.session_token=${testUser.sessionCookie}`;
    householdId = testUser.householdId;
  });

  it("requires authentication", async () => {
    await expect($fetch(`/api/households/1/projections`)).rejects.toThrow();
  });

  it("returns 404 for non-existent household", async () => {
    await expect(
      $fetch("/api/households/99999/projections", {
        headers: { cookie: authCookie },
      })
    ).rejects.toThrow();
  });

  it("returns valid projection data", async () => {
    interface ProjectionDataPoint {
      month: number;
      year: number;
      monthLabel: string;
      netWorth: number;
      savings: number;
      investments: number;
      debt: number;
      monthlyIncome: number;
      monthlyExpenses: number;
    }

    interface ProjectionData {
      projection: {
        dataPoints: ProjectionDataPoint[];
        milestones: unknown[];
        summary: {
          startNetWorth: number;
          endNetWorth: number;
          totalGrowth: number;
        };
      };
      inputs: {
        incomeGrowthRate: number;
        expenseGrowthRate: number;
        savingsInterestRate: number;
        investmentReturnRate: number;
      };
      currentState: {
        netWorth: number;
        savings: number;
        investments: number;
        debt: number;
        monthlyIncome: number;
        monthlyExpenses: number;
      };
    }

    const { data } = await $fetch<ApiSuccessResponse<ProjectionData>>(
      `/api/households/${householdId}/projections`,
      {
        headers: { cookie: authCookie },
      }
    );

    // Validate projection structure
    expect(data.projection).toBeDefined();
    expect(data.projection.dataPoints).toBeDefined();
    expect(data.projection.milestones).toBeDefined();
    expect(data.projection.summary).toBeDefined();

    // Should have 121 data points (month 0 + 120 months = 10 years)
    expect(data.projection.dataPoints).toHaveLength(121);

    // Validate first data point
    const firstPoint = data.projection.dataPoints[0];
    expect(firstPoint.month).toBeDefined();
    expect(firstPoint.year).toBeDefined();
    expect(firstPoint.monthLabel).toBeDefined();
    expect(firstPoint.netWorth).toBeDefined();
    expect(firstPoint.savings).toBeDefined();
    expect(firstPoint.investments).toBeDefined();
    expect(firstPoint.debt).toBeDefined();

    // Validate inputs
    expect(data.inputs.incomeGrowthRate).toBeDefined();
    expect(data.inputs.expenseGrowthRate).toBeDefined();
    expect(data.inputs.savingsInterestRate).toBeDefined();
    expect(data.inputs.investmentReturnRate).toBeDefined();

    // Validate current state
    expect(data.currentState.netWorth).toBeDefined();
    expect(data.currentState.savings).toBeDefined();
    expect(data.currentState.investments).toBeDefined();
    expect(data.currentState.debt).toBeDefined();

    // Validate summary
    expect(data.projection.summary.startNetWorth).toBeDefined();
    expect(data.projection.summary.endNetWorth).toBeDefined();
    expect(data.projection.summary.totalGrowth).toBeDefined();
  });

  it("accepts query parameters for adjustments", async () => {
    interface ProjectionResponse {
      projection: unknown;
      inputs: {
        incomeGrowthRate: number;
        expenseGrowthRate: number;
        additionalMonthlySavings: number;
      };
      currentState: unknown;
    }

    const { data } = await $fetch<ApiSuccessResponse<ProjectionResponse>>(
      `/api/households/${householdId}/projections?incomeGrowth=5&expenseGrowth=3&additionalSavings=500`,
      {
        headers: { cookie: authCookie },
      }
    );

    expect(data.inputs.incomeGrowthRate).toBe(5);
    expect(data.inputs.expenseGrowthRate).toBe(3);
    expect(data.inputs.additionalMonthlySavings).toBe(500);
  });

  it("calculates net worth growth over time", async () => {
    interface DataPoint {
      month: number;
      netWorth: number;
      savings: number;
      investments: number;
      debt: number;
    }

    interface ProjectionResponse {
      projection: {
        dataPoints: DataPoint[];
        summary: {
          startNetWorth: number;
          endNetWorth: number;
          totalGrowth: number;
        };
      };
      inputs: unknown;
      currentState: unknown;
    }

    const { data } = await $fetch<ApiSuccessResponse<ProjectionResponse>>(
      `/api/households/${householdId}/projections`,
      {
        headers: { cookie: authCookie },
      }
    );

    const { dataPoints, summary } = data.projection;

    // Net worth should generally increase over time (with positive cash flow)
    const firstNetWorth = dataPoints[0].netWorth;
    const lastNetWorth = dataPoints[dataPoints.length - 1].netWorth;

    expect(summary.startNetWorth).toBe(firstNetWorth);
    expect(summary.endNetWorth).toBe(lastNetWorth);
    expect(summary.totalGrowth).toBe(lastNetWorth - firstNetWorth);

    // Each data point should have valid numeric values
    dataPoints.forEach((point, index: number) => {
      expect(typeof point.netWorth).toBe("number");
      expect(typeof point.savings).toBe("number");
      expect(typeof point.investments).toBe("number");
      expect(typeof point.debt).toBe("number");
      // Month should be 0-indexed (month 0 = current state, months 1-120 = projections)
      expect(point.month).toBe(index);
    });
  });
});
