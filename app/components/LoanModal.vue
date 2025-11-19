<template>
  <UModal v-model:open="isOpen">
    <template #header>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        {{ isEditing ? $t("loans.editLoan") : $t("loans.addLoan") }}
      </h3>
    </template>

    <template #body>
      <div class="space-y-4">
        <UFormField :label="$t('loans.nameRequired')" name="name" required>
          <UInput
            id="loan-name"
            v-model="formState.name"
            type="text"
            :placeholder="$t('loans.namePlaceholder')"
            icon="i-lucide-file-text"
            data-testid="loan-name-input"
          />
        </UFormField>

        <UFormField
          :label="$t('loans.originalAmountRequired')"
          :hint="$t('loans.originalAmountHelp')"
          name="originalAmount"
          required
        >
          <UInput
            id="loan-amount"
            v-model="formState.originalAmount"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            icon="i-lucide-dollar-sign"
            data-testid="loan-principal-input"
          />
        </UFormField>

        <UFormField
          :label="$t('loans.currentBalanceRequired')"
          :hint="$t('loans.currentBalanceHelp')"
          name="currentBalance"
          required
        >
          <UInput
            id="loan-current-balance"
            v-model="formState.currentBalance"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            icon="i-lucide-wallet"
          />
        </UFormField>

        <UFormField :label="$t('common.interestRate')" name="interestRate">
          <UInput
            id="loan-interest-rate"
            v-model="formState.interestRate"
            type="number"
            step="0.01"
            min="0"
            placeholder="5.00"
            icon="i-lucide-percent"
            data-testid="loan-interest-rate-input"
          />
        </UFormField>

        <UFormField :label="$t('loans.monthlyPayment')" name="monthlyPayment">
          <UInput
            id="loan-monthly-payment"
            v-model="formState.monthlyPayment"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            icon="i-lucide-calendar-days"
            data-testid="loan-monthly-payment-input"
          />
        </UFormField>

        <UFormField :label="$t('loans.loanType')" name="loanType">
          <USelect
            id="loan-type"
            v-model="formState.loanType"
            :items="loanTypeOptions"
            :placeholder="$t('loans.selectType')"
            value-key="value"
            label-key="label"
            :ui="{ content: 'min-w-fit' }"
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
import type { SelectItem } from "@nuxt/ui";
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
const { t } = useI18n();

// Loan type options with icons
const loanTypeOptions: SelectItem[] = [
  {
    label: t("loans.types.mortgage"),
    value: "mortgage",
    icon: "i-lucide-home",
  },
  {
    label: t("loans.types.personal"),
    value: "personal",
    icon: "i-lucide-user",
  },
  {
    label: t("loans.types.credit"),
    value: "credit-card",
    icon: "i-lucide-credit-card",
  },
  { label: t("loans.types.auto"), value: "auto", icon: "i-lucide-car" },
  {
    label: t("loans.types.other"),
    value: "other",
    icon: "i-lucide-circle-help",
  },
];

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
