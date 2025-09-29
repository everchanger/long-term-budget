<template>
  <div class="py-6">
    <div class="flex justify-between items-center mb-6">
      <div class="flex items-center gap-3">
        <UIcon
          name="i-heroicons-building-library"
          class="h-6 w-6 text-neutral-400"
        />
        <div>
          <h3 class="text-xl font-semibold text-neutral-900 dark:text-white">
            Savings Accounts
          </h3>
          <p class="text-neutral-600 dark:text-neutral-400">
            Manage {{ personName }}'s savings accounts
          </p>
        </div>
      </div>
      <UButton icon="i-heroicons-plus" @click="onAddClick">
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
      <UButton variant="soft" icon="i-heroicons-plus" @click="onAddClick">
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
            </div>
          </div>
          <div class="flex gap-2">
            <UButton
              size="sm"
              variant="ghost"
              icon="i-heroicons-pencil"
              @click="onEditClick(account)"
            />
            <UButton
              size="sm"
              variant="ghost"
              color="error"
              icon="i-heroicons-trash"
              @click="onDeleteClick(account)"
            />
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SelectSavingsAccount } from "~~/database/validation-schemas";

interface Props {
  savingsAccounts: SelectSavingsAccount[];
  loading: boolean;
  personName: string;
}

interface Emits {
  addSavings: [];
  editSavings: [account: SelectSavingsAccount];
  deleteSavings: [account: SelectSavingsAccount];
}

defineProps<Props>();
const emit = defineEmits<Emits>();

const onAddClick = () => emit("addSavings");
const onEditClick = (account: SelectSavingsAccount) =>
  emit("editSavings", account);
const onDeleteClick = (account: SelectSavingsAccount) =>
  emit("deleteSavings", account);
</script>
