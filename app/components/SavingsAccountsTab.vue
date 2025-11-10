<template>
  <div class="py-6">
    <div class="flex justify-between items-center mb-6">
      <div class="flex items-center gap-3">
        <div>
          <h3 class="text-xl font-semibold text-neutral-900 dark:text-white">
            Savings Accounts
          </h3>
          <p class="text-neutral-600 dark:text-neutral-400">
            Manage {{ personName }}'s savings accounts
          </p>
        </div>
      </div>
      <UButton
        icon="i-heroicons-plus"
        data-testid="add-savings-button"
        @click="openSavingsModal"
      >
        Add Savings Account
      </UButton>
    </div>

    <div v-if="loading" class="text-center py-8">
      <UIcon
        name="i-heroicons-arrow-path"
        class="animate-spin h-6 w-6 mx-auto"
      />
    </div>
    <div v-else-if="savingsAccounts.length === 0" class="text-center py-12">
      <UIcon
        name="i-heroicons-building-library"
        class="mx-auto h-12 w-12 text-neutral-400 mb-4"
      />
      <h4 class="text-lg font-medium text-neutral-900 dark:text-white mb-2">
        No Savings Accounts
      </h4>
      <p class="text-neutral-600 dark:text-neutral-400 mb-4">
        Add {{ personName }}'s first savings account to start tracking balances.
      </p>
      <UButton
        variant="soft"
        icon="i-heroicons-plus"
        data-testid="add-savings-button"
        @click="openSavingsModal"
      >
        Add Savings Account
      </UButton>
    </div>
    <div v-else class="space-y-4">
      <UCard v-for="account in savingsAccounts" :key="account.id">
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-2">
              <h4 class="font-semibold text-neutral-900 dark:text-white">
                {{ account.name }}
              </h4>
              <UBadge v-if="account.accountType" color="neutral">
                {{ account.accountType }}
              </UBadge>
            </div>
            <p
              class="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-1"
            >
              ${{ parseFloat(account.currentBalance).toLocaleString() }} balance
            </p>
            <div class="text-sm text-neutral-600 dark:text-neutral-400">
              <p v-if="account.interestRate">
                Interest Rate:
                {{ parseFloat(account.interestRate).toFixed(2) }}%
              </p>
              <p v-if="account.monthlyDeposit">
                Monthly Deposit: ${{
                  parseFloat(account.monthlyDeposit).toLocaleString()
                }}
              </p>
            </div>
          </div>
          <div class="flex gap-2">
            <UButton
              size="sm"
              variant="ghost"
              icon="i-heroicons-pencil"
              :data-testid="`savings-${account.id}-edit-button`"
              @click="editSavings(account)"
            />
            <UButton
              size="sm"
              variant="ghost"
              color="error"
              icon="i-heroicons-trash"
              :data-testid="`savings-${account.id}-delete-button`"
              @click="deleteSavings(account)"
            />
          </div>
        </div>
      </UCard>
    </div>

    <!-- Savings Account Modal -->
    <SavingsAccountModal
      v-model:open="isSavingsModalOpen"
      :savings-account="editingSavings"
      :loading="isSavingsSubmitting"
      @submit="handleSavingsSubmit"
      @cancel="closeSavingsModal"
    />
  </div>
</template>

<script setup lang="ts">
import type { SelectSavingsAccount } from "~~/database/validation-schemas";

interface Props {
  savingsAccounts: SelectSavingsAccount[];
  loading: boolean;
  personName: string;
  personId: string;
}

const props = defineProps<Props>();

// Use the simplified composable for API operations only
const {
  createSavingsAccount,
  updateSavingsAccount,
  deleteSavingsAccount: deleteSavingsAccountAPI,
} = useSavingsAccounts(props.personId);

// Modal state - now managed by this component
const isSavingsModalOpen = ref(false);
const isSavingsSubmitting = ref(false);
const editingSavings = ref<SelectSavingsAccount | null>(null);

// Modal functions
const openSavingsModal = () => {
  editingSavings.value = null;
  isSavingsModalOpen.value = true;
};

const closeSavingsModal = () => {
  isSavingsModalOpen.value = false;
  editingSavings.value = null;
};

const editSavings = (account: SelectSavingsAccount) => {
  editingSavings.value = account;
  isSavingsModalOpen.value = true;
};

// Handle form submission
const handleSavingsSubmit = async (formData: {
  name: string;
  currentBalance: string;
  interestRate?: string;
  monthlyDeposit?: string;
  accountType: string;
}) => {
  isSavingsSubmitting.value = true;

  try {
    if (editingSavings.value) {
      await updateSavingsAccount(editingSavings.value.id, formData);
    } else {
      await createSavingsAccount(formData);
    }

    closeSavingsModal();

    // Show success notification
    const toast = useToast();
    toast.add({
      title: editingSavings.value
        ? "Savings account updated"
        : "Savings account added",
      description: `${formData.name} has been ${
        editingSavings.value ? "updated" : "added"
      } successfully.`,
      color: "success",
    });
  } catch (error: unknown) {
    const toast = useToast();
    toast.add({
      title: "Error",
      description: error instanceof Error ? error.message : "An error occurred",
      color: "error",
    });
  } finally {
    isSavingsSubmitting.value = false;
  }
};

// Handle deletion
const deleteSavings = async (account: SelectSavingsAccount) => {
  try {
    await deleteSavingsAccountAPI(account.id);

    const toast = useToast();
    toast.add({
      title: "Savings account deleted",
      description: `${account.name} has been removed.`,
      color: "success",
    });
  } catch {
    const toast = useToast();
    toast.add({
      title: "Error",
      description: "Failed to delete savings account",
      color: "error",
    });
  }
};
</script>
