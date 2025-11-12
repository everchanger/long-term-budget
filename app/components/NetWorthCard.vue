<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold">Net Worth</h3>
        <UBadge
          :color="getStatusColor(data.summary.overallHealth)"
          variant="subtle"
        >
          {{ getStatusText(data.summary.overallHealth) }}
        </UBadge>
      </div>
    </template>

    <div class="space-y-4">
      <!-- Total Net Worth -->
      <div>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">Total</p>
        <p
          class="text-3xl font-bold"
          :class="
            data.netWorth.total >= 0
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
          "
        >
          {{ formatCurrency(data.netWorth.total) }}
        </p>
      </div>

      <!-- Breakdown -->
      <div
        class="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700"
      >
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">Assets</p>
          <p class="text-lg font-semibold text-green-600 dark:text-green-400">
            {{ formatCurrency(data.netWorth.assets) }}
          </p>
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">
            Liabilities
          </p>
          <p class="text-lg font-semibold text-red-600 dark:text-red-400">
            {{ formatCurrency(data.netWorth.liabilities) }}
          </p>
        </div>
      </div>

      <!-- Detailed Breakdown -->
      <div class="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between text-sm">
          <span
            class="text-gray-600 dark:text-gray-300 flex items-center gap-2"
          >
            <UIcon name="i-heroicons-banknotes" class="w-4 h-4" />
            Savings
          </span>
          <span class="font-medium">{{
            formatCurrency(data.netWorth.breakdown.savings)
          }}</span>
        </div>
        <div class="flex items-center justify-between text-sm">
          <span
            class="text-gray-600 dark:text-gray-300 flex items-center gap-2"
          >
            <UIcon name="i-heroicons-chart-bar" class="w-4 h-4" />
            Investments
          </span>
          <span class="font-medium">{{
            formatCurrency(data.netWorth.breakdown.investments)
          }}</span>
        </div>
        <div class="flex items-center justify-between text-sm">
          <span
            class="text-gray-600 dark:text-gray-300 flex items-center gap-2"
          >
            <UIcon name="i-heroicons-credit-card" class="w-4 h-4" />
            Debt
          </span>
          <span class="font-medium text-red-600 dark:text-red-400">{{
            formatCurrency(data.netWorth.breakdown.debt)
          }}</span>
        </div>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import type { FinancialHealthData } from "~/composables/useFinancialHealth";

defineProps<{
  data: FinancialHealthData;
  formatCurrency: (amount: number) => string;
  getStatusColor: (
    status: "excellent" | "good" | "fair" | "poor"
  ) => "success" | "primary" | "warning" | "error";
  getStatusText: (status: "excellent" | "good" | "fair" | "poor") => string;
}>();
</script>
