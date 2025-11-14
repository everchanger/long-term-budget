<template>
  <UModal v-model:open="isOpen">
    <template #header>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        {{
          isEditing
            ? $t("budgetExpenses.editExpense")
            : $t("budgetExpenses.addExpense")
        }}
      </h3>
    </template>

    <template #body>
      <div class="space-y-4">
        <div>
          <label
            for="expense-name"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {{ $t("budgetExpenses.name") }} *
          </label>
          <input
            id="expense-name"
            v-model="formState.name"
            type="text"
            :placeholder="$t('budgetExpenses.namePlaceholder')"
            required
            data-testid="budget-expense-name-input"
            :class="[
              'w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white',
              touched.name && !formState.name.trim()
                ? 'border-red-500 dark:border-red-500'
                : 'border-gray-300 dark:border-gray-600',
            ]"
            @blur="touched.name = true"
          />
          <p
            v-if="touched.name && !formState.name.trim()"
            class="mt-1 text-sm text-red-600 dark:text-red-400"
          >
            {{ $t("budgetExpenses.nameRequired") }}
          </p>
        </div>

        <div>
          <label
            for="expense-category"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {{ $t("budgetExpenses.category") }} *
          </label>
          <select
            id="expense-category"
            v-model="formState.category"
            required
            data-testid="budget-expense-category-select"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option
              v-for="category in BUDGET_EXPENSE_CATEGORIES"
              :key="category.value"
              :value="category.value"
            >
              {{ $t(`budgetExpenses.categories.${category.value}`) }}
            </option>
          </select>
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {{ $t(`budgetExpenses.categories.${formState.category}Desc`) }}
          </p>
        </div>

        <div>
          <label
            for="expense-amount"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {{ $t("budgetExpenses.monthlyAmount") }} *
          </label>
          <input
            id="expense-amount"
            v-model="formState.amount"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            required
            data-testid="budget-expense-amount-input"
            :class="[
              'w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white',
              touched.amount &&
              (!formState.amount || parseFloat(formState.amount) <= 0)
                ? 'border-red-500 dark:border-red-500'
                : 'border-gray-300 dark:border-gray-600',
            ]"
            @blur="touched.amount = true"
          />
          <p
            v-if="touched.amount && !formState.amount"
            class="mt-1 text-sm text-red-600 dark:text-red-400"
          >
            {{ $t("budgetExpenses.amountRequired") }}
          </p>
          <p
            v-else-if="touched.amount && parseFloat(formState.amount) <= 0"
            class="mt-1 text-sm text-red-600 dark:text-red-400"
          >
            {{ $t("budgetExpenses.amountMustBePositive") }}
          </p>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-3">
        <UButton variant="ghost" @click="handleCancel">{{
          $t("common.cancel")
        }}</UButton>
        <UButton
          :loading="loading"
          :disabled="!isFormValid"
          data-testid="budget-expense-modal-submit-button"
          @click="handleSubmit"
        >
          {{ isEditing ? $t("common.update") : $t("common.add") }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { BudgetExpense } from "~/composables/useBudgetExpenses";
import {
  BUDGET_EXPENSE_CATEGORIES,
  getCategoryInfo,
} from "~~/utils/budget-categories";

interface Props {
  open: boolean;
  expense?: BudgetExpense;
}

interface Emits {
  (e: "update:open", value: boolean): void;
  (e: "submit", data: { name: string; amount: string; category: string }): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const isOpen = computed({
  get: () => props.open,
  set: (value) => emit("update:open", value),
});

const isEditing = computed(() => !!props.expense);
const loading = ref(false);

const formState = ref({
  name: "",
  amount: "",
  category: "other",
});

const touched = ref({
  name: false,
  amount: false,
});

// Initialize form when expense prop changes
watch(
  () => props.expense,
  (newExpense) => {
    if (newExpense) {
      formState.value = {
        name: newExpense.name,
        amount: newExpense.amount,
        category: newExpense.category || "other",
      };
    } else {
      formState.value = {
        name: "",
        amount: "",
        category: "other",
      };
    }
    // Reset touched state
    touched.value = {
      name: false,
      amount: false,
    };
  },
  { immediate: true }
);

const isFormValid = computed(() => {
  return (
    formState.value.name.trim() !== "" &&
    formState.value.amount !== "" &&
    parseFloat(formState.value.amount) > 0
  );
});

const handleSubmit = () => {
  if (!isFormValid.value) return;

  emit("submit", {
    name: formState.value.name.trim(),
    amount: formState.value.amount,
    category: formState.value.category,
  });
};

const handleCancel = () => {
  isOpen.value = false;
  // Reset form after modal closes
  setTimeout(() => {
    formState.value = {
      name: "",
      amount: "",
      category: "other",
    };
  }, 300);
};
</script>
