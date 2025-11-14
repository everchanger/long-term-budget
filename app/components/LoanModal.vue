<template>
  <UModal v-model:open="isOpen">
    <template #header>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        {{ isEditing ? $t("loans.editLoan") : $t("loans.addLoan") }}
      </h3>
    </template>

    <template #body>
      <div class="space-y-4">
        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            for="loan-name"
          >
            {{ $t("loans.nameRequired") }}
          </label>
          <input
            id="loan-name"
            v-model="formState.name"
            type="text"
            :placeholder="$t('loans.namePlaceholder')"
            required
            data-testid="loan-name-input"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            for="loan-amount"
          >
            {{ $t("loans.originalAmountRequired") }}
          </label>
          <input
            id="loan-amount"
            v-model="formState.originalAmount"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            required
            data-testid="loan-principal-input"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {{ $t("loans.originalAmountHelp") }}
          </p>
        </div>

        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            for="loan-current-balance"
          >
            {{ $t("loans.currentBalanceRequired") }}
          </label>
          <input
            id="loan-current-balance"
            v-model="formState.currentBalance"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            required
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {{ $t("loans.currentBalanceHelp") }}
          </p>
        </div>

        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            for="loan-interest-rate"
          >
            {{ $t("common.interestRate") }}
          </label>
          <input
            id="loan-interest-rate"
            v-model="formState.interestRate"
            type="number"
            step="0.01"
            min="0"
            placeholder="5.00"
            data-testid="loan-interest-rate-input"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            for="loan-monthly-payment"
          >
            {{ $t("loans.monthlyPayment") }}
          </label>
          <input
            id="loan-monthly-payment"
            v-model="formState.monthlyPayment"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            data-testid="loan-monthly-payment-input"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            for="loan-type"
          >
            {{ $t("loans.loanType") }}
          </label>
          <select
            id="loan-type"
            v-model="formState.loanType"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">{{ $t("loans.selectType") }}</option>
            <option value="mortgage">{{ $t("loans.types.mortgage") }}</option>
            <option value="personal">{{ $t("loans.types.personal") }}</option>
            <option value="credit-card">{{ $t("loans.types.credit") }}</option>
            <option value="auto">{{ $t("loans.types.auto") }}</option>
            <option value="other">{{ $t("loans.types.other") }}</option>
          </select>
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
          data-testid="loan-modal-submit-button"
          @click="handleSubmit"
        >
          {{ isEditing ? $t("common.update") : $t("common.add") }}
          {{ $t("loans.loanSingular") }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { z } from "zod";
import type {
  SelectLoan,
  insertLoanSchema,
} from "~~/database/validation-schemas";

// Form state inferred from Zod schema (omitting fields not in the form: personId, startDate, endDate)
type FormState = Omit<
  z.infer<typeof insertLoanSchema>,
  "personId" | "startDate" | "endDate"
>;

interface Props {
  open?: boolean;
  loan?: SelectLoan | null;
  loading?: boolean;
}

interface Emits {
  "update:open": [value: boolean];
  submit: [formData: FormState];
  cancel: [];
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  loan: null,
  loading: false,
});

const emit = defineEmits<Emits>();

// Reactive form state
const formState = reactive<FormState>({
  name: "",
  originalAmount: "",
  currentBalance: "",
  interestRate: "",
  monthlyPayment: "",
  loanType: "",
});

// Computed properties
const isOpen = computed({
  get: () => props.open,
  set: (value: boolean) => emit("update:open", value),
});

const isEditing = computed(() => !!props.loan);

const isFormValid = computed(() => {
  return (
    formState.name.trim() !== "" &&
    formState.originalAmount !== "" &&
    !isNaN(parseFloat(formState.originalAmount)) &&
    parseFloat(formState.originalAmount) > 0 &&
    formState.currentBalance !== "" &&
    !isNaN(parseFloat(formState.currentBalance)) &&
    parseFloat(formState.currentBalance) >= 0
  );
});

// Watch for changes in loan prop to populate form
watch(
  () => props.loan,
  (newLoan) => {
    if (newLoan) {
      formState.name = newLoan.name;
      formState.originalAmount = newLoan.originalAmount;
      formState.currentBalance = newLoan.currentBalance;
      formState.interestRate = newLoan.interestRate;
      formState.monthlyPayment = newLoan.monthlyPayment;
      formState.loanType = newLoan.loanType || "";
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
    if (!isOpen && !props.loan) {
      resetForm();
    }
  }
);

// Methods
function resetForm() {
  formState.name = "";
  formState.originalAmount = "";
  formState.currentBalance = "";
  formState.interestRate = "";
  formState.monthlyPayment = "";
  formState.loanType = "";
}

function handleCancel() {
  emit("cancel");
  emit("update:open", false);
}

function handleSubmit() {
  if (!isFormValid.value) return;

  const currentBalance = formState.currentBalance || formState.originalAmount;

  // Ensure all numeric fields are strings
  emit("submit", {
    name: formState.name.trim(),
    originalAmount: String(formState.originalAmount),
    currentBalance: String(currentBalance),
    interestRate: formState.interestRate ? String(formState.interestRate) : "",
    monthlyPayment: formState.monthlyPayment
      ? String(formState.monthlyPayment)
      : "",
    loanType: formState.loanType,
  });
}
</script>
