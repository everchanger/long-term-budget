<template>
  <div class="container mx-auto px-4 py-8 space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-3xl font-bold">Financial Projections</h1>
    </div>

    <div v-if="!userHousehold" class="text-center py-12">
      <p class="text-gray-500">No household found. Please create a household first.</p>
    </div>

    <div v-else-if="loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      <p class="mt-4 text-gray-500">Generating projections...</p>
    </div>

    <div v-else-if="error" class="text-center py-12">
      <p class="text-red-500">Error loading projections: {{ error.message }}</p>
    </div>

    <template v-else-if="data">
      <!-- Current State Summary -->
      <UCard>
        <template #header>
          <h2 class="text-xl font-semibold">Current Financial Snapshot</h2>
        </template>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div class="text-sm text-gray-500 dark:text-gray-400">Net Worth</div>
            <div class="text-2xl font-bold" :class="data.currentState.netWorth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
              {{ formatCurrency(data.currentState.netWorth) }}
            </div>
          </div>
          <div>
            <div class="text-sm text-gray-500 dark:text-gray-400">Monthly Income</div>
            <div class="text-2xl font-bold">{{ formatCurrency(data.currentState.monthlyIncome) }}</div>
          </div>
          <div>
            <div class="text-sm text-gray-500 dark:text-gray-400">Monthly Expenses</div>
            <div class="text-2xl font-bold">{{ formatCurrency(data.currentState.monthlyExpenses) }}</div>
          </div>
          <div>
            <div class="text-sm text-gray-500 dark:text-gray-400">Total Debt</div>
            <div class="text-2xl font-bold text-red-600 dark:text-red-400">
              {{ formatCurrency(data.currentState.debt) }}
            </div>
          </div>
        </div>
      </UCard>

      <!-- Interactive Controls -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-semibold">Adjust Assumptions</h2>
            <UButton size="xs" color="neutral" @click="resetToDefaults">Reset to Defaults</UButton>
          </div>
        </template>
        <div class="space-y-6">
          <!-- Income Growth -->
          <div>
            <div class="flex justify-between mb-2">
              <label class="text-sm font-medium">Annual Income Growth</label>
              <span class="text-sm font-semibold">{{ formatPercent(incomeGrowth) }}</span>
            </div>
            <input
              v-model.number="incomeGrowth"
              type="range"
              min="0"
              max="10"
              step="0.5"
              class="w-full"
              @input="debouncedUpdate"
            >
            <div class="flex justify-between text-xs text-gray-500 mt-1">
              <span>0%</span>
              <span>10%</span>
            </div>
          </div>

          <!-- Expense Growth -->
          <div>
            <div class="flex justify-between mb-2">
              <label class="text-sm font-medium">Annual Expense Growth (Inflation)</label>
              <span class="text-sm font-semibold">{{ formatPercent(expenseGrowth) }}</span>
            </div>
            <input
              v-model.number="expenseGrowth"
              type="range"
              min="0"
              max="10"
              step="0.5"
              class="w-full"
              @input="debouncedUpdate"
            >
            <div class="flex justify-between text-xs text-gray-500 mt-1">
              <span>0%</span>
              <span>10%</span>
            </div>
          </div>

          <!-- Savings Rate -->
          <div>
            <div class="flex justify-between mb-2">
              <label class="text-sm font-medium">Savings Interest Rate</label>
              <span class="text-sm font-semibold">{{ formatPercent(savingsRate) }}</span>
            </div>
            <input
              v-model.number="savingsRate"
              type="range"
              min="0"
              max="10"
              step="0.5"
              class="w-full"
              @input="debouncedUpdate"
            >
            <div class="flex justify-between text-xs text-gray-500 mt-1">
              <span>0%</span>
              <span>10%</span>
            </div>
          </div>

          <!-- Investment Return -->
          <div>
            <div class="flex justify-between mb-2">
              <label class="text-sm font-medium">Investment Return Rate</label>
              <span class="text-sm font-semibold">{{ formatPercent(investmentReturn) }}</span>
            </div>
            <input
              v-model.number="investmentReturn"
              type="range"
              min="0"
              max="15"
              step="0.5"
              class="w-full"
              @input="debouncedUpdate"
            >
            <div class="flex justify-between text-xs text-gray-500 mt-1">
              <span>0%</span>
              <span>15%</span>
            </div>
          </div>

          <!-- Additional Savings -->
          <div>
            <div class="flex justify-between mb-2">
              <label class="text-sm font-medium">Additional Monthly Savings</label>
              <span class="text-sm font-semibold">{{ formatCurrency(additionalSavings) }}</span>
            </div>
            <input
              v-model.number="additionalSavings"
              type="range"
              min="0"
              max="2000"
              step="50"
              class="w-full"
              @input="debouncedUpdate"
            >
            <div class="flex justify-between text-xs text-gray-500 mt-1">
              <span>$0</span>
              <span>$2,000</span>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Projection Chart -->
      <FinancialProjectionChart
        :yearly-net-worth="getYearlyNetWorth()"
        :yearly-savings="getYearlySavings()"
        :yearly-investments="getYearlyInvestments()"
        :yearly-debt="getYearlyDebt()"
      />

      <!-- Milestones -->
      <UCard v-if="data.projection.milestones.length > 0">
        <template #header>
          <h2 class="text-xl font-semibold">Key Milestones</h2>
        </template>
        <div class="space-y-3">
          <div
            v-for="milestone in data.projection.milestones"
            :key="milestone.month"
            class="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
          >
            <div class="flex-shrink-0 mt-1">
              <UIcon
                :name="getMilestoneIcon(milestone.type)"
                class="w-5 h-5"
                :class="getMilestoneColor(milestone.type)"
              />
            </div>
            <div class="flex-1">
              <div class="font-medium">{{ milestone.description }}</div>
              <div class="text-sm text-gray-500 dark:text-gray-400">
                {{ milestone.monthLabel }} (Month {{ milestone.month }})
              </div>
              <div v-if="milestone.value" class="text-sm font-semibold mt-1">
                {{ formatCurrency(milestone.value) }}
              </div>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Projection Summary -->
      <UCard>
        <template #header>
          <h2 class="text-xl font-semibold">10-Year Summary</h2>
        </template>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-4">
            <div>
              <div class="text-sm text-gray-500 dark:text-gray-400">Starting Net Worth</div>
              <div class="text-2xl font-bold">{{ formatCurrency(data.projection.summary.startNetWorth) }}</div>
            </div>
            <div>
              <div class="text-sm text-gray-500 dark:text-gray-400">Ending Net Worth</div>
              <div class="text-2xl font-bold text-green-600 dark:text-green-400">
                {{ formatCurrency(data.projection.summary.endNetWorth) }}
              </div>
            </div>
            <div>
              <div class="text-sm text-gray-500 dark:text-gray-400">Total Growth</div>
              <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {{ formatCurrency(data.projection.summary.totalGrowth) }}
              </div>
            </div>
          </div>
          <div class="space-y-4">
            <div>
              <div class="text-sm text-gray-500 dark:text-gray-400">Total Savings</div>
              <div class="text-2xl font-bold">{{ formatCurrency(data.projection.summary.totalSavingsAccumulated) }}</div>
            </div>
            <div>
              <div class="text-sm text-gray-500 dark:text-gray-400">Total Debt Paid</div>
              <div class="text-2xl font-bold text-green-600 dark:text-green-400">
                {{ formatCurrency(data.projection.summary.totalDebtPaid) }}
              </div>
            </div>
            <div>
              <div class="text-sm text-gray-500 dark:text-gray-400">Avg Monthly Cash Flow</div>
              <div class="text-2xl font-bold">
                {{ formatCurrency(data.projection.summary.averageIncome - data.projection.summary.averageExpenses) }}
              </div>
            </div>
          </div>
        </div>
      </UCard>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth'],
})

// Fetch user's household
const { data: householdsData } = await useFetch('/api/households')
const userHousehold = computed(() => householdsData.value?.data?.[0] || null)
const householdId = computed(() => (userHousehold.value ? userHousehold.value.id : null))

// Use projection composable
const {
  data,
  loading,
  error,
  updateParams,
  formatCurrency,
  formatPercent,
  getYearlyNetWorth,
  getYearlySavings,
  getYearlyInvestments,
  getYearlyDebt,
} = useFinancialProjection(householdId)

// Interactive controls state
const incomeGrowth = ref(3) // Default 3%
const expenseGrowth = ref(2) // Default 2%
const savingsRate = ref(4) // Default 4%
const investmentReturn = ref(8) // Default 8%
const additionalSavings = ref(0) // Default $0

// Debounce updates to avoid too many API calls
let updateTimeout: NodeJS.Timeout | null = null
const debouncedUpdate = () => {
  if (updateTimeout) clearTimeout(updateTimeout)
  updateTimeout = setTimeout(() => {
    updateParams({
      incomeGrowth: incomeGrowth.value,
      expenseGrowth: expenseGrowth.value,
      savingsRate: savingsRate.value,
      investmentReturn: investmentReturn.value,
      additionalSavings: additionalSavings.value,
    })
  }, 500)
}

// Reset to defaults
const resetToDefaults = () => {
  incomeGrowth.value = 3
  expenseGrowth.value = 2
  savingsRate.value = 4
  investmentReturn.value = 8
  additionalSavings.value = 0
  updateParams({
    incomeGrowth: 3,
    expenseGrowth: 2,
    savingsRate: 4,
    investmentReturn: 8,
    additionalSavings: 0,
  })
}

// Initialize with data from API if available
watch(data, (newData) => {
  if (newData && !updateTimeout) {
    incomeGrowth.value = newData.inputs.incomeGrowthRate
    expenseGrowth.value = newData.inputs.expenseGrowthRate
    savingsRate.value = newData.inputs.savingsInterestRate
    investmentReturn.value = newData.inputs.investmentReturnRate
    additionalSavings.value = newData.inputs.additionalMonthlySavings
  }
}, { immediate: true })

// Milestone helpers
const getMilestoneIcon = (type: string) => {
  switch (type) {
    case 'debt_free':
      return 'i-heroicons-check-circle'
    case 'net_worth_milestone':
      return 'i-heroicons-trophy'
    case 'savings_goal':
      return 'i-heroicons-star'
    default:
      return 'i-heroicons-flag'
  }
}

const getMilestoneColor = (type: string) => {
  switch (type) {
    case 'debt_free':
      return 'text-green-500'
    case 'net_worth_milestone':
      return 'text-yellow-500'
    case 'savings_goal':
      return 'text-blue-500'
    default:
      return 'text-purple-500'
  }
}
</script>
