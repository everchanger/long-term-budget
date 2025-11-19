<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold">Emergency Fund</h3>
        <UBadge
          :color="getStatusColor(data.emergencyFund.status)"
          variant="subtle"
        >
          {{ getStatusText(data.emergencyFund.status) }}
        </UBadge>
      </div>
    </template>

    <div class="space-y-4">
      <!-- Months Covered -->
      <div>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">
          Months of Expenses Covered
        </p>
        <div class="flex items-baseline gap-2">
          <p
            class="text-3xl font-bold"
            :class="getMonthsColorClass(data.emergencyFund.monthsOfExpenses)"
          >
            {{ data.emergencyFund.monthsOfExpenses.toFixed(1) }}
          </p>
          <p class="text-lg text-gray-500 dark:text-gray-400">
            / {{ data.emergencyFund.targetMonths }}
          </p>
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="space-y-2">
        <div
          class="relative h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
        >
          <div
            class="absolute h-full transition-all duration-500"
            :class="getProgressBarColor(data.emergencyFund.monthsOfExpenses)"
            :style="{
              width: `${Math.min(
                (data.emergencyFund.monthsOfExpenses /
                  data.emergencyFund.targetMonths) *
                  100,
                100
              )}%`,
            }"
          />
        </div>
        <div
          class="flex justify-between text-xs text-gray-500 dark:text-gray-400"
        >
          <span>0 months</span>
          <span>3 months</span>
          <span>6 months</span>
        </div>
      </div>

      <!-- Current Balance -->
      <USeparator />
      <div>
        <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">
          Current Savings Balance
        </p>
        <p class="text-2xl font-semibold text-green-600 dark:text-green-400">
          {{ formatCurrency(data.emergencyFund.currentBalance) }}
        </p>
      </div>

      <!-- Guidance -->
      <USeparator />
      <div>
        <div class="flex items-start gap-2">
          <UIcon
            :name="getGuidanceIcon(data.emergencyFund.monthsOfExpenses)"
            class="w-5 h-5 mt-0.5"
          />
          <p class="text-sm text-gray-600 dark:text-gray-300">
            {{
              getGuidanceText(
                data.emergencyFund.monthsOfExpenses,
                data.emergencyFund.targetMonths
              )
            }}
          </p>
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

const getMonthsColorClass = (months: number) => {
  if (months >= 6) return "text-green-600 dark:text-green-400";
  if (months >= 3) return "text-blue-600 dark:text-blue-400";
  if (months >= 1) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
};

const getProgressBarColor = (months: number) => {
  if (months >= 6) return "bg-green-500";
  if (months >= 3) return "bg-blue-500";
  if (months >= 1) return "bg-yellow-500";
  return "bg-red-500";
};

const getGuidanceIcon = (months: number) => {
  if (months >= 6) return "i-heroicons-shield-check";
  if (months >= 3) return "i-heroicons-arrow-trending-up";
  if (months >= 1) return "i-heroicons-exclamation-triangle";
  return "i-heroicons-exclamation-circle";
};

const getGuidanceText = (months: number, target: number) => {
  if (months >= target) {
    return `Great job! You've reached your ${target}-month emergency fund goal. You're well protected against unexpected expenses.`;
  }
  if (months >= 3) {
    return `You're making good progress! Add more to reach your ${target}-month target for optimal financial security.`;
  }
  if (months >= 1) {
    return `Build your emergency fund to at least ${target} months of expenses to protect against job loss or major expenses.`;
  }
  return `Start building your emergency fund today! Aim for at least ${target} months of essential expenses.`;
};
</script>
