import type { SelectLoan } from "~~/database/validation-schemas";

export const useLoans = (personId: string) => {
  // Data fetching
  const {
    data: loans,
    pending: loansLoading,
    refresh: refreshLoans,
  } = useFetch<SelectLoan[]>("/api/loans", {
    query: { personId },
    default: () => [],
  });

  // Modal state
  const isLoanModalOpen = ref(false);
  const isLoanSubmitting = ref(false);
  const editingLoan = ref<SelectLoan | null>(null);

  // Form state
  const loanFormState = reactive({
    name: "",
    amount: "",
    interestRate: "",
    monthlyPayment: "",
    loanType: "",
  });

  // Computed values
  const totalDebt = computed(() => {
    if (!loans.value) return "0.00";
    return loans.value
      .reduce(
        (total, loan) => total + parseFloat(loan.currentBalance || "0"),
        0
      )
      .toFixed(2);
  });

  // Modal functions
  const openLoanModal = () => {
    editingLoan.value = null;
    loanFormState.name = "";
    loanFormState.amount = "";
    loanFormState.interestRate = "";
    loanFormState.monthlyPayment = "";
    loanFormState.loanType = "";
    isLoanModalOpen.value = true;
  };

  const closeLoanModal = () => {
    isLoanModalOpen.value = false;
    editingLoan.value = null;
  };

  const editLoan = (loan: SelectLoan) => {
    editingLoan.value = loan;
    loanFormState.name = loan.name;
    loanFormState.amount = loan.currentBalance;
    loanFormState.interestRate = loan.interestRate;
    loanFormState.loanType = loan.loanType || "";
    isLoanModalOpen.value = true;
  };

  // CRUD operations
  const handleLoanSubmit = async () => {
    if (!loanFormState.name || !loanFormState.amount) return;

    isLoanSubmitting.value = true;

    try {
      const payload = {
        name: loanFormState.name.trim(),
        originalAmount: parseFloat(loanFormState.amount),
        currentBalance: parseFloat(loanFormState.amount),
        interestRate: parseFloat(loanFormState.interestRate) || 0,
        monthlyPayment: parseFloat(loanFormState.monthlyPayment) || 0,
        loanType: loanFormState.loanType,
        personId: parseInt(personId),
      };

      if (editingLoan.value) {
        await $fetch(`/api/loans/${editingLoan.value.id}`, {
          method: "PUT",
          body: payload,
        });
      } else {
        await $fetch("/api/loans", {
          method: "POST",
          body: payload,
        });
      }

      await refreshLoans();
      closeLoanModal();

      const toast = useToast();
      toast.add({
        title: editingLoan.value ? "Loan updated" : "Loan added",
        description: `${loanFormState.name} has been ${
          editingLoan.value ? "updated" : "added"
        } successfully.`,
        color: "success",
      });
    } catch (error: unknown) {
      const toast = useToast();
      toast.add({
        title: "Error",
        description:
          error instanceof Error ? error.message : "An error occurred",
        color: "error",
      });
    } finally {
      isLoanSubmitting.value = false;
    }
  };

  const deleteLoan = async (loan: SelectLoan) => {
    try {
      await $fetch(`/api/loans/${loan.id}`, { method: "DELETE" });
      refreshLoans();
      const toast = useToast();
      toast.add({
        title: "Loan deleted",
        description: `${loan.name} has been removed.`,
        color: "success",
      });
    } catch {
      const toast = useToast();
      toast.add({
        title: "Error",
        description: "Failed to delete loan",
        color: "error",
      });
    }
  };

  return {
    // Data
    loans,
    loansLoading,
    refreshLoans,

    // Modal state
    isLoanModalOpen,
    isLoanSubmitting,
    editingLoan,

    // Form state
    loanFormState,

    // Computed
    totalDebt,

    // Functions
    openLoanModal,
    closeLoanModal,
    editLoan,
    handleLoanSubmit,
    deleteLoan,
  };
};
