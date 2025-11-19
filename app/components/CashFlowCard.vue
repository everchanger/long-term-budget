<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold">Cash Flow</h3>
        <UBadge :color="getStatusColor(data.cashFlow.status)" variant="subtle">
          {{ getStatusText(data.cashFlow.status) }}
        </UBadge>
      </div>
    </template>

    <div class="space-y-4">
      <!-- Monthly Net Cash Flow -->
      <div>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">
          Monthly Net Cash Flow
        </p>
        <p
          class="text-3xl font-bold"
          :class="
            data.cashFlow.monthly.netCashFlow >= 0
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
          "
        >
          {{ formatCurrency(data.cashFlow.monthly.netCashFlow) }}
        </p>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Savings Rate: {{ formatPercent(data.cashFlow.savingsRate) }}
        </p>
      </div>

      <!-- Monthly Breakdown -->
      <USeparator />
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <span
            class="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2"
          >
            <UIcon
              name="i-heroicons-arrow-trending-up"
              class="w-4 h-4 text-green-500"
            />
            Income
          </span>
          <span class="font-medium text-green-600 dark:text-green-400">
            {{ formatCurrency(data.cashFlow.monthly.income) }}
          </span>
        </div>

        <div class="flex items-center justify-between">
          <span
            class="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2"
          >
            <UIcon
              name="i-heroicons-arrow-trending-down"
              class="w-4 h-4 text-red-500"
            />
            Expenses
          </span>
          <span class="font-medium text-red-600 dark:text-red-400">
            {{ formatCurrency(data.cashFlow.monthly.expenses) }}
          </span>
        </div>

        <div class="flex items-center justify-between">
          <span
            class="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2"
          >
            <UIcon
              name="i-heroicons-credit-card"
              class="w-4 h-4 text-orange-500"
            />
            Debt Payments
          </span>
          <span class="font-medium text-orange-600 dark:text-orange-400">
            {{ formatCurrency(data.cashFlow.monthly.debtPayments) }}
          </span>
        </div>
      </div>

      <!-- Annual Summary -->
      <USeparator />
      <div>
        <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">
          Annual Net Cash Flow
        </p>
        <p
          class="text-lg font-semibold"
          :class="
            data.cashFlow.annual.netCashFlow >= 0
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
          "
        >
          {{ formatCurrency(data.cashFlow.annual.netCashFlow) }}
        </p>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import type { FinancialHealthData } from "~/composables/useFinancialHealth";

defineProps<{
  data: FinancialHealthData;
  formatCurrency: (amount: number) => string;
  formatPercent: (value: number) => string;
  getStatusColor: (
    status: "excellent" | "good" | "fair" | "poor"
  ) => "success" | "primary" | "warning" | "error";
  getStatusText: (status: "excellent" | "good" | "fair" | "poor") => string;
}>();
</script>
