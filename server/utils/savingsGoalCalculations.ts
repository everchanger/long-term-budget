import { eq, and, inArray } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as tables from "~~/database/schema";
import { toMonthlyAmount } from "../../utils/financial-calculations";

interface FinancialData {
  totalSavings: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyLoanPayments: number;
  netMonthlySavings: number;
}

interface EnrichedSavingsGoal {
  id: number;
  householdId: number;
  name: string;
  description: string | null;
  targetAmount: string;
  isCompleted: boolean;
  completedAt: Date | null;
  priority: number | null;
  category: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Calculated fields
  currentAmount: number;
  progressPercentage: number;
  remainingAmount: number;
  estimatedMonthsToGoal: number | null;
  estimatedCompletionDate: Date | null;
}

/**
 * Calculate household financial data from all persons in the household
 */
export async function calculateHouseholdFinancials(
  householdId: number,
  db: NodePgDatabase<any>
): Promise<FinancialData> {
  // Get all persons in the household
  const householdPersons = await db
    .select({ id: tables.persons.id })
    .from(tables.persons)
    .where(eq(tables.persons.householdId, householdId));

  const personIds = householdPersons.map((p) => p.id);

  if (personIds.length === 0) {
    return {
      totalSavings: 0,
      monthlyIncome: 0,
      monthlyExpenses: 0,
      monthlyLoanPayments: 0,
      netMonthlySavings: 0,
    };
  }

  // Calculate total savings from all savings accounts
  const savingsAccounts = await db
    .select({ currentBalance: tables.savingsAccounts.currentBalance })
    .from(tables.savingsAccounts)
    .where(eq(tables.savingsAccounts.personId, personIds[0])); // Using first person for now

  const totalSavings = savingsAccounts.reduce(
    (sum, account) => sum + parseFloat(account.currentBalance),
    0
  );

  // Calculate monthly income
  const incomeSourcesData = await db
    .select({
      amount: tables.incomeSources.amount,
      frequency: tables.incomeSources.frequency,
    })
    .from(tables.incomeSources)
    .where(
      and(
        eq(tables.incomeSources.personId, personIds[0]),
        eq(tables.incomeSources.isActive, true)
      )
    );

  const monthlyIncome = incomeSourcesData.reduce((sum, income) => {
    return (
      sum +
      toMonthlyAmount(
        income.amount,
        income.frequency?.toLowerCase() || "monthly"
      )
    );
  }, 0);

  // Calculate monthly expenses
  const expensesData = await db
    .select({
      amount: tables.expenses.amount,
      frequency: tables.expenses.frequency,
    })
    .from(tables.expenses)
    .where(
      and(
        eq(tables.expenses.personId, personIds[0]),
        eq(tables.expenses.isActive, true)
      )
    );

  const monthlyExpenses = expensesData.reduce((sum, expense) => {
    return (
      sum +
      toMonthlyAmount(
        expense.amount,
        expense.frequency?.toLowerCase() || "monthly"
      )
    );
  }, 0);

  // Calculate monthly loan payments
  const loansData = await db
    .select({ monthlyPayment: tables.loans.monthlyPayment })
    .from(tables.loans)
    .where(eq(tables.loans.personId, personIds[0]));

  const monthlyLoanPayments = loansData.reduce(
    (sum, loan) => sum + parseFloat(loan.monthlyPayment),
    0
  );

  const netMonthlySavings =
    monthlyIncome - monthlyExpenses - monthlyLoanPayments;

  return {
    totalSavings,
    monthlyIncome,
    monthlyExpenses,
    monthlyLoanPayments,
    netMonthlySavings,
  };
}

/**
 * Enrich savings goals with calculated progress data
 */
export async function enrichSavingsGoalsWithProgress(
  goals: Array<{
    id: number;
    householdId: number;
    name: string;
    description: string | null;
    targetAmount: string;
    isCompleted: boolean;
    completedAt: Date | null;
    priority: number | null;
    category: string | null;
    createdAt: Date;
    updatedAt: Date;
    savingsAccountIds?: number[];
  }>,
  householdId: number,
  db: NodePgDatabase<any>
): Promise<EnrichedSavingsGoal[]> {
  const financialData = await calculateHouseholdFinancials(householdId, db);

  // Get all savings accounts for the household
  const householdPersons = await db
    .select({ id: tables.persons.id })
    .from(tables.persons)
    .where(eq(tables.persons.householdId, householdId));

  const personIds = householdPersons.map((p) => p.id);

  return Promise.all(
    goals.map(async (goal) => {
      const targetAmount = parseFloat(goal.targetAmount);

      let currentAmount = 0;
      let monthlyDeposits = 0;

      if (goal.savingsAccountIds && goal.savingsAccountIds.length > 0) {
        // Calculate from specific linked accounts only
        for (const accountId of goal.savingsAccountIds) {
          const accounts = await db
            .select({
              currentBalance: tables.savingsAccounts.currentBalance,
              monthlyDeposit: tables.savingsAccounts.monthlyDeposit,
            })
            .from(tables.savingsAccounts)
            .where(eq(tables.savingsAccounts.id, accountId));

          if (accounts.length > 0) {
            currentAmount += parseFloat(accounts[0].currentBalance);
            if (accounts[0].monthlyDeposit) {
              monthlyDeposits += parseFloat(accounts[0].monthlyDeposit);
            }
          }
        }
      } else {
        // No specific accounts linked - use all household savings
        if (personIds.length > 0) {
          const allAccounts = await db
            .select({
              currentBalance: tables.savingsAccounts.currentBalance,
              monthlyDeposit: tables.savingsAccounts.monthlyDeposit,
            })
            .from(tables.savingsAccounts)
            .where(inArray(tables.savingsAccounts.personId, personIds));

          currentAmount = allAccounts.reduce(
            (sum, account) => sum + parseFloat(account.currentBalance),
            0
          );
          monthlyDeposits = allAccounts.reduce((sum, account) => {
            return (
              sum +
              (account.monthlyDeposit ? parseFloat(account.monthlyDeposit) : 0)
            );
          }, 0);
        }
      }

      const progressPercentage =
        targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;
      const remainingAmount = Math.max(0, targetAmount - currentAmount);

      let estimatedMonthsToGoal: number | null = null;
      let estimatedCompletionDate: Date | null = null;

      // Use monthly deposits if available, otherwise fall back to net monthly savings
      const monthlySavingsRate =
        monthlyDeposits > 0 ? monthlyDeposits : financialData.netMonthlySavings;

      if (monthlySavingsRate > 0 && remainingAmount > 0) {
        estimatedMonthsToGoal = Math.ceil(remainingAmount / monthlySavingsRate);
        estimatedCompletionDate = new Date();
        estimatedCompletionDate.setMonth(
          estimatedCompletionDate.getMonth() + estimatedMonthsToGoal
        );
      }

      return {
        ...goal,
        currentAmount,
        progressPercentage: Math.min(progressPercentage, 100),
        remainingAmount,
        estimatedMonthsToGoal,
        estimatedCompletionDate,
      };
    })
  );
}
