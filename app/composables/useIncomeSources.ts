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

  // Modal state
  const isIncomeModalOpen = ref(false);
  const isIncomeSubmitting = ref(false);
  const editingIncomeSource = ref<SelectIncomeSource | null>(null);

  // Form state
  const incomeFormState = reactive({
    name: "",
    amount: "",
    frequency: "",
  });

  // Computed values
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

  const isIncomeFormValid = computed(() => {
    return (
      incomeFormState.name.trim() !== "" &&
      incomeFormState.amount !== "" &&
      parseFloat(incomeFormState.amount) > 0 &&
      incomeFormState.frequency !== ""
    );
  });

  // Modal functions
  const openIncomeModal = () => {
    editingIncomeSource.value = null;
    incomeFormState.name = "";
    incomeFormState.amount = "";
    incomeFormState.frequency = "";
    isIncomeModalOpen.value = true;
  };

  const closeIncomeModal = () => {
    isIncomeModalOpen.value = false;
    editingIncomeSource.value = null;
  };

  const editIncome = (income: SelectIncomeSource) => {
    editingIncomeSource.value = income;
    incomeFormState.name = income.name;
    incomeFormState.amount = income.amount;
    incomeFormState.frequency = income.frequency;
    isIncomeModalOpen.value = true;
  };

  // CRUD operations
  const handleIncomeSubmit = async (formData?: {
    name: string;
    amount: number;
    frequency: string;
  }) => {
    // Use provided form data if available, otherwise use internal form state
    const data = formData || {
      name: incomeFormState.name.trim(),
      amount: parseFloat(incomeFormState.amount),
      frequency: incomeFormState.frequency,
    };

    // Validate the data
    if (
      !data.name.trim() ||
      !data.amount ||
      data.amount <= 0 ||
      !data.frequency
    ) {
      return;
    }

    isIncomeSubmitting.value = true;

    try {
      const payload = {
        name: data.name.trim(),
        amount: data.amount,
        frequency: data.frequency,
        person_id: parseInt(personId),
        is_active: true,
      };

      if (editingIncomeSource.value) {
        // Update existing income source
        await $fetch(`/api/income-sources/${editingIncomeSource.value.id}`, {
          method: "PUT",
          body: payload,
        });
      } else {
        // Create new income source
        await $fetch("/api/income-sources", {
          method: "POST",
          body: payload,
        });
      }

      await refreshIncomeSources();
      closeIncomeModal();

      // Show success notification
      const toast = useToast();
      toast.add({
        title: editingIncomeSource.value
          ? "Income source updated"
          : "Income source added",
        description: `${data.name} has been ${
          editingIncomeSource.value ? "updated" : "added"
        } successfully.`,
        color: "success",
      });
    } catch (error: unknown) {
      const toast = useToast();
      toast.add({
        title: "Error",
        description:
          (error as { data?: { message?: string } }).data?.message ||
          "An error occurred",
        color: "error",
      });
    } finally {
      isIncomeSubmitting.value = false;
    }
  };

  const deleteIncome = async (income: SelectIncomeSource) => {
    try {
      await $fetch(`/api/income-sources/${income.id}`, {
        method: "DELETE",
      });

      await refreshIncomeSources();

      const toast = useToast();
      toast.add({
        title: "Income source deleted",
        description: `${income.name} has been removed.`,
        color: "success",
      });
    } catch (error: unknown) {
      const toast = useToast();
      toast.add({
        title: "Error",
        description:
          (error as { data?: { message?: string } }).data?.message ||
          "Failed to delete income source",
        color: "error",
      });
    }
  };

  return {
    // Data
    incomeSources,
    incomeSourcesLoading,
    refreshIncomeSources,

    // Modal state
    isIncomeModalOpen,
    isIncomeSubmitting,
    editingIncomeSource,

    // Form state
    incomeFormState,

    // Computed
    totalMonthlyIncome,
    isIncomeFormValid,

    // Functions
    openIncomeModal,
    closeIncomeModal,
    editIncome,
    handleIncomeSubmit,
    deleteIncome,
  };
};
