<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <UCard>
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-neutral-600 dark:text-neutral-400">
            {{ t('income.monthlyIncome') }}
          </p>
          <p class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {{ formatCurrency(parseFloat(totalMonthlyIncome)) }}
          </p>
        </div>
      </div>
    </UCard>

    <UCard>
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-neutral-600 dark:text-neutral-400">
            {{ t('savings.totalSavings') }}
          </p>
          <p class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {{ formatCurrency(parseFloat(totalSavings)) }}
          </p>
        </div>
      </div>
    </UCard>

    <UCard>
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-neutral-600 dark:text-neutral-400">
            {{ t('loans.totalDebt') }}
          </p>
          <p class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {{ formatCurrency(parseFloat(totalDebt)) }}
          </p>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n();
const { formatCurrency } = useCurrency();

interface Props {
  totalMonthlyIncome: string;
  totalSavings: string;
  totalDebt: string;
}

defineProps<Props>();
</script>
