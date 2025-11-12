<template>
  <div class="container mx-auto p-4 sm:p-6 lg:p-8">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">Financial Health Dashboard</h1>
      <p class="text-gray-600 dark:text-gray-400">
        Track your overall financial wellness and key metrics
      </p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <USkeleton v-for="i in 4" :key="i" class="h-64" />
    </div>

    <!-- Error State -->
    <UAlert
      v-else-if="error"
      color="error"
      variant="subtle"
      title="Failed to load financial health data"
      :description="error"
      class="mb-6"
    />

    <!-- Dashboard Content -->
    <div v-else-if="data" class="space-y-6">
      <!-- Overall Health Summary -->
      <UCard>
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-bold mb-2">Overall Financial Health</h2>
            <p class="text-gray-600 dark:text-gray-400">
              Based on your net worth, cash flow, debt levels, and emergency fund
            </p>
          </div>
          <UBadge
            :color="getStatusColor(data.summary.overallHealth)"
            variant="solid"
            size="xl"
            class="text-lg px-4 py-2"
          >
            <UIcon :name="getStatusIcon(data.summary.overallHealth)" class="w-6 h-6 mr-2" />
            {{ getStatusText(data.summary.overallHealth) }}
          </UBadge>
        </div>
      </UCard>

      <!-- Key Metrics Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <NetWorthCard
          :data="data"
          :format-currency="formatCurrency"
          :get-status-color="getStatusColor"
          :get-status-text="getStatusText"
        />

        <CashFlowCard
          :data="data"
          :format-currency="formatCurrency"
          :format-percent="formatPercent"
          :get-status-color="getStatusColor"
          :get-status-text="getStatusText"
        />

        <DebtToIncomeCard
          :data="data"
          :format-currency="formatCurrency"
          :format-percent="formatPercent"
          :get-status-color="getStatusColor"
          :get-status-text="getStatusText"
        />

        <EmergencyFundCard
          :data="data"
          :format-currency="formatCurrency"
          :get-status-color="getStatusColor"
          :get-status-text="getStatusText"
        />
      </div>

      <!-- Action Items / Recommendations -->
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Recommended Actions</h3>
        </template>

        <div class="space-y-3">
          <div
            v-for="recommendation in recommendations"
            :key="recommendation.title"
            class="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <UIcon :name="recommendation.icon" class="w-5 h-5 mt-0.5" :class="recommendation.iconColor" />
            <div class="flex-1">
              <h4 class="font-semibold mb-1">{{ recommendation.title }}</h4>
              <p class="text-sm text-gray-600 dark:text-gray-400">{{ recommendation.description }}</p>
            </div>
          </div>

          <div v-if="recommendations.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
            <UIcon name="i-heroicons-trophy" class="w-12 h-12 mx-auto mb-2 text-green-500" />
            <p class="font-semibold">Excellent work!</p>
            <p class="text-sm">Your finances are in great shape. Keep it up!</p>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useFinancialHealth } from '~/composables/useFinancialHealth'
import NetWorthCard from '~/components/NetWorthCard.vue'
import CashFlowCard from '~/components/CashFlowCard.vue'
import DebtToIncomeCard from '~/components/DebtToIncomeCard.vue'
import EmergencyFundCard from '~/components/EmergencyFundCard.vue'

definePageMeta({
  middleware: 'auth',
})

// Fetch current user's households
const { data: householdsResponse } = await useFetch('/api/households')
const households = computed(() => householdsResponse.value?.data ?? [])

// Get first household (current user's household)
const userHousehold = computed(() => {
  if (!households.value || !Array.isArray(households.value) || households.value.length === 0) {
    return null
  }
  return households.value[0] || null
})

// Use financial health composable with household ID
const currentHouseholdId = computed(() => userHousehold.value?.id ?? null)
const {
  data,
  loading,
  error,
  formatCurrency,
  formatPercent,
  getStatusColor,
  getStatusIcon,
  getStatusText,
} = useFinancialHealth(currentHouseholdId)

// Generate smart recommendations based on data
const recommendations = computed(() => {
  if (!data.value) return []

  const recs: Array<{
    title: string
    description: string
    icon: string
    iconColor: string
    priority: number
  }> = []

  // Emergency fund recommendations
  if (data.value.emergencyFund.monthsOfExpenses < 3) {
    recs.push({
      title: 'Build Your Emergency Fund',
      description: `Increase your emergency savings to cover at least 3-6 months of expenses. You currently have ${data.value.emergencyFund.monthsOfExpenses.toFixed(1)} months covered.`,
      icon: 'i-heroicons-shield-exclamation',
      iconColor: 'text-red-500',
      priority: 1,
    })
  }

  // Debt-to-income recommendations
  if (data.value.debtToIncome.ratio > 36) {
    recs.push({
      title: 'Reduce Debt Burden',
      description: `Your debt-to-income ratio is ${data.value.debtToIncome.ratio.toFixed(1)}%. Focus on paying down high-interest debt to improve financial flexibility.`,
      icon: 'i-heroicons-credit-card',
      iconColor: 'text-orange-500',
      priority: 2,
    })
  }

  // Cash flow recommendations
  if (data.value.cashFlow.savingsRate < 10) {
    recs.push({
      title: 'Increase Savings Rate',
      description: `Your current savings rate is ${data.value.cashFlow.savingsRate.toFixed(1)}%. Try to save at least 10-20% of your income for future goals.`,
      icon: 'i-heroicons-arrow-trending-up',
      iconColor: 'text-blue-500',
      priority: 3,
    })
  }

  // Net worth growth opportunity
  if (data.value.netWorth.total > 0 && data.value.cashFlow.monthly.netCashFlow > 0) {
    recs.push({
      title: 'Invest Excess Cash Flow',
      description: `You have positive cash flow of ${formatCurrency(data.value.cashFlow.monthly.netCashFlow)}/month. Consider investing in retirement accounts or taxable investments.`,
      icon: 'i-heroicons-chart-bar',
      iconColor: 'text-green-500',
      priority: 4,
    })
  }

  // Sort by priority
  return recs.sort((a, b) => a.priority - b.priority).slice(0, 3)
})
</script>
