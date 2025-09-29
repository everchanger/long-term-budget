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
  const handleSavingsSubmit = async () => {
    if (!isSavingsFormValid.value) return;

    isSavingsSubmitting.value = true;

    try {
      const payload = {
        name: savingsFormState.name.trim(),
        currentBalance: parseFloat(savingsFormState.balance),
        interestRate: parseFloat(savingsFormState.interestRate) || 0,
        accountType: savingsFormState.accountType || null,
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
