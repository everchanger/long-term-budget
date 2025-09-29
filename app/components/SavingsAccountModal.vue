<template>
  <UModal v-model:open="isOpen">
    <template #header>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        {{ isEditing ? "Edit" : "Add" }} Savings Account
      </h3>
    </template>

    <template #body>
      <div class="space-y-4">
        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            for="savings-name"
          >
            Account Name *
          </label>
          <input
            id="savings-name"
            v-model="formState.name"
            type="text"
            placeholder="e.g., Emergency Fund, High Yield Savings, etc."
            required
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            for="savings-balance"
          >
            Current Balance *
          </label>
          <input
            id="savings-balance"
            v-model="formState.currentBalance"
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
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            for="savings-interest-rate"
          >
            Interest Rate (%)
          </label>
          <input
            id="savings-interest-rate"
            v-model="formState.interestRate"
            type="number"
            step="0.01"
            min="0"
            placeholder="2.50"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            for="savings-account-type"
          >
            Account Type
          </label>
          <select
            id="savings-account-type"
            v-model="formState.accountType"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">Select type</option>
            <option value="savings">Savings Account</option>
            <option value="high-yield">High Yield Savings</option>
            <option value="money-market">Money Market</option>
            <option value="cd">Certificate of Deposit</option>
            <option value="checking">Checking Account</option>
            <option value="other">Other</option>
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
import type { SelectSavingsAccount } from "~~/database/validation-schemas";

// Create a form submission type
type SavingsAccountFormData = {
  name: string;
  currentBalance: string;
  interestRate: string;
  accountType: string;
};

interface Props {
  open?: boolean;
  savingsAccount?: SelectSavingsAccount | null;
  loading?: boolean;
}

interface Emits {
  "update:open": [value: boolean];
  submit: [formData: SavingsAccountFormData];
  cancel: [];
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  savingsAccount: null,
  loading: false,
});

const emit = defineEmits<Emits>();

// Reactive form state
const formState = reactive({
  name: "",
  currentBalance: "",
  interestRate: "",
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
    currentBalance: formState.currentBalance,
    interestRate: formState.interestRate,
    accountType: formState.accountType,
  });
}
</script>
