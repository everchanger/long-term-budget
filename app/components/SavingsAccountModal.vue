<template>
  <UModal v-model:open="isOpen">
    <template #header>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        {{ isEditing ? $t("savings.editAccount") : $t("savings.addAccount") }}
      </h3>
    </template>

    <template #body>
      <div class="space-y-4">
        <UFormField :label="$t('common.name')" name="name" required>
          <UInput
            id="savings-name"
            v-model="formState.name"
            type="text"
            :placeholder="$t('savings.namePlaceholder')"
            icon="i-lucide-wallet"
            data-testid="savings-name-input"
          />
        </UFormField>

        <UFormField
          :label="$t('savings.currentBalance')"
          name="currentBalance"
          required
        >
          <UInput
            id="savings-balance"
            v-model="formState.currentBalance"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            icon="i-lucide-dollar-sign"
            data-testid="savings-current-balance-input"
          />
        </UFormField>

        <UFormField :label="$t('common.interestRate')" name="interestRate">
          <UInput
            id="savings-interest-rate"
            v-model="formState.interestRate"
            type="number"
            step="0.01"
            min="0"
            placeholder="2.50"
            icon="i-lucide-percent"
            data-testid="savings-interest-rate-input"
          />
        </UFormField>

        <UFormField
          :label="$t('savings.monthlyDeposit')"
          :description="$t('savings.monthlyDepositHelp')"
          name="monthlyDeposit"
        >
          <UInput
            id="savings-monthly-deposit"
            v-model="formState.monthlyDeposit"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            icon="i-lucide-calendar-plus"
            data-testid="savings-monthly-deposit-input"
          />
        </UFormField>

        <UFormField :label="$t('savings.accountType')" name="accountType">
          <USelect
            id="savings-account-type"
            v-model="formState.accountType"
            :items="accountTypeOptions"
            :placeholder="$t('savings.selectType')"
            value-key="value"
            label-key="label"
            :ui="{ content: 'min-w-fit' }"
          />
        </UFormField>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-3">
        <UButton variant="ghost" @click="handleCancel">Cancel</UButton>
        <UButton
          :loading="loading"
          :disabled="!isFormValid"
          data-testid="savings-modal-submit-button"
          @click="handleSubmit"
        >
          {{ isEditing ? "Update" : "Add" }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { z } from "zod";
import type { SelectItem } from "@nuxt/ui";
import type {
  SelectSavingsAccount,
  insertSavingsAccountSchema,
} from "~~/database/validation-schemas";

// Form state inferred from Zod schema (omitting personId which is added later)
type FormState = Omit<z.infer<typeof insertSavingsAccountSchema>, "personId">;

interface Props {
  open?: boolean;
  savingsAccount?: SelectSavingsAccount | null;
  loading?: boolean;
}

interface Emits {
  "update:open": [value: boolean];
  submit: [formData: FormState];
  cancel: [];
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  savingsAccount: null,
  loading: false,
});

const emit = defineEmits<Emits>();

// Account type options with icons
const accountTypeOptions: SelectItem[] = [
  { label: "Savings Account", value: "savings", icon: "i-lucide-piggy-bank" },
  {
    label: "High Yield Savings",
    value: "high-yield",
    icon: "i-lucide-trending-up",
  },
  { label: "Money Market", value: "money-market", icon: "i-lucide-banknote" },
  { label: "Certificate of Deposit", value: "cd", icon: "i-lucide-file-badge" },
  { label: "Checking Account", value: "checking", icon: "i-lucide-wallet" },
  { label: "Other", value: "other", icon: "i-lucide-circle-help" },
];

// Reactive form state
const formState = reactive<FormState>({
  name: "",
  currentBalance: "",
  interestRate: "",
  monthlyDeposit: "",
  accountType: "",
});

// Computed properties
const isOpen = computed({
  get: () => props.open,
  set: (value: boolean) => emit("update:open", value),
});

const isEditing = computed(() => !!props.savingsAccount);

const isFormValid = computed(() => {
  return (
    formState.name.trim() !== "" &&
    formState.currentBalance !== "" &&
    !isNaN(parseFloat(formState.currentBalance)) &&
    parseFloat(formState.currentBalance) >= 0
  );
});

// Watch for changes in savingsAccount prop to populate form
watch(
  () => props.savingsAccount,
  (newSavingsAccount) => {
    if (newSavingsAccount) {
      formState.name = newSavingsAccount.name;
      formState.currentBalance = newSavingsAccount.currentBalance;
      formState.interestRate = newSavingsAccount.interestRate || "";
      formState.monthlyDeposit = newSavingsAccount.monthlyDeposit || "";
      formState.accountType = newSavingsAccount.accountType || "";
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
    if (!isOpen && !props.savingsAccount) {
      resetForm();
    }
  }
);

// Methods
function resetForm() {
  formState.name = "";
  formState.currentBalance = "";
  formState.interestRate = "";
  formState.monthlyDeposit = "";
  formState.accountType = "";
}

function handleCancel() {
  emit("cancel");
  emit("update:open", false);
}

function handleSubmit() {
  if (!isFormValid.value) return;

  emit("submit", {
    name: formState.name.trim(),
    currentBalance: String(formState.currentBalance),
    interestRate: formState.interestRate
      ? String(formState.interestRate)
      : undefined,
    monthlyDeposit: formState.monthlyDeposit
      ? String(formState.monthlyDeposit)
      : undefined,
    accountType: formState.accountType,
  });
}
</script>
