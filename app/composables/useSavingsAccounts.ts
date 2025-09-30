import type { SelectSavingsAccount } from "~~/database/validation-schemas";

export const useSavingsAccounts = (personId: string) => {
  // Data fetching
  const {
    data: savingsAccounts,
    pending: savingsLoading,
    refresh: refreshSavings,
  } = useFetch<SelectSavingsAccount[]>("/api/savings-accounts", {
    query: { personId },
    default: () => [],
  });

  // Computed values - business logic only
  const totalSavings = computed(() => {
    if (!savingsAccounts.value) return "0.00";
    return savingsAccounts.value
      .reduce(
        (total, account) => total + parseFloat(account.currentBalance || "0"),
        0
      )
      .toFixed(2);
  });

  // API operations only
  const createSavingsAccount = async (data: {
    name: string;
    currentBalance: string;
    interestRate: string;
    accountType: string;
  }) => {
    const payload = {
      name: data.name.trim(),
      currentBalance: parseFloat(data.currentBalance),
      interestRate: parseFloat(data.interestRate) || 0,
      accountType: data.accountType || null,
      personId: parseInt(personId),
    };

    await $fetch("/api/savings-accounts", {
      method: "POST",
      body: payload,
    });

    await refreshSavings();
  };

  const updateSavingsAccount = async (
    id: number,
    data: {
      name: string;
      currentBalance: string;
      interestRate: string;
      accountType: string;
    }
  ) => {
    const payload = {
      name: data.name.trim(),
      currentBalance: parseFloat(data.currentBalance),
      interestRate: parseFloat(data.interestRate) || 0,
      accountType: data.accountType || null,
      personId: parseInt(personId),
    };

    await $fetch(`/api/savings-accounts/${id}`, {
      method: "PUT",
      body: payload,
    });

    await refreshSavings();
  };

  const deleteSavingsAccount = async (id: number) => {
    await $fetch(`/api/savings-accounts/${id}`, { method: "DELETE" });
    await refreshSavings();
  };

  return {
    // Data
    savingsAccounts,
    savingsLoading,
    refreshSavings,

    // Computed
    totalSavings,

    // API operations
    createSavingsAccount,
    updateSavingsAccount,
    deleteSavingsAccount,
  };
};
