import type { SelectIncomeSource } from "~~/database/validation-schemas";
import type { ApiSuccessResponse } from "~~/server/utils/api-response";
import { useFinancialCalculations } from "./useFinancialCalculations";

export const useIncomeSources = (personId: string) => {
  const { calculateMonthlyIncome } = useFinancialCalculations();

  // Data fetching
  const {
    data: incomeSourcesResponse,
    pending: incomeSourcesLoading,
    refresh: refreshIncomeSources,
  } = useFetch<ApiSuccessResponse<SelectIncomeSource[]>>(
    "/api/income-sources",
    {
      query: { personId },
      default: () => ({ data: [] }),
    }
  );

  const incomeSources = computed(() => incomeSourcesResponse.value?.data ?? []);

  // Computed values - business logic only
  const totalMonthlyIncome = computed(() => {
    if (!incomeSources.value) return "0.00";
    return calculateMonthlyIncome(incomeSources.value).toFixed(2);
  });

  // API operations only
  const createIncomeSource = async (data: {
    name: string;
    amount: number;
    frequency: string;
  }) => {
    const payload = {
      name: data.name.trim(),
      amount: data.amount,
      frequency: data.frequency,
      personId: parseInt(personId),
      isActive: true,
    };

    await $fetch("/api/income-sources", {
      method: "POST",
      body: payload,
    });

    await refreshIncomeSources();
  };

  const updateIncomeSource = async (
    id: number,
    data: {
      name: string;
      amount: number;
      frequency: string;
    }
  ) => {
    const payload = {
      name: data.name.trim(),
      amount: data.amount,
      frequency: data.frequency,
      personId: parseInt(personId),
      isActive: true,
    };

    await $fetch(`/api/income-sources/${id}`, {
      method: "PUT",
      body: payload,
    });

    await refreshIncomeSources();
  };

  const deleteIncomeSource = async (id: number) => {
    await $fetch(`/api/income-sources/${id}`, {
      method: "DELETE",
    });

    await refreshIncomeSources();
  };

  return {
    // Data
    incomeSources,
    incomeSourcesLoading,
    refreshIncomeSources,

    // Computed
    totalMonthlyIncome,

    // API operations
    createIncomeSource,
    updateIncomeSource,
    deleteIncomeSource,
  };
};
