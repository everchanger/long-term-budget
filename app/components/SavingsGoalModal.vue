<template>
  <UModal v-model:open="isOpen">
    <template #header>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        {{ isEditing ? "Edit Savings Goal" : "Add Savings Goal" }}
      </h3>
    </template>

    <template #body>
      <form class="space-y-6" @submit.prevent="handleSubmit">
        <!-- Goal Name -->
        <div>
          <label
            for="goal-name"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Goal Name *
          </label>
          <input
            id="goal-name"
            v-model="formState.name"
            type="text"
            required
            placeholder="e.g., Emergency Fund, Vacation, New Car"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <!-- Description -->
        <div>
          <label
            for="goal-description"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Description
          </label>
          <textarea
            id="goal-description"
            v-model="formState.description"
            rows="3"
            placeholder="Optional description of your savings goal"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <!-- Target Amount -->
        <div>
          <label
            for="goal-target-amount"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Target Amount *
          </label>
          <input
            id="goal-target-amount"
            v-model="formState.targetAmount"
            type="number"
            step="0.01"
            min="0.01"
            required
            placeholder="0.00"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label
              for="goal-target-date"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Target Date
            </label>
            <input
              id="goal-target-date"
              v-model="formState.targetDate"
              type="date"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label
              for="goal-priority"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Priority
            </label>
            <select
              id="goal-priority"
              v-model="formState.priority"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="1">Low</option>
              <option value="2">Medium</option>
              <option value="3">High</option>
            </select>
          </div>
        </div>

        <!-- Category -->
        <div>
          <label
            for="goal-category"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Category
          </label>
          <select
            id="goal-category"
            v-model="formState.category"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">Select a category</option>
            <option value="Emergency Fund">Emergency Fund</option>
            <option value="Vacation">Vacation</option>
            <option value="Car">Car</option>
            <option value="House">House</option>
            <option value="Education">Education</option>
            <option value="Retirement">Retirement</option>
            <option value="Investment">Investment</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <!-- Progress Preview (for editing only) -->
        <div
          v-if="isEditing"
          class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4"
        >
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Current Progress
          </h4>
          <div class="text-sm text-gray-600 dark:text-gray-400">
            <p>
              Progress is calculated automatically from your household's savings
              accounts
            </p>
          </div>
        </div>

        <!-- Auto-calculation Notice -->
        <div
          class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800"
        >
          <div class="flex items-start">
            <UIcon
              name="i-heroicons-information-circle"
              class="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0"
            />
            <div>
              <h4
                class="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1"
              >
                Automatic Progress Tracking
              </h4>
              <p class="text-sm text-blue-700 dark:text-blue-300">
                Your progress towards this goal will be calculated automatically
                based on your household's total savings, income, and expenses.
                No need to manually update amounts!
              </p>
            </div>
          </div>
        </div>
      </form>
    </template>

    <template #footer>
      <div class="flex justify-end space-x-3">
        <UButton color="neutral" variant="ghost" @click="handleCancel">
          Cancel
        </UButton>
        <UButton :loading="loading" @click="handleSubmit">
          {{ isEditing ? "Update Goal" : "Create Goal" }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
interface Props {
  open?: boolean;
  loading?: boolean;
  editingGoal?: {
    id: number;
    householdId: number;
    name: string;
    description: string | null;
    targetAmount: string;
    targetDate: Date | null;
    isCompleted: boolean;
    completedAt: Date | null;
    priority: number | null;
    category: string | null;
    createdAt: Date;
    updatedAt: Date;
  } | null;
}

interface FormData {
  name: string;
  description: string;
  targetAmount: string;
  targetDate: Date | null;
  priority: number;
  category: string;
}

interface Emits {
  "update:open": [value: boolean];
  submit: [data: FormData];
  cancel: [];
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  loading: false,
  editingGoal: null,
});

const emit = defineEmits<Emits>();

const formState = reactive<FormData>({
  name: "",
  description: "",
  targetAmount: "",
  targetDate: null,
  priority: 1,
  category: "",
});

const isEditing = computed(() => props.editingGoal !== null);

// Computed properties
const isOpen = computed({
  get: () => props.open,
  set: (value: boolean) => emit("update:open", value),
});

// Reset form when modal closes
const resetForm = () => {
  formState.name = "";
  formState.description = "";
  formState.targetAmount = "";
  formState.targetDate = null;
  formState.priority = 1;
  formState.category = "";
};

// Watch for editing goal changes
watch(
  () => props.editingGoal,
  (newGoal) => {
    if (newGoal) {
      // Populate form with goal data
      formState.name = newGoal.name;
      formState.description = newGoal.description || "";
      formState.targetAmount = newGoal.targetAmount;
      formState.targetDate = newGoal.targetDate
        ? new Date(newGoal.targetDate)
        : null;
      formState.priority = newGoal.priority || 1;
      formState.category = newGoal.category || "";
    } else {
      resetForm();
    }
  },
  { immediate: true }
);

// Watch for modal close to reset form
watch(
  () => props.open,
  (newValue) => {
    if (!newValue && !props.editingGoal) {
      resetForm();
    }
  }
);

const handleSubmit = () => {
  emit("submit", {
    name: formState.name,
    description: formState.description,
    targetAmount: formState.targetAmount,
    targetDate: formState.targetDate,
    priority: formState.priority,
    category: formState.category,
  });
};

const handleCancel = () => {
  emit("cancel");
  emit("update:open", false);
};
</script>
