<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold">Debt-to-Income Ratio</h3>
        <UBadge :color="getStatusColor(data.debtToIncome.status)" variant="subtle">
          {{ getStatusText(data.debtToIncome.status) }}
        </UBadge>
      </div>
    </template>

    <div class="space-y-4">
      <!-- DTI Ratio -->
      <div>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">Current DTI Ratio</p>
        <p class="text-3xl font-bold" :class="getRatioColorClass(data.debtToIncome.ratio)">
          {{ formatPercent(data.debtToIncome.ratio) }}
        </p>
      </div>

      <!-- Visual Progress Bar -->
      <div class="space-y-2">
        <div class="relative h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            class="absolute h-full transition-all duration-500"
            :class="getProgressBarColor(data.debtToIncome.ratio)"
            :style="{ width: `${Math.min(data.debtToIncome.ratio, 100)}%` }"
          />
        </div>
        <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>0%</span>
          <span>20% (Excellent)</span>
          <span>36% (Good)</span>
          <span>43% (Fair)</span>
        </div>
      </div>

      <!-- Breakdown -->
      <div class="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div>
          <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Monthly Debt Payments</p>
          <p class="text-lg font-semibold">{{ formatCurrency(data.debtToIncome.monthlyPayments) }}</p>
        </div>
        <div>
          <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Monthly Income</p>
          <p class="text-lg font-semibold">{{ formatCurrency(data.debtToIncome.monthlyIncome) }}</p>
        </div>
      </div>

      <!-- Guidance -->
      <div class="pt-4 border-t border-gray-200 dark:border-gray-700">
        <p class="text-xs text-gray-500 dark:text-gray-400">
          {{ getGuidanceText(data.debtToIncome.ratio) }}
        </p>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import type { FinancialHealthData } from '~/composables/useFinancialHealth'

defineProps<{
  data: FinancialHealthData
  formatCurrency: (amount: number) => string
  formatPercent: (value: number) => string
  getStatusColor: (status: 'excellent' | 'good' | 'fair' | 'poor') => 'success' | 'primary' | 'warning' | 'error'
  getStatusText: (status: 'excellent' | 'good' | 'fair' | 'poor') => string
}>()

const getRatioColorClass = (ratio: number) => {
  if (ratio <= 20) return 'text-green-600 dark:text-green-400'
  if (ratio <= 36) return 'text-blue-600 dark:text-blue-400'
  if (ratio <= 43) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-red-600 dark:text-red-400'
}

const getProgressBarColor = (ratio: number) => {
  if (ratio <= 20) return 'bg-green-500'
  if (ratio <= 36) return 'bg-blue-500'
  if (ratio <= 43) return 'bg-yellow-500'
  return 'bg-red-500'
}

const getGuidanceText = (ratio: number) => {
  if (ratio <= 20) return '✨ Excellent! You have plenty of financial flexibility.'
  if (ratio <= 36) return '👍 Good! Your debt is manageable.'
  if (ratio <= 43) return '⚠️ Consider reducing debt to improve financial health.'
  return '🚨 High debt burden. Focus on debt reduction strategies.'
}
</script>
