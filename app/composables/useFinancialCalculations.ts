import type {
  SelectIncomeSource,
  SelectLoan,
  SelectSavingsAccount,
  SelectExpense,
} from "~~/database/validation-schemas";
import { toMonthlyAmount } from "~~/utils/financial-calculations";

/**
 * Composable for financial calculations
 * Pure calculation functions that can be tested in isolation
 */
export function useFinancialCalculations() {
  /**
   * Calculate total monthly income from income sources
   * Only includes active income sources
   */
  const calculateMonthlyIncome = (incomes: SelectIncomeSource[]): number => {
    return incomes
      .filter((income) => income.isActive)
      .reduce((total, income) => {
        return total + toMonthlyAmount(income.amount, income.frequency);
      }, 0);
  };

  /**
   * Calculate total monthly expenses from expense records
   * Only includes active expenses
   */
  const calculateMonthlyExpenses = (expenses: SelectExpense[]): number => {
    return expenses
      .filter((expense) => expense.isActive)
      .reduce((total, expense) => {
        return total + toMonthlyAmount(expense.amount, expense.frequency);
      }, 0);
  };

  /**
   * Calculate total outstanding debt from loans
   */
  const calculateTotalDebt = (loans: SelectLoan[]): number => {
    return loans.reduce((total, loan) => {
      return total + parseFloat(loan.currentBalance);
    }, 0);
  };

  /**
   * Calculate total monthly debt payments from loans
   */
  const calculateMonthlyDebtPayments = (loans: SelectLoan[]): number => {
    return loans.reduce((total, loan) => {
      return total + parseFloat(loan.monthlyPayment);
    }, 0);
  };

  /**
   * Calculate total savings across all accounts
   */
  const calculateTotalSavings = (accounts: SelectSavingsAccount[]): number => {
    return accounts.reduce((total, account) => {
      return total + parseFloat(account.currentBalance);
    }, 0);
  };

  /**
   * Calculate net monthly cash flow
   * (Income - Expenses - Debt Payments)
   */
  const calculateMonthlySurplus = (
    monthlyIncome: number,
    monthlyExpenses: number,
    monthlyDebtPayments: number
  ): number => {
    return monthlyIncome - monthlyExpenses - monthlyDebtPayments;
  };

  /**
   * Calculate time to reach a savings goal
   * @param currentAmount - Current savings amount
   * @param goalAmount - Target goal amount
   * @param monthlySavings - Amount saved per month
   * @returns Number of months to reach goal, or null if impossible
   */
  const calculateMonthsToGoal = (
    currentAmount: number,
    goalAmount: number,
    monthlySavings: number
  ): number | null => {
    if (monthlySavings <= 0) return null;
    if (currentAmount >= goalAmount) return 0;

    const amountNeeded = goalAmount - currentAmount;
    return Math.ceil(amountNeeded / monthlySavings);
  };

  return {
    calculateMonthlyIncome,
    calculateMonthlyExpenses,
    calculateTotalDebt,
    calculateMonthlyDebtPayments,
    calculateTotalSavings,
    calculateMonthlySurplus,
    calculateMonthsToGoal,
  };
}
