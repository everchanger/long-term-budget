import { ref } from "vue";

export interface BudgetExpense {
  id: number;
  budgetId: number;
  name: string;
  amount: string;
  category: string;
  createdAt: Date;
}

export interface NewBudgetExpense {
  name: string;
  amount: string;
  category: string;
}

export function useBudgetExpenses() {
  const budgetExpenses = ref<BudgetExpense[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Fetch all budget expenses for the household
  const fetchBudgetExpenses = async () => {
    loading.value = true;
    error.value = null;

    try {
      const response = await $fetch<{ data: BudgetExpense[] }>(
        "/api/budget-expenses"
      );
      budgetExpenses.value = response.data;
    } catch (err) {
      console.error("Failed to fetch budget expenses:", err);
      error.value =
        err instanceof Error ? err.message : "Failed to fetch budget expenses";
      budgetExpenses.value = [];
    } finally {
      loading.value = false;
    }
  };

  // Create a new budget expense
  const createBudgetExpense = async (
    newExpense: NewBudgetExpense
  ): Promise<BudgetExpense> => {
    try {
      const response = await $fetch<{ data: BudgetExpense }>(
        "/api/budget-expenses",
        {
          method: "POST",
          body: newExpense,
        }
      );

      // Add to local list
      budgetExpenses.value.unshift(response.data);
      return response.data;
    } catch (err) {
      console.error("Failed to create budget expense:", err);
      throw new Error(
        err instanceof Error ? err.message : "Failed to create budget expense"
      );
    }
  };

  // Update a budget expense
  const updateBudgetExpense = async (
    id: number,
    updates: NewBudgetExpense
  ): Promise<BudgetExpense> => {
    try {
      const response = await $fetch<{ data: BudgetExpense }>(
        `/api/budget-expenses/${id}`,
        {
          method: "PUT",
          body: updates,
        }
      );

      // Update local list
      const index = budgetExpenses.value.findIndex((e) => e.id === id);
      if (index !== -1) {
        budgetExpenses.value[index] = response.data;
      }

      return response.data;
    } catch (err) {
      console.error("Failed to update budget expense:", err);
      throw new Error(
        err instanceof Error ? err.message : "Failed to update budget expense"
      );
    }
  };

  // Delete a budget expense
  const deleteBudgetExpense = async (id: number): Promise<void> => {
    try {
      await $fetch(`/api/budget-expenses/${id}`, {
        method: "DELETE",
      });

      // Remove from local list
      budgetExpenses.value = budgetExpenses.value.filter((e) => e.id !== id);
    } catch (err) {
      console.error("Failed to delete budget expense:", err);
      throw new Error(
        err instanceof Error ? err.message : "Failed to delete budget expense"
      );
    }
  };

  // Calculate total monthly budget expenses
  const totalMonthlyExpenses = computed(() => {
    return budgetExpenses.value.reduce(
      (sum, expense) => sum + parseFloat(expense.amount),
      0
    );
  });

  return {
    budgetExpenses,
    loading,
    error,
    totalMonthlyExpenses,
    fetchBudgetExpenses,
    createBudgetExpense,
    updateBudgetExpense,
    deleteBudgetExpense,
  };
}
