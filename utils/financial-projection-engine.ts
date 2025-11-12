/**
 * Financial Projection Engine
 * Calculates month-by-month projections for income, expenses, savings, debt, and net worth
 */

export interface ProjectionInputs {
  // Current state
  currentNetWorth: number;
  currentSavings: number;
  currentInvestments: number;
  currentDebt: number;

  // Monthly cash flow
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyDebtPayment: number;

  // Growth rates (as decimals, e.g., 0.03 = 3%)
  incomeGrowthRate: number; // Annual income growth
  expenseGrowthRate: number; // Annual expense inflation
  savingsInterestRate: number; // Annual savings interest
  investmentReturnRate: number; // Annual investment returns

  // Optional adjustments
  additionalMonthlySavings?: number; // Extra amount to save each month
  lumpSumEvents?: Array<{
    month: number; // Month number (0-119 for 10 years)
    amount: number; // Positive for income, negative for expense
    description: string;
  }>;
}

export interface ProjectionDataPoint {
  month: number; // 0-119 for 10 years
  year: number; // 0-9
  monthLabel: string; // "Jan 2026", "Feb 2026", etc.

  // Balance sheet
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  savings: number;
  investments: number;
  debt: number;

  // Cash flow
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyDebtPayment: number;
  netMonthlyCashFlow: number;

  // Cumulative
  cumulativeSavings: number;
  cumulativeDebtPaid: number;
}

export interface ProjectionMilestone {
  month: number;
  type: "debt_free" | "savings_goal" | "net_worth_milestone" | "custom";
  title: string;
  description: string;
  amount?: number;
}

export interface FinancialProjection {
  dataPoints: ProjectionDataPoint[];
  milestones: ProjectionMilestone[];
  summary: {
    startNetWorth: number;
    endNetWorth: number;
    totalGrowth: number;
    totalDebtPaid: number;
    totalSavingsAccumulated: number;
    averageMonthlyIncome: number;
    averageMonthlyExpenses: number;
  };
}

export class FinancialProjectionEngine {
  private inputs: ProjectionInputs;
  private readonly MONTHS_TO_PROJECT = 120; // 10 years

  constructor(inputs: ProjectionInputs) {
    this.inputs = inputs;
  }

  /**
   * Generate full 10-year projection
   */
  generate(): FinancialProjection {
    const dataPoints: ProjectionDataPoint[] = [];
    const milestones: ProjectionMilestone[] = [];

    // Starting values
    let savings = this.inputs.currentSavings;
    let investments = this.inputs.currentInvestments;
    let debt = this.inputs.currentDebt;
    let monthlyIncome = this.inputs.monthlyIncome;
    let monthlyExpenses = this.inputs.monthlyExpenses;
    let monthlyDebtPayment = this.inputs.monthlyDebtPayment;

    let cumulativeSavings = 0;
    let cumulativeDebtPaid = 0;
    let debtFreeMilestoneAdded = false;

    const currentDate = new Date();

    // Add initial data point (month 0) showing current state BEFORE projections
    const initialNetWorth = this.inputs.currentNetWorth;
    const initialTotalAssets = savings + investments;
    const initialMonthLabel = currentDate.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });

    dataPoints.push({
      month: 0,
      year: 0,
      monthLabel: initialMonthLabel,
      netWorth: initialNetWorth,
      totalAssets: initialTotalAssets,
      totalLiabilities: debt,
      savings,
      investments,
      debt,
      monthlyIncome,
      monthlyExpenses,
      monthlyDebtPayment,
      netMonthlyCashFlow:
        monthlyIncome -
        monthlyExpenses -
        monthlyDebtPayment -
        (this.inputs.additionalMonthlySavings || 0),
      cumulativeSavings: 0,
      cumulativeDebtPaid: 0,
    });

    // Generate monthly projections
    for (let month = 1; month <= this.MONTHS_TO_PROJECT; month++) {
      const year = Math.floor(month / 12);
      const monthOfYear = month % 12;

      // Apply annual growth rates at the start of each year (except month 0)
      if (month > 0 && monthOfYear === 0) {
        monthlyIncome *= 1 + this.inputs.incomeGrowthRate;
        monthlyExpenses *= 1 + this.inputs.expenseGrowthRate;
      }

      // Apply interest/returns monthly
      const monthlySavingsRate = this.inputs.savingsInterestRate / 12;
      const monthlyInvestmentRate = this.inputs.investmentReturnRate / 12;

      savings += savings * monthlySavingsRate;
      investments += investments * monthlyInvestmentRate;

      // Calculate monthly cash flow
      const additionalSavings = this.inputs.additionalMonthlySavings || 0;
      let netCashFlow =
        monthlyIncome -
        monthlyExpenses -
        monthlyDebtPayment -
        additionalSavings;

      // Check for lump sum events
      const lumpSumEvent = this.inputs.lumpSumEvents?.find(
        (e) => e.month === month
      );
      if (lumpSumEvent) {
        netCashFlow += lumpSumEvent.amount;

        if (lumpSumEvent.amount !== 0) {
          milestones.push({
            month,
            type: "custom",
            title: lumpSumEvent.description,
            description:
              lumpSumEvent.amount > 0
                ? `Received $${Math.abs(lumpSumEvent.amount).toLocaleString()}`
                : `Paid $${Math.abs(lumpSumEvent.amount).toLocaleString()}`,
            amount: lumpSumEvent.amount,
          });
        }
      }

      // Pay down debt
      if (debt > 0 && monthlyDebtPayment > 0) {
        const debtPayment = Math.min(debt, monthlyDebtPayment);
        debt -= debtPayment;
        cumulativeDebtPaid += debtPayment;

        // Debt-free milestone
        if (debt === 0 && !debtFreeMilestoneAdded) {
          milestones.push({
            month,
            type: "debt_free",
            title: "Debt Free! 🎉",
            description: `All debt paid off after ${Math.floor(
              month / 12
            )} years and ${month % 12} months`,
            amount: cumulativeDebtPaid,
          });
          debtFreeMilestoneAdded = true;
          // Redirect debt payment to savings after debt is paid off
          monthlyDebtPayment = 0;
          netCashFlow += debtPayment;
        }
      }

      // Allocate remaining cash flow
      if (netCashFlow > 0) {
        // Split between savings and investments (70/30)
        const toSavings = netCashFlow * 0.7;
        const toInvestments = netCashFlow * 0.3;
        savings += toSavings + additionalSavings;
        investments += toInvestments;
        cumulativeSavings += netCashFlow + additionalSavings;
      } else if (netCashFlow < 0) {
        // Deficit - withdraw from savings first, then investments
        if (savings >= Math.abs(netCashFlow)) {
          savings += netCashFlow; // netCashFlow is negative
          cumulativeSavings += netCashFlow;
        } else {
          cumulativeSavings -= savings;
          netCashFlow += savings; // Reduce deficit by available savings
          savings = 0;

          // Take from investments if needed
          if (investments >= Math.abs(netCashFlow)) {
            investments += netCashFlow;
          } else {
            investments = 0;
          }
        }
      }

      // Calculate totals
      const totalAssets = savings + investments;
      const totalLiabilities = debt;
      const netWorth = totalAssets - totalLiabilities;

      // Create month label
      const projectionDate = new Date(currentDate);
      projectionDate.setMonth(currentDate.getMonth() + month);
      const monthLabel = projectionDate.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });

      // Add data point
      dataPoints.push({
        month: month, // month is now 1-120 instead of 0-119
        year,
        monthLabel,
        netWorth,
        totalAssets,
        totalLiabilities,
        savings,
        investments,
        debt,
        monthlyIncome,
        monthlyExpenses,
        monthlyDebtPayment,
        netMonthlyCashFlow:
          monthlyIncome - monthlyExpenses - monthlyDebtPayment,
        cumulativeSavings,
        cumulativeDebtPaid,
      });

      // Check for net worth milestones
      if (month > 0 && netWorth > 0) {
        const milestoneAmounts = [50000, 100000, 250000, 500000, 1000000];
        const previousNetWorth = dataPoints[month - 1].netWorth;

        for (const milestone of milestoneAmounts) {
          if (previousNetWorth < milestone && netWorth >= milestone) {
            milestones.push({
              month,
              type: "net_worth_milestone",
              title: `Net Worth: $${(milestone / 1000).toLocaleString()}K`,
              description: `Reached $${milestone.toLocaleString()} net worth`,
              amount: milestone,
            });
          }
        }
      }
    }

    // Calculate summary
    const startNetWorth = dataPoints[0].netWorth;
    const endNetWorth = dataPoints[dataPoints.length - 1].netWorth;
    const totalGrowth = endNetWorth - startNetWorth;

    const avgIncome =
      dataPoints.reduce((sum, dp) => sum + dp.monthlyIncome, 0) /
      dataPoints.length;
    const avgExpenses =
      dataPoints.reduce((sum, dp) => sum + dp.monthlyExpenses, 0) /
      dataPoints.length;

    return {
      dataPoints,
      milestones: milestones.sort((a, b) => a.month - b.month),
      summary: {
        startNetWorth,
        endNetWorth,
        totalGrowth,
        totalDebtPaid: cumulativeDebtPaid,
        totalSavingsAccumulated: cumulativeSavings,
        averageMonthlyIncome: avgIncome,
        averageMonthlyExpenses: avgExpenses,
      },
    };
  }

  /**
   * Update projection with new parameters (for interactive adjustments)
   */
  updateInputs(updates: Partial<ProjectionInputs>): void {
    this.inputs = { ...this.inputs, ...updates };
  }
}
