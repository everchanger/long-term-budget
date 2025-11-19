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
        <UFormField
          :label="$t('budgetExpenses.name') + ' *'"
          name="expense-name"
          required
          :error="
            touched.name && !formState.name.trim()
              ? $t('budgetExpenses.nameRequired')
              : undefined
          "
        >
          <UInput
            id="expense-name"
            v-model="formState.name"
            type="text"
            :placeholder="$t('budgetExpenses.namePlaceholder')"
            data-testid="budget-expense-name-input"
            icon="i-lucide-shopping-cart"
            @blur="touched.name = true"
          />
        </UFormField>

        <UFormField
          :label="$t('budgetExpenses.category') + ' *'"
          name="expense-category"
          required
          :hint="$t(`budgetExpenses.categories.${formState.category}Desc`)"
        >
          <USelect
            id="expense-category"
            v-model="formState.category"
            data-testid="budget-expense-category-select"
            :options="
              BUDGET_EXPENSE_CATEGORIES.map((cat) => ({
                value: cat.value,
                label: $t(`budgetExpenses.categories.${cat.value}`),
                icon: cat.icon,
              }))
            "
            option-attribute="label"
            value-attribute="value"
          />
        </UFormField>

        <UFormField
          :label="$t('budgetExpenses.monthlyAmount') + ' *'"
          name="expense-amount"
          required
          :error="
            touched.amount && !formState.amount
              ? $t('budgetExpenses.amountRequired')
              : undefined
          "
        >
          <UInput
            id="expense-amount"
            v-model="formState.amount"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            data-testid="budget-expense-amount-input"
            icon="i-lucide-dollar-sign"
            @blur="touched.amount = true"
          />
        </UFormField>
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
