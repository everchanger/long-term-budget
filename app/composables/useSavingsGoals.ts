import type {
  SelectSavingsGoal,
  InsertSavingsGoal,
  UpdateSavingsGoal,
} from "~~/database/validation-schemas";

// Extended type for the enriched savings goal from API
interface EnrichedSavingsGoal extends Omit<SelectSavingsGoal, "currentAmount"> {
  currentAmount: number; // calculated field
  progressPercentage: number;
  remainingAmount: number;
  estimatedMonthsToGoal: number | null;
  estimatedCompletionDate: Date | null;
}

export const useSavingsGoals = (householdId: MaybeRefOrGetter<string>) => {
  // Data fetching - now returns enriched goals with calculated progress
  const {
    data: savingsGoals,
    pending: savingsGoalsLoading,
    refresh: refreshSavingsGoals,
  } = useFetch<EnrichedSavingsGoal[]>("/api/savings-goals", {
    query: { householdId },
    default: () => [],
  });

  // Modal state removed - now managed by components that use this composable

  // Computed values
  const totalTargetAmount = computed(() => {
    if (!savingsGoals.value) return "0.00";
    return savingsGoals.value
      .filter((goal) => !goal.isCompleted)
      .reduce((total, goal) => {
        return total + parseFloat(goal.targetAmount);
      }, 0)
      .toFixed(2);
  });

  const totalCurrentAmount = computed(() => {
    if (!savingsGoals.value) return "0.00";
    return savingsGoals.value
      .filter((goal) => !goal.isCompleted)
      .reduce((total, goal) => {
        return total + goal.currentAmount; // now a number
      }, 0)
      .toFixed(2);
  });

  const totalProgress = computed(() => {
    const target = parseFloat(totalTargetAmount.value);
    const current = parseFloat(totalCurrentAmount.value);
    if (target === 0) return 0;
    return Math.min((current / target) * 100, 100);
  });

  const activeGoals = computed(() => {
    if (!savingsGoals.value) return [];
    return savingsGoals.value.filter((goal) => !goal.isCompleted);
  });

  const completedGoals = computed(() => {
    if (!savingsGoals.value) return [];
    return savingsGoals.value.filter((goal) => goal.isCompleted);
  });

  // Helper functions for calculations (now use pre-calculated values from API)
  const getGoalProgress = (goal: EnrichedSavingsGoal) => {
    return goal.progressPercentage;
  };

  const getRemainingAmount = (goal: EnrichedSavingsGoal) => {
    return goal.remainingAmount;
  };

  const getEstimatedCompletionTime = (goal: EnrichedSavingsGoal) => {
    if (!goal.estimatedMonthsToGoal) {
      return "Unable to calculate - need positive monthly savings";
    }

    const months = goal.estimatedMonthsToGoal;
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    if (years > 0) {
      return remainingMonths > 0
        ? `${years} year${years > 1 ? "s" : ""} and ${remainingMonths} month${
            remainingMonths > 1 ? "s" : ""
          }`
        : `${years} year${years > 1 ? "s" : ""}`;
    } else {
      return `${months} month${months > 1 ? "s" : ""}`;
    }
  };

  // Modal functions removed - now handled by components

  // API functions for CRUD operations
  const createSavingsGoal = async (goalData: {
    name: string;
    description: string;
    targetAmount: string;
    targetDate: Date | null;
    priority: number;
    category: string;
  }) => {
    const insertData: InsertSavingsGoal = {
      name: goalData.name,
      description: goalData.description,
      targetAmount: goalData.targetAmount.toString(),
      targetDate: goalData.targetDate || undefined,
      priority: Number(goalData.priority) || 1,
      category: goalData.category,
      householdId: parseInt(toValue(householdId)),
    };

    await $fetch("/api/savings-goals", {
      method: "POST",
      body: insertData,
    });

    await refreshSavingsGoals();
  };

  const updateSavingsGoal = async (
    goalId: number,
    goalData: {
      name: string;
      description: string;
      targetAmount: string;
      targetDate: Date | null;
      priority: number;
      category: string;
    }
  ) => {
    const updateData: UpdateSavingsGoal = {
      name: goalData.name,
      description: goalData.description,
      targetAmount: goalData.targetAmount.toString(),
      targetDate: goalData.targetDate || undefined,
      priority: Number(goalData.priority) || 1,
      category: goalData.category,
    };

    await $fetch(`/api/savings-goals/${goalId}`, {
      method: "PUT",
      body: updateData,
    });

    await refreshSavingsGoals();
  };

  const deleteSavingsGoal = async (goalId: number) => {
    try {
      await $fetch(`/api/savings-goals/${goalId}`, {
        method: "DELETE",
      });
      await refreshSavingsGoals();
    } catch (error) {
      console.error("Error deleting savings goal:", error);
      throw error;
    }
  };

  const markGoalAsCompleted = async (goal: EnrichedSavingsGoal) => {
    try {
      const updateData: UpdateSavingsGoal = {
        isCompleted: true,
        completedAt: new Date(),
      };

      await $fetch(`/api/savings-goals/${goal.id}`, {
        method: "PUT",
        body: updateData,
      });

      await refreshSavingsGoals();
    } catch (error) {
      console.error("Error marking goal as completed:", error);
      throw error;
    }
  };

  return {
    // Data
    savingsGoals,
    savingsGoalsLoading,

    // Computed
    totalTargetAmount,
    totalCurrentAmount,
    totalProgress,
    activeGoals,
    completedGoals,

    // API operations
    refreshSavingsGoals,
    createSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    markGoalAsCompleted,

    // Utilities
    getGoalProgress,
    getRemainingAmount,
    getEstimatedCompletionTime,
  };
};
