<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <UCard>
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-neutral-600 dark:text-neutral-400">
            Monthly Income
          </p>
          <p class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            ${{ totalMonthlyIncome }}
          </p>
        </div>
        <UIcon name="i-heroicons-banknotes" class="h-8 w-8 text-neutral-400" />
      </div>
    </UCard>

    <UCard>
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-neutral-600 dark:text-neutral-400">
            Total Savings
          </p>
          <p class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            ${{ totalSavings }}
          </p>
        </div>
        <UIcon
          name="i-heroicons-building-library"
          class="h-8 w-8 text-neutral-400"
        />
      </div>
    </UCard>

    <UCard>
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-neutral-600 dark:text-neutral-400">
            Total Debt
          </p>
          <p class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            ${{ totalDebt }}
          </p>
        </div>
        <UIcon
          name="i-heroicons-credit-card"
          class="h-8 w-8 text-neutral-400"
        />
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
interface Props {
  totalMonthlyIncome: string;
  totalSavings: string;
  totalDebt: string;
}

defineProps<Props>();
</script>
