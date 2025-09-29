<template>
  <div class="py-6">
    <div class="flex justify-between items-center mb-6">
      <div class="flex items-center gap-3">
        <UIcon name="i-heroicons-credit-card" class="h-6 w-6 text-gray-400" />
        <div>
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
            Loans & Debts
          </h3>
          <p class="text-gray-600 dark:text-gray-400">
            Manage {{ personName }}'s loans and debts
          </p>
        </div>
      </div>
      <UButton icon="i-heroicons-plus" @click="onAddClick"> Add Loan </UButton>
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
      <UButton variant="soft" icon="i-heroicons-plus" @click="onAddClick">
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
              @click="onEditClick(loan)"
            />
            <UButton
              size="sm"
              variant="ghost"
              color="error"
              icon="i-heroicons-trash"
              @click="onDeleteClick(loan)"
            />
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SelectLoan } from "~~/database/validation-schemas";

interface Props {
  loans: SelectLoan[];
  loading: boolean;
  personName: string;
}

interface Emits {
  addLoan: [];
  editLoan: [loan: SelectLoan];
  deleteLoan: [loan: SelectLoan];
}

defineProps<Props>();
const emit = defineEmits<Emits>();

const onAddClick = () => emit("addLoan");
const onEditClick = (loan: SelectLoan) => emit("editLoan", loan);
const onDeleteClick = (loan: SelectLoan) => emit("deleteLoan", loan);
</script>
