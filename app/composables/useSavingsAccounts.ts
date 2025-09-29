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

  // Modal state
  const isSavingsModalOpen = ref(false);
  const isSavingsSubmitting = ref(false);
  const editingSavings = ref<SelectSavingsAccount | null>(null);

  // Form state
  const savingsFormState = reactive({
    name: "",
    balance: "",
    interestRate: "",
    accountType: "",
  });

  // Computed values
  const totalSavings = computed(() => {
    if (!savingsAccounts.value) return "0.00";
    return savingsAccounts.value
      .reduce(
        (total, account) => total + parseFloat(account.currentBalance || "0"),
        0
      )
      .toFixed(2);
  });

  const isSavingsFormValid = computed(() => {
    return (
      savingsFormState.name.trim() !== "" &&
      savingsFormState.balance !== "" &&
      parseFloat(savingsFormState.balance) >= 0
    );
  });

  // Modal functions
  const openSavingsModal = () => {
    editingSavings.value = null;
    savingsFormState.name = "";
    savingsFormState.balance = "";
    savingsFormState.interestRate = "";
    savingsFormState.accountType = "";
    isSavingsModalOpen.value = true;
  };

  const closeSavingsModal = () => {
    isSavingsModalOpen.value = false;
    editingSavings.value = null;
  };

  const editSavings = (account: SelectSavingsAccount) => {
    editingSavings.value = account;
    savingsFormState.name = account.name;
    savingsFormState.balance = account.currentBalance;
    savingsFormState.interestRate = account.interestRate || "";
    savingsFormState.accountType = account.accountType || "";
    isSavingsModalOpen.value = true;
  };

  // CRUD operations
  const handleSavingsSubmit = async (formData?: {
    name: string;
    currentBalance: string;
    interestRate: string;
    accountType: string;
  }) => {
    // Use form data from modal if provided, otherwise use internal state
    const data = formData || {
      name: savingsFormState.name,
      currentBalance: savingsFormState.balance,
      interestRate: savingsFormState.interestRate,
      accountType: savingsFormState.accountType,
    };

    // Validate the data
    if (!data.name.trim() || !data.currentBalance) return;

    isSavingsSubmitting.value = true;

    try {
      const payload = {
        name: data.name.trim(),
        currentBalance: parseFloat(data.currentBalance),
        interestRate: parseFloat(data.interestRate) || 0,
        accountType: data.accountType || null,
        personId: parseInt(personId),
      };

      if (editingSavings.value) {
        await $fetch(`/api/savings-accounts/${editingSavings.value.id}`, {
          method: "PUT",
          body: payload,
        });
      } else {
        await $fetch("/api/savings-accounts", {
          method: "POST",
          body: payload,
        });
      }

      await refreshSavings();
      closeSavingsModal();

      const toast = useToast();
      toast.add({
        title: editingSavings.value
          ? "Savings account updated"
          : "Savings account added",
        description: `${savingsFormState.name} has been ${
          editingSavings.value ? "updated" : "added"
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
      isSavingsSubmitting.value = false;
    }
  };

  const deleteSavings = async (account: SelectSavingsAccount) => {
    try {
      await $fetch(`/api/savings-accounts/${account.id}`, { method: "DELETE" });
      await refreshSavings();
      const toast = useToast();
      toast.add({
        title: "Savings account deleted",
        description: `${account.name} has been removed.`,
        color: "success",
      });
    } catch (error: unknown) {
      const toast = useToast();
      toast.add({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to delete savings account",
        color: "error",
      });
    }
  };

  return {
    // Data
    savingsAccounts,
    savingsLoading,
    refreshSavings,

    // Modal state
    isSavingsModalOpen,
    isSavingsSubmitting,
    editingSavings,

    // Form state
    savingsFormState,

    // Computed
    totalSavings,
    isSavingsFormValid,

    // Functions
    openSavingsModal,
    closeSavingsModal,
    editSavings,
    handleSavingsSubmit,
    deleteSavings,
  };
};
