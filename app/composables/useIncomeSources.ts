import type { SelectIncomeSource } from "~~/database/validation-schemas";

export const useIncomeSources = (personId: string) => {
  // Data fetching
  const {
    data: incomeSources,
    pending: incomeSourcesLoading,
    refresh: refreshIncomeSources,
  } = useFetch<SelectIncomeSource[]>("/api/income-sources", {
    query: { personId },
    default: () => [],
  });

  // Computed values - business logic only
  const totalMonthlyIncome = computed(() => {
    if (!incomeSources.value) return "0.00";
    return incomeSources.value
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
          default:
            return total;
        }
      }, 0)
      .toFixed(2);
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
      person_id: parseInt(personId),
      is_active: true,
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
      person_id: parseInt(personId),
      is_active: true,
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
