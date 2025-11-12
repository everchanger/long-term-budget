export interface FinancialHealthData {
  netWorth: {
    total: number
    assets: number
    liabilities: number
    breakdown: {
      savings: number
      investments: number
      debt: number
    }
  }
  cashFlow: {
    monthly: {
      income: number
      expenses: number
      debtPayments: number
      netCashFlow: number
    }
    annual: {
      income: number
      expenses: number
      debtPayments: number
      netCashFlow: number
    }
    savingsRate: number
    status: 'excellent' | 'good' | 'fair' | 'poor'
  }
  debtToIncome: {
    ratio: number
    monthlyPayments: number
    monthlyIncome: number
    status: 'excellent' | 'good' | 'fair' | 'poor'
  }
  emergencyFund: {
    currentBalance: number
    monthsOfExpenses: number
    targetMonths: number
    isAdequate: boolean
    status: 'excellent' | 'good' | 'fair' | 'poor'
  }
  summary: {
    overallHealth: 'excellent' | 'good' | 'fair' | 'poor'
  }
}

export const useFinancialHealth = (householdId: Ref<number | null>) => {
  const data = ref<FinancialHealthData | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchFinancialHealth = async () => {
    if (!householdId.value) return

    loading.value = true
    error.value = null

    try {
      const response = await $fetch<{ data: FinancialHealthData }>(
        `/api/households/${householdId.value}/financial-health`,
      )
      data.value = response.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load financial health data'
      console.error('Error fetching financial health:', err)
    } finally {
      loading.value = false
    }
  }

  // Auto-fetch when householdId changes
  watch(householdId, fetchFinancialHealth, { immediate: true })

  // Format currency helper
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Format percentage helper
  const formatPercent = (value: number, decimals = 1): string => {
    return `${value.toFixed(decimals)}%`
  }

  // Get status color for UI
  const getStatusColor = (
    status: 'excellent' | 'good' | 'fair' | 'poor',
  ): 'success' | 'primary' | 'warning' | 'error' => {
    const colors = {
      excellent: 'success' as const,
      good: 'primary' as const,
      fair: 'warning' as const,
      poor: 'error' as const,
    }
    return colors[status]
  }

  // Get status icon
  const getStatusIcon = (status: 'excellent' | 'good' | 'fair' | 'poor'): string => {
    const icons = {
      excellent: 'i-heroicons-check-circle',
      good: 'i-heroicons-arrow-trending-up',
      fair: 'i-heroicons-exclamation-triangle',
      poor: 'i-heroicons-x-circle',
    }
    return icons[status]
  }

  // Get status text
  const getStatusText = (status: 'excellent' | 'good' | 'fair' | 'poor'): string => {
    const texts = {
      excellent: 'Excellent',
      good: 'Good',
      fair: 'Needs Attention',
      poor: 'Critical',
    }
    return texts[status]
  }

  return {
    data: readonly(data),
    loading: readonly(loading),
    error: readonly(error),
    fetchFinancialHealth,
    formatCurrency,
    formatPercent,
    getStatusColor,
    getStatusIcon,
    getStatusText,
  }
}
