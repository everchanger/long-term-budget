import type { FinancialProjection } from "../../utils/financial-projection-engine";

export interface IncomeSource {
  id: number;
  name: string;
  amount: number;
  frequency: string;
  monthlyAmount: number;
}

export interface SavingsAccount {
  id: number;
  name: string;
  currentBalance: number;
  monthlyDeposit: number;
  interestRate: number;
  accountType: string | null;
}

export interface Loan {
  id: number;
  name: string;
  currentBalance: number;
  monthlyPayment: number;
  interestRate: number;
  loanType: string | null;
}

export interface BrokerAccount {
  id: number;
  name: string;
  currentValue: number;
  brokerName: string | null;
  accountType: string | null;
}

interface PersonDetails {
  person: {
    id: number;
    name: string;
  };
  incomeSources: IncomeSource[];
  savingsAccounts: SavingsAccount[];
  loans: Loan[];
  brokerAccounts: BrokerAccount[];
}

interface Expense {
  name: string;
  amount: number;
  category: string | null;
}

interface ProjectionInputs {
  incomeGrowthRate: number; // as percentage (3 = 3%)
  expenseGrowthRate: number;
  savingsInterestRate: number;
  investmentReturnRate: number;
  additionalMonthlySavings: number;
}

interface ProjectionResponse {
  projection: FinancialProjection;
  inputs: ProjectionInputs;
  currentState: {
    netWorth: number;
    savings: number;
    investments: number;
    debt: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    monthlyDebtPayment: number;
  };
  persons: PersonDetails[];
  expenses: Expense[];
}

interface ProjectionParams {
  incomeGrowth?: number;
  expenseGrowth?: number;
  savingsRate?: number;
  investmentReturn?: number;
  additionalSavings?: number;
  adjustments?: Record<
    number,
    {
      income?: Record<number, Partial<IncomeSource>>;
      savings?: Record<number, Partial<SavingsAccount>>;
      loans?: Record<number, Partial<Loan>>;
      brokers?: Record<number, Partial<BrokerAccount>>;
    }
  >;
}

export function useFinancialProjection(householdId: Ref<number | null>) {
  const data = ref<ProjectionResponse | null>(null);
  const loading = ref(false);
  const error = ref<Error | null>(null);

  // Store current params for updates
  const currentParams = ref<ProjectionParams>({});

  const fetchProjection = async (
    params: ProjectionParams = {},
    showLoading = true
  ) => {
    if (!householdId.value) {
      data.value = null;
      return;
    }

    if (showLoading) {
      loading.value = true;
    }
    error.value = null;
    currentParams.value = params;

    try {
      const query = new URLSearchParams();
      if (params.incomeGrowth !== undefined)
        query.set("incomeGrowth", params.incomeGrowth.toString());
      if (params.expenseGrowth !== undefined)
        query.set("expenseGrowth", params.expenseGrowth.toString());
      if (params.savingsRate !== undefined)
        query.set("savingsRate", params.savingsRate.toString());
      if (params.investmentReturn !== undefined)
        query.set("investmentReturn", params.investmentReturn.toString());
      if (params.additionalSavings !== undefined)
        query.set("additionalSavings", params.additionalSavings.toString());
      if (
        params.adjustments !== undefined &&
        Object.keys(params.adjustments).length > 0
      ) {
        query.set("adjustments", JSON.stringify(params.adjustments));
      }

      const queryString = query.toString();
      const url = `/api/households/${householdId.value}/projections${
        queryString ? `?${queryString}` : ""
      }`;

      const response = await $fetch<{ data: ProjectionResponse }>(url);
      data.value = response.data;
    } catch (e) {
      error.value =
        e instanceof Error ? e : new Error("Failed to fetch projection");
      data.value = null;
    } finally {
      if (showLoading) {
        loading.value = false;
      }
    }
  };

  // Update parameters and regenerate projection
  const updateParams = async (newParams: Partial<ProjectionParams>) => {
    const merged = { ...currentParams.value, ...newParams };
    await fetchProjection(merged, false); // Don't show loading spinner for updates
  };

  // Fetch when householdId changes
  watch(
    householdId,
    () => {
      fetchProjection(currentParams.value);
    },
    { immediate: true }
  );

  // Format helpers for display
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number, decimals = 1) => {
    return `${value.toFixed(decimals)}%`;
  };

  // Chart data helpers
  const getChartLabels = () => {
    if (!data.value) return [];
    return data.value.projection.dataPoints.map((point) => point.monthLabel);
  };

  const getNetWorthData = () => {
    if (!data.value) return [];
    return data.value.projection.dataPoints.map((point) => point.netWorth);
  };

  const getSavingsData = () => {
    if (!data.value) return [];
    return data.value.projection.dataPoints.map((point) => point.savings);
  };

  const getInvestmentsData = () => {
    if (!data.value) return [];
    return data.value.projection.dataPoints.map((point) => point.investments);
  };

  const getDebtData = () => {
    if (!data.value) return [];
    return data.value.projection.dataPoints.map((point) => point.debt);
  };

  const getTotalAssetsData = () => {
    if (!data.value) return [];
    return data.value.projection.dataPoints.map((point) => point.totalAssets);
  };

  // Get simplified data for chart (yearly instead of monthly)
  const getYearlyData = () => {
    if (!data.value) return [];

    // Get data for December of each year (every 12th month starting at index 11)
    return data.value.projection.dataPoints.filter(
      (_, index) => (index + 1) % 12 === 0
    );
  };

  const getYearlyLabels = () => {
    const yearlyData = getYearlyData();
    return yearlyData.map((point) => `Year ${point.year}`);
  };

  const getYearlyNetWorth = () => {
    const yearlyData = getYearlyData();
    return yearlyData.map((point) => point.netWorth);
  };

  const getYearlySavings = () => {
    const yearlyData = getYearlyData();
    return yearlyData.map((point) => point.savings);
  };

  const getYearlyInvestments = () => {
    const yearlyData = getYearlyData();
    return yearlyData.map((point) => point.investments);
  };

  const getYearlyDebt = () => {
    const yearlyData = getYearlyData();
    return yearlyData.map((point) => point.debt);
  };

  return {
    // State
    data: readonly(data),
    loading: readonly(loading),
    error: readonly(error),

    // Actions
    fetchProjection,
    updateParams,

    // Format helpers
    formatCurrency,
    formatPercent,

    // Chart data (all months)
    getChartLabels,
    getNetWorthData,
    getSavingsData,
    getInvestmentsData,
    getDebtData,
    getTotalAssetsData,

    // Chart data (yearly simplified)
    getYearlyData,
    getYearlyLabels,
    getYearlyNetWorth,
    getYearlySavings,
    getYearlyInvestments,
    getYearlyDebt,
  };
}
