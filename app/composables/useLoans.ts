import type { SelectLoan } from "~~/database/validation-schemas";
import type { ApiSuccessResponse } from "~~/server/utils/api-response";

export const useLoans = (personId: string) => {
  // Data fetching
  const {
    data: loansResponse,
    pending: loansLoading,
    refresh: refreshLoans,
  } = useFetch<ApiSuccessResponse<SelectLoan[]>>("/api/loans", {
    query: { personId },
    default: () => ({ data: [] }),
  });

  const loans = computed(() => loansResponse.value?.data ?? []);

  // Computed values - business logic only
  const totalDebt = computed(() => {
    if (!loans.value) return "0.00";
    return loans.value
      .reduce(
        (total, loan) => total + parseFloat(loan.currentBalance || "0"),
        0
      )
      .toFixed(2);
  });

  // API operations only
  const createLoan = async (data: {
    name: string;
    originalAmount: string;
    currentBalance: string;
    interestRate: string;
    monthlyPayment: string;
    loanType: string;
  }) => {
    const payload = {
      name: data.name.trim(),
      originalAmount: parseFloat(data.originalAmount),
      currentBalance:
        parseFloat(data.currentBalance) || parseFloat(data.originalAmount),
      interestRate: parseFloat(data.interestRate) || 0,
      monthlyPayment: parseFloat(data.monthlyPayment) || 0,
      loanType: data.loanType,
      personId: parseInt(personId),
    };

    await $fetch("/api/loans", {
      method: "POST",
      body: payload,
    });

    await refreshLoans();
  };

  const updateLoan = async (
    id: number,
    data: {
      name: string;
      originalAmount: string;
      currentBalance: string;
      interestRate: string;
      monthlyPayment: string;
      loanType: string;
    }
  ) => {
    const payload = {
      name: data.name.trim(),
      originalAmount: parseFloat(data.originalAmount),
      currentBalance:
        parseFloat(data.currentBalance) || parseFloat(data.originalAmount),
      interestRate: parseFloat(data.interestRate) || 0,
      monthlyPayment: parseFloat(data.monthlyPayment) || 0,
      loanType: data.loanType,
      personId: parseInt(personId),
    };

    await $fetch(`/api/loans/${id}`, {
      method: "PUT",
      body: payload,
    });

    await refreshLoans();
  };

  const deleteLoan = async (id: number) => {
    await $fetch(`/api/loans/${id}`, { method: "DELETE" });
    await refreshLoans();
  };

  return {
    // Data
    loans,
    loansLoading,
    refreshLoans,

    // Computed
    totalDebt,

    // API operations
    createLoan,
    updateLoan,
    deleteLoan,
  };
};
