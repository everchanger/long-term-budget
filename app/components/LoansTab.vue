<template>
  <div class="py-6">
    <div class="flex justify-between items-center mb-6">
      <div class="flex items-center gap-3">
        <div>
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
            Loans & Debts
          </h3>
          <p class="text-gray-600 dark:text-gray-400">
            Manage {{ personName }}'s loans and debts
          </p>
        </div>
      </div>
      <UButton icon="i-heroicons-plus" @click="openLoanModal">
        Add Loan
      </UButton>
    </div>

    <div v-if="loading" class="text-center py-8">
      <UIcon
        name="i-heroicons-arrow-path"
        class="animate-spin h-6 w-6 mx-auto"
      />
    </div>
    <div v-else-if="loans.length === 0" class="text-center py-12">
      <UIcon
        name="i-heroicons-credit-card"
        class="mx-auto h-12 w-12 text-gray-400 mb-4"
      />
      <h4 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
        No Loans Yet
      </h4>
      <p class="text-gray-600 dark:text-gray-400 mb-4">
        Add loans and debts to track payments and balances.
      </p>
      <UButton variant="soft" icon="i-heroicons-plus" @click="openLoanModal">
        Add Loan
      </UButton>
    </div>
    <div v-else class="space-y-4">
      <UCard v-for="loan in loans" :key="loan.id">
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-2">
              <h4 class="font-semibold text-neutral-900 dark:text-white">
                {{ loan.name }}
              </h4>
              <UBadge v-if="loan.loanType" color="neutral">
                {{ loan.loanType }}
              </UBadge>
            </div>
            <p
              class="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-1"
            >
              ${{ parseFloat(loan.currentBalance).toLocaleString() }} balance
            </p>
            <div class="text-sm text-neutral-600 dark:text-neutral-400">
              <p v-if="loan.interestRate">
                Interest Rate: {{ parseFloat(loan.interestRate).toFixed(2) }}%
              </p>
              <p v-if="loan.monthlyPayment">
                Monthly Payment: ${{
                  parseFloat(loan.monthlyPayment).toLocaleString()
                }}
              </p>
            </div>
          </div>
          <div class="flex gap-2">
            <UButton
              size="sm"
              variant="ghost"
              icon="i-heroicons-pencil"
              @click="editLoan(loan)"
            />
            <UButton
              size="sm"
              variant="ghost"
              color="error"
              icon="i-heroicons-trash"
              @click="deleteLoan(loan)"
            />
          </div>
        </div>
      </UCard>
    </div>

    <!-- Loan Modal -->
    <LoanModal
      v-model:open="isLoanModalOpen"
      :loan="editingLoan"
      :loading="isLoanSubmitting"
      @submit="handleLoanSubmit"
      @cancel="closeLoanModal"
    />
  </div>
</template>

<script setup lang="ts">
import type { SelectLoan } from "~~/database/validation-schemas";

interface Props {
  loans: SelectLoan[];
  loading: boolean;
  personName: string;
  personId: string;
}

const props = defineProps<Props>();

// Use the simplified composable for API operations only
const {
  createLoan,
  updateLoan,
  deleteLoan: deleteLoanAPI,
} = useLoans(props.personId);

// Modal state - now managed by this component
const isLoanModalOpen = ref(false);
const isLoanSubmitting = ref(false);
const editingLoan = ref<SelectLoan | null>(null);

// Modal functions
const openLoanModal = () => {
  editingLoan.value = null;
  isLoanModalOpen.value = true;
};

const closeLoanModal = () => {
  isLoanModalOpen.value = false;
  editingLoan.value = null;
};

const editLoan = (loan: SelectLoan) => {
  editingLoan.value = loan;
  isLoanModalOpen.value = true;
};

// Handle form submission
const handleLoanSubmit = async (formData: {
  name: string;
  originalAmount: string;
  currentBalance: string;
  interestRate: string;
  monthlyPayment: string;
  loanType: string;
}) => {
  isLoanSubmitting.value = true;

  try {
    if (editingLoan.value) {
      await updateLoan(editingLoan.value.id, formData);
    } else {
      await createLoan(formData);
    }

    closeLoanModal();

    // Show success notification
    const toast = useToast();
    toast.add({
      title: editingLoan.value ? "Loan updated" : "Loan added",
      description: `${formData.name} has been ${
        editingLoan.value ? "updated" : "added"
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
    isLoanSubmitting.value = false;
  }
};

// Handle deletion
const deleteLoan = async (loan: SelectLoan) => {
  try {
    await deleteLoanAPI(loan.id);

    const toast = useToast();
    toast.add({
      title: "Loan deleted",
      description: `${loan.name} has been removed.`,
      color: "success",
    });
  } catch {
    const toast = useToast();
    toast.add({
      title: "Error",
      description: "Failed to delete loan",
      color: "error",
    });
  }
};
</script>
