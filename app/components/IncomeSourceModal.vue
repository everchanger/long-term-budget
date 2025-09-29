<template>
  <UModal v-model:open="isOpen">
    <template #header>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        {{ isEditing ? "Edit Income Source" : "Add Income Source" }}
      </h3>
    </template>

    <template #body>
      <div class="space-y-4">
        <div>
          <label
            for="income-name"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Name *
          </label>
          <input
            id="income-name"
            v-model="formState.name"
            type="text"
            placeholder="e.g., Salary, Freelance, etc."
            required
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label
            for="income-amount"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Amount *
          </label>
          <input
            id="income-amount"
            v-model="formState.amount"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            required
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label
            for="income-frequency"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Frequency *
          </label>
          <select
            id="income-frequency"
            v-model="formState.frequency"
            required
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">Select frequency</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
            <option value="weekly">Weekly</option>
            <option value="bi-weekly">Bi-weekly</option>
          </select>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-3">
        <UButton variant="ghost" @click="handleCancel">Cancel</UButton>
        <UButton
          :loading="loading"
          :disabled="!isFormValid"
          @click="handleSubmit"
        >
          {{ isEditing ? "Update" : "Add" }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { SelectIncomeSource } from "~~/database/validation-schemas";

// Create a more flexible form submission type
type IncomeSourceFormData = {
  name: string;
  amount: number;
  frequency: string;
};

interface Props {
  open?: boolean;
  incomeSource?: SelectIncomeSource | null;
  loading?: boolean;
}

interface Emits {
  "update:open": [value: boolean];
  submit: [formData: IncomeSourceFormData];
  cancel: [];
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  incomeSource: null,
  loading: false,
});

const emit = defineEmits<Emits>();

// Reactive form state
const formState = reactive({
  name: "",
  amount: "",
  frequency: "",
});

// Computed properties
const isOpen = computed({
  get: () => props.open,
  set: (value: boolean) => emit("update:open", value),
});

const isEditing = computed(() => !!props.incomeSource);

const isFormValid = computed(() => {
  return (
    formState.name.trim() !== "" &&
    formState.amount !== "" &&
    parseFloat(formState.amount) > 0 &&
    formState.frequency !== ""
  );
});

// Watch for changes in incomeSource prop to populate form
watch(
  () => props.incomeSource,
  (newIncomeSource) => {
    if (newIncomeSource) {
      formState.name = newIncomeSource.name;
      formState.amount = newIncomeSource.amount;
      formState.frequency = newIncomeSource.frequency;
    } else {
      resetForm();
    }
  },
  { immediate: true }
);

// Watch for open changes to reset form when closing
watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen && !props.incomeSource) {
      resetForm();
    }
  }
);

// Methods
function resetForm() {
  formState.name = "";
  formState.amount = "";
  formState.frequency = "";
}

function handleCancel() {
  emit("cancel");
  emit("update:open", false);
}

function handleSubmit() {
  if (!isFormValid.value) return;

  emit("submit", {
    name: formState.name.trim(),
    amount: parseFloat(formState.amount),
    frequency: formState.frequency as "monthly" | "yearly" | "weekly" | "daily",
  });
}
</script>
