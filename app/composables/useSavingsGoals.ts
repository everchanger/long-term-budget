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

  // Modal state
  const isSavingsGoalModalOpen = ref(false);
  const isSavingsGoalSubmitting = ref(false);
  const editingSavingsGoal = ref<EnrichedSavingsGoal | null>(null);

  // Form state (removed currentAmount since it's calculated)
  const savingsGoalFormState = reactive({
    name: "",
    description: "",
    targetAmount: "",
    targetDate: null as Date | null,
    priority: 1,
    category: "",
  });

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

  // Modal functions
  const openSavingsGoalModal = () => {
    isSavingsGoalModalOpen.value = true;
  };

  const closeSavingsGoalModal = () => {
    isSavingsGoalModalOpen.value = false;
    editingSavingsGoal.value = null;
    resetSavingsGoalForm();
  };

  const resetSavingsGoalForm = () => {
    savingsGoalFormState.name = "";
    savingsGoalFormState.description = "";
    savingsGoalFormState.targetAmount = "";
    savingsGoalFormState.targetDate = null;
    savingsGoalFormState.priority = 1;
    savingsGoalFormState.category = "";
  };

  const editSavingsGoal = (goal: EnrichedSavingsGoal) => {
    editingSavingsGoal.value = goal;

    // Populate form with goal data
    Object.assign(savingsGoalFormState, {
      name: goal.name,
      description: goal.description || "",
      targetAmount: goal.targetAmount,
      targetDate: goal.targetDate ? new Date(goal.targetDate) : null,
      priority: goal.priority || 1,
      category: goal.category || "",
    });

    openSavingsGoalModal();
  };

  // Form submission
  const saveSavingsGoal = async (formData: {
    name: string;
    description: string;
    targetAmount: string;
    targetDate: Date | null;
    priority: number;
    category: string;
  }) => {
    try {
      isSavingsGoalSubmitting.value = true;

      if (editingSavingsGoal.value) {
        // Update existing goal
        const updateData: UpdateSavingsGoal = {
          name: formData.name,
          description: formData.description,
          targetAmount: formData.targetAmount.toString(),
          targetDate: formData.targetDate || undefined,
          priority: Number(formData.priority) || 1,
          category: formData.category,
        };

        await $fetch(`/api/savings-goals/${editingSavingsGoal.value.id}`, {
          method: "PUT",
          body: updateData,
        });
      } else {
        // Create new goal
        const insertData: InsertSavingsGoal = {
          name: formData.name,
          description: formData.description,
          targetAmount: formData.targetAmount.toString(),
          targetDate: formData.targetDate || undefined,
          priority: Number(formData.priority) || 1,
          category: formData.category,
          householdId: parseInt(toValue(householdId)),
        };

        await $fetch("/api/savings-goals", {
          method: "POST",
          body: insertData,
        });
      }

      await refreshSavingsGoals();
      closeSavingsGoalModal();
    } catch (error) {
      console.error("Error submitting savings goal:", error);
      throw error;
    } finally {
      isSavingsGoalSubmitting.value = false;
    }
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

    // Modal state
    isSavingsGoalModalOpen,
    isSavingsGoalSubmitting,
    editingSavingsGoal,
    savingsGoalFormState,

    // Computed
    totalTargetAmount,
    totalCurrentAmount,
    totalProgress,
    activeGoals,
    completedGoals,

    // Functions
    refreshSavingsGoals,
    getGoalProgress,
    getRemainingAmount,
    getEstimatedCompletionTime,
    openSavingsGoalModal,
    closeSavingsGoalModal,
    resetSavingsGoalForm,
    editSavingsGoal,
    saveSavingsGoal,
    deleteSavingsGoal,
    markGoalAsCompleted,
  };
};
