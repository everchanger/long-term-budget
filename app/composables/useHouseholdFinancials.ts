import type {
  SelectPerson,
  SelectIncomeSource,
  SelectLoan,
  SelectSavingsAccount,
} from "~~/database/validation-schemas";

export interface HouseholdFinancialSummary {
  totalMonthlyIncome: number;
  totalMonthlyExpenses: number;
  totalDebt: number;
  totalSavings: number;
  monthlySurplus: number;
  persons: Array<{
    id: number;
    name: string;
    monthlyIncome: number;
    monthlyExpenses: number;
    debt: number;
    savings: number;
  }>;
}

export const useHouseholdFinancials = (householdId: string) => {
  // Fetch all persons for the household
  const {
    data: persons,
    pending: personsLoading,
    refresh: refreshPersons,
  } = useFetch<SelectPerson[]>(`/api/households/${householdId}/persons`, {
    default: () => [],
  });

  // Fetch all financial data for the household
  const {
    data: incomeSources,
    pending: incomeLoading,
    refresh: refreshIncome,
  } = useFetch<SelectIncomeSource[]>("/api/income-sources", {
    default: () => [],
  });

  const {
    data: loans,
    pending: loansLoading,
    refresh: refreshLoans,
  } = useFetch<SelectLoan[]>("/api/loans", {
    default: () => [],
  });

  const {
    data: savingsAccounts,
    pending: savingsLoading,
    refresh: refreshSavings,
  } = useFetch<SelectSavingsAccount[]>("/api/savings-accounts", {
    default: () => [],
  });

  // Helper functions for calculations
  const calculateMonthlyIncome = (incomes: SelectIncomeSource[]) => {
    return incomes
      .filter((income) => income.isActive)
      .reduce((total, income) => {
        const amount = parseFloat(income.amount);
        switch (income.frequency) {
          case "monthly":
            return total + amount;
          case "yearly":
            return total + amount / 12;
          case "weekly":
            return total + amount * 4.33;
          case "bi-weekly":
            return total + amount * 2.17;
          case "daily":
            return total + amount * 30;
          default:
            return total;
        }
      }, 0);
  };

  const calculateTotalDebt = (debts: SelectLoan[]) => {
    return debts.reduce((total, loan) => {
      return total + parseFloat(loan.currentBalance);
    }, 0);
  };

  const calculateTotalSavings = (accounts: SelectSavingsAccount[]) => {
    return accounts.reduce((total, account) => {
      return total + parseFloat(account.currentBalance);
    }, 0);
  };

  const calculateMonthlyDebtPayments = (debts: SelectLoan[]) => {
    return debts.reduce((total, loan) => {
      return total + parseFloat(loan.monthlyPayment);
    }, 0);
  };

  // Computed financial summary
  const financialSummary = computed<HouseholdFinancialSummary>(() => {
    if (
      !persons.value ||
      !incomeSources.value ||
      !loans.value ||
      !savingsAccounts.value
    ) {
      return {
        totalMonthlyIncome: 0,
        totalMonthlyExpenses: 0,
        totalDebt: 0,
        totalSavings: 0,
        monthlySurplus: 0,
        persons: [],
      };
    }

    // Calculate per-person financials
    const personFinancials = persons.value.map((person) => {
      const personIncome = incomeSources.value.filter(
        (income) => income.personId === person.id
      );
      const personLoans = loans.value.filter(
        (loan) => loan.personId === person.id
      );
      const personSavings = savingsAccounts.value.filter(
        (account) => account.personId === person.id
      );

      const monthlyIncome = calculateMonthlyIncome(personIncome);
      const debt = calculateTotalDebt(personLoans);
      const savings = calculateTotalSavings(personSavings);
      const monthlyExpenses = calculateMonthlyDebtPayments(personLoans);

      return {
        id: person.id,
        name: person.name,
        monthlyIncome,
        monthlyExpenses,
        debt,
        savings,
      };
    });

    // Calculate household totals
    const totalMonthlyIncome = personFinancials.reduce(
      (sum, p) => sum + p.monthlyIncome,
      0
    );
    const totalMonthlyExpenses = personFinancials.reduce(
      (sum, p) => sum + p.monthlyExpenses,
      0
    );
    const totalDebt = personFinancials.reduce((sum, p) => sum + p.debt, 0);
    const totalSavings = personFinancials.reduce(
      (sum, p) => sum + p.savings,
      0
    );
    const monthlySurplus = totalMonthlyIncome - totalMonthlyExpenses;

    return {
      totalMonthlyIncome,
      totalMonthlyExpenses,
      totalDebt,
      totalSavings,
      monthlySurplus,
      persons: personFinancials,
    };
  });

  // Loading states
  const isLoading = computed(() => {
    return (
      personsLoading.value ||
      incomeLoading.value ||
      loansLoading.value ||
      savingsLoading.value
    );
  });

  // Refresh all data
  const refreshAll = async () => {
    await Promise.all([
      refreshPersons(),
      refreshIncome(),
      refreshLoans(),
      refreshSavings(),
    ]);
  };

  // Goal calculation utilities
  const calculateTimeToSavingsGoal = (
    targetAmount: number,
    currentAmount: number,
    monthlyContribution?: number
  ) => {
    const remaining = Math.max(targetAmount - currentAmount, 0);
    if (remaining <= 0)
      return { months: 0, description: "Goal already achieved!" };

    // Use monthly surplus if no specific contribution is provided
    const contribution =
      monthlyContribution ||
      Math.max(financialSummary.value.monthlySurplus * 0.5, 0);

    if (contribution <= 0) {
      return {
        months: Infinity,
        description: "Increase income or reduce expenses to achieve this goal",
      };
    }

    const months = Math.ceil(remaining / contribution);
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    let description = "";
    if (years > 0) {
      description =
        remainingMonths > 0
          ? `${years} year${years > 1 ? "s" : ""} and ${remainingMonths} month${
              remainingMonths > 1 ? "s" : ""
            }`
          : `${years} year${years > 1 ? "s" : ""}`;
    } else {
      description = `${months} month${months > 1 ? "s" : ""}`;
    }

    return { months, description };
  };

  const getSuggestedMonthlyContribution = (
    targetAmount: number,
    currentAmount: number
  ) => {
    const remaining = Math.max(targetAmount - currentAmount, 0);
    if (remaining <= 0) return 0;

    // Suggest using 50% of monthly surplus
    return Math.max(financialSummary.value.monthlySurplus * 0.5, 0);
  };

  return {
    // Data
    persons,
    incomeSources,
    loans,
    savingsAccounts,

    // Computed
    financialSummary,
    isLoading,

    // Functions
    refreshAll,
    calculateTimeToSavingsGoal,
    getSuggestedMonthlyContribution,
  };
};
