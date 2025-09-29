import { eq, and } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as tables from "~~/database/schema";

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
  targetDate: Date | null;
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
    const amount = parseFloat(income.amount);
    switch (income.frequency?.toLowerCase()) {
      case "weekly":
        return sum + (amount * 52) / 12;
      case "monthly":
        return sum + amount;
      case "yearly":
      case "annual":
        return sum + amount / 12;
      case "bi-weekly":
        return sum + (amount * 26) / 12;
      default:
        return sum + amount;
    }
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
    const amount = parseFloat(expense.amount);
    switch (expense.frequency?.toLowerCase()) {
      case "weekly":
        return sum + (amount * 52) / 12;
      case "monthly":
        return sum + amount;
      case "yearly":
      case "annual":
        return sum + amount / 12;
      case "bi-weekly":
        return sum + (amount * 26) / 12;
      default:
        return sum + amount;
    }
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
    targetDate: Date | null;
    isCompleted: boolean;
    completedAt: Date | null;
    priority: number | null;
    category: string | null;
    createdAt: Date;
    updatedAt: Date;
  }>,
  householdId: number,
  db: NodePgDatabase<any>
): Promise<EnrichedSavingsGoal[]> {
  const financialData = await calculateHouseholdFinancials(householdId, db);

  return goals.map((goal) => {
    const targetAmount = parseFloat(goal.targetAmount);

    // For now, use total savings as current amount
    // In the future, could implement goal-specific allocation
    const currentAmount = financialData.totalSavings;

    const progressPercentage =
      targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;
    const remainingAmount = Math.max(0, targetAmount - currentAmount);

    let estimatedMonthsToGoal: number | null = null;
    let estimatedCompletionDate: Date | null = null;

    if (financialData.netMonthlySavings > 0 && remainingAmount > 0) {
      estimatedMonthsToGoal = Math.ceil(
        remainingAmount / financialData.netMonthlySavings
      );
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
  });
}
