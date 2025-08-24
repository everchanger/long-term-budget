<template>
  <div class="container mx-auto py-8 px-4">
    <!-- Loading State -->
    <div v-if="personLoading" class="text-center py-12">
      <UIcon name="i-heroicons-arrow-path" class="animate-spin h-8 w-8 mx-auto mb-4" />
      <p>Loading person details...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="!person" class="text-center py-12">
      <UCard>
        <UIcon name="i-heroicons-exclamation-triangle" class="mx-auto h-16 w-16 text-red-400 mb-4" />
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">Person Not Found</h3>
        <p class="text-gray-600 dark:text-gray-400 mb-4">The person you're looking for doesn't exist.</p>
        <UButton to="/households" icon="i-heroicons-arrow-left">
          Back to Household
        </UButton>
      </UCard>
    </div>

    <!-- Person Details -->
    <div v-else>
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div>
            <UButton to="/households" variant="ghost" icon="i-heroicons-arrow-left" class="mb-4">
              Back to Household
            </UButton>
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">{{ person.name }}</h1>
            <p class="text-gray-600 dark:text-gray-400">
              {{ person.age ? `Age: ${person.age}` : 'Age not specified' }} • 
              {{ person.householdName || 'Household member' }}
            </p>
          </div>
          <div class="flex gap-2">
            <UButton @click="openEditPersonModal" variant="soft" icon="i-heroicons-pencil">
              Edit Person
            </UButton>
          </div>
        </div>
      </div>

      <!-- Financial Overview Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <UCard>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400">Monthly Income</p>
              <p class="text-2xl font-bold text-green-600">${{ totalMonthlyIncome }}</p>
            </div>
            <UIcon name="i-heroicons-banknotes" class="h-8 w-8 text-green-500" />
          </div>
        </UCard>

        <UCard>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400">Total Savings</p>
              <p class="text-2xl font-bold text-blue-600">${{ totalSavings }}</p>
            </div>
            <UIcon name="i-heroicons-building-library" class="h-8 w-8 text-blue-500" />
          </div>
        </UCard>

        <UCard>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400">Investment Value</p>
              <p class="text-2xl font-bold text-purple-600">${{ totalInvestments }}</p>
            </div>
            <UIcon name="i-heroicons-chart-bar-square" class="h-8 w-8 text-purple-500" />
          </div>
        </UCard>

        <UCard>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400">Total Debt</p>
              <p class="text-2xl font-bold text-red-600">${{ totalDebt }}</p>
            </div>
            <UIcon name="i-heroicons-credit-card" class="h-8 w-8 text-red-500" />
          </div>
        </UCard>
      </div>

      <!-- Financial Details Cards -->
      <div class="space-y-6">
        <!-- Income Sources Card -->
        <UCard>
          <template #header>
            <div class="flex justify-between items-center">
              <div class="flex items-center gap-3">
                <UIcon name="i-heroicons-banknotes" class="h-6 w-6 text-green-500" />
                <div>
                  <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Income Sources</h3>
                  <p class="text-sm text-gray-600 dark:text-gray-400">Manage {{ person.name }}'s income sources</p>
                </div>
              </div>
              <UButton @click="openIncomeModal" icon="i-heroicons-plus" size="sm">
                Add Income
              </UButton>
            </div>
          </template>

          <div v-if="incomeSourcesLoading" class="text-center py-8">
            <UIcon name="i-heroicons-arrow-path" class="animate-spin h-6 w-6 mx-auto" />
          </div>
          <div v-else-if="incomeSources.length === 0" class="text-center py-8">
            <UIcon name="i-heroicons-banknotes" class="mx-auto h-10 w-10 text-gray-400 mb-3" />
            <h4 class="text-lg font-medium text-gray-900 dark:text-white mb-2">No Income Sources</h4>
            <p class="text-gray-600 dark:text-gray-400 mb-4">Add {{ person.name }}'s first income source to get started.</p>
            <UButton @click="openIncomeModal" variant="soft" icon="i-heroicons-plus">
              Add Income Source
            </UButton>
          </div>
          <div v-else class="space-y-3">
            <div 
              v-for="income in incomeSources" 
              :key="income.id"
              class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              <div class="flex justify-between items-start">
                <div class="flex-1">
                  <div class="flex items-center gap-3 mb-2">
                    <h4 class="font-semibold text-gray-900 dark:text-white">{{ income.name }}</h4>
                    <UBadge :color="income.isActive ? 'success' : 'error'">
                      {{ income.isActive ? 'Active' : 'Inactive' }}
                    </UBadge>
                  </div>
                  <p class="text-lg font-medium text-green-600 mb-1">${{ income.amount }} {{ income.frequency }}</p>
                  <div class="text-sm text-gray-600 dark:text-gray-400">
                    <p v-if="income.startDate">Started: {{ formatDate(income.startDate) }}</p>
                    <p v-if="income.endDate">Ends: {{ formatDate(income.endDate) }}</p>
                  </div>
                </div>
                <div class="flex gap-2">
                  <UButton @click="editIncome(income)" size="sm" variant="ghost" icon="i-heroicons-pencil" />
                  <UButton @click="deleteIncome(income)" size="sm" variant="ghost" color="error" icon="i-heroicons-trash" />
                </div>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Loans & Debts Card -->
        <UCard>
          <template #header>
            <div class="flex justify-between items-center">
              <div class="flex items-center gap-3">
                <UIcon name="i-heroicons-credit-card" class="h-6 w-6 text-red-500" />
                <div>
                  <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Loans & Debts</h3>
                  <p class="text-sm text-gray-600 dark:text-gray-400">Manage {{ person.name }}'s loans and debts</p>
                </div>
              </div>
              <UButton @click="openLoanModal" icon="i-heroicons-plus" size="sm">
                Add Loan
              </UButton>
            </div>
          </template>

          <div class="text-center py-8">
            <UIcon name="i-heroicons-credit-card" class="mx-auto h-10 w-10 text-gray-400 mb-3" />
            <h4 class="text-lg font-medium text-gray-900 dark:text-white mb-2">No Loans Yet</h4>
            <p class="text-gray-600 dark:text-gray-400 mb-4">Add loans and debts to track payments and balances.</p>
            <UButton @click="openLoanModal" variant="soft" icon="i-heroicons-plus">
              Add Loan
            </UButton>
          </div>
        </UCard>

        <!-- Savings Accounts Card -->
        <UCard>
          <template #header>
            <div class="flex justify-between items-center">
              <div class="flex items-center gap-3">
                <UIcon name="i-heroicons-building-library" class="h-6 w-6 text-blue-500" />
                <div>
                  <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Savings Accounts</h3>
                  <p class="text-sm text-gray-600 dark:text-gray-400">Manage {{ person.name }}'s savings accounts</p>
                </div>
              </div>
              <UButton @click="openSavingsModal" icon="i-heroicons-plus" size="sm">
                Add Account
              </UButton>
            </div>
          </template>

          <div class="text-center py-8">
            <UIcon name="i-heroicons-building-library" class="mx-auto h-10 w-10 text-gray-400 mb-3" />
            <h4 class="text-lg font-medium text-gray-900 dark:text-white mb-2">No Savings Accounts Yet</h4>
            <p class="text-gray-600 dark:text-gray-400 mb-4">Add savings accounts to track balances and interest.</p>
            <UButton @click="openSavingsModal" variant="soft" icon="i-heroicons-plus">
              Add Savings Account
            </UButton>
          </div>
        </UCard>

        <!-- Investment Accounts Card -->
        <UCard>
          <template #header>
            <div class="flex justify-between items-center">
              <div class="flex items-center gap-3">
                <UIcon name="i-heroicons-chart-bar-square" class="h-6 w-6 text-purple-500" />
                <div>
                  <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Investment Accounts</h3>
                  <p class="text-sm text-gray-600 dark:text-gray-400">Manage {{ person.name }}'s investment portfolios</p>
                </div>
              </div>
              <UButton @click="openInvestmentModal" icon="i-heroicons-plus" size="sm">
                Add Account
              </UButton>
            </div>
          </template>

          <div class="text-center py-8">
            <UIcon name="i-heroicons-chart-bar-square" class="mx-auto h-10 w-10 text-gray-400 mb-3" />
            <h4 class="text-lg font-medium text-gray-900 dark:text-white mb-2">No Investment Accounts Yet</h4>
            <p class="text-gray-600 dark:text-gray-400 mb-4">Add investment accounts to track portfolio performance.</p>
            <UButton @click="openInvestmentModal" variant="soft" icon="i-heroicons-plus">
              Add Investment Account
            </UButton>
          </div>
        </UCard>
      </div>
    </div>

    <!-- Income Source Modal -->
    <UModal v-model:open="isIncomeModalOpen">
      <template #header>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          {{ editingIncomeSource ? 'Edit Income Source' : 'Add Income Source' }}
        </h3>
      </template>

      <template #body>
        <div class="space-y-4">
          <div>
            <label for="income-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name *
            </label>
            <input
              id="income-name"
              v-model="incomeFormState.name"
              type="text"
              placeholder="e.g., Salary, Freelance, etc."
              required
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label for="income-amount" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Amount *
            </label>
            <input
              id="income-amount"
              v-model="incomeFormState.amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              required
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label for="income-frequency" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Frequency *
            </label>
            <select
              id="income-frequency"
              v-model="incomeFormState.frequency"
              required
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Select frequency</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="weekly">Weekly</option>
              <option value="bi-weekly">Bi-weekly</option>
            </select>
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton variant="ghost" @click="closeIncomeModal">Cancel</UButton>
          <UButton 
            @click="handleIncomeSubmit" 
            :loading="isIncomeSubmitting"
            :disabled="!isIncomeFormValid"
          >
            {{ editingIncomeSource ? 'Update' : 'Add' }}
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
interface IncomeSource {
  id: number
  name: string
  amount: string
  frequency: string
  startDate: string | null
  endDate: string | null
  isActive: boolean
  personId: number
}

interface Person {
  id: number
  name: string
  age: number | null
  householdId: number
  householdName?: string
}

// Route params
const route = useRoute()
const personId = route.params.id as string

// Person data
const { data: person, pending: personLoading } = await useFetch<Person>(`/api/persons/${personId}`)

// Income sources
const { data: incomeSources, pending: incomeSourcesLoading, refresh: refreshIncomeSources } = await useFetch<IncomeSource[]>('/api/income-sources', {
  query: { personId },
  default: () => []
})

// Income form state
const isIncomeModalOpen = ref(false)
const isIncomeSubmitting = ref(false)
const editingIncomeSource = ref<IncomeSource | null>(null)
const incomeFormState = reactive({
  name: '',
  amount: '',
  frequency: ''
})

// Computed values
const totalMonthlyIncome = computed(() => {
  if (!incomeSources.value) return '0.00'
  return incomeSources.value
    .filter(income => income.isActive)
    .reduce((total, income) => {
      const amount = parseFloat(income.amount)
      switch (income.frequency) {
        case 'monthly': return total + amount
        case 'yearly': return total + (amount / 12)
        case 'weekly': return total + (amount * 4.33)
        case 'bi-weekly': return total + (amount * 2.17)
        default: return total
      }
    }, 0)
    .toFixed(2)
})

const totalSavings = computed(() => '0.00') // TODO: Implement when savings API is ready
const totalInvestments = computed(() => '0.00') // TODO: Implement when investments API is ready
const totalDebt = computed(() => '0.00') // TODO: Implement when loans API is ready

const isIncomeFormValid = computed(() => {
  return incomeFormState.name.trim() !== '' && 
         incomeFormState.amount !== '' && 
         parseFloat(incomeFormState.amount) > 0 &&
         incomeFormState.frequency !== ''
})

// Functions
function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString()
}

function openIncomeModal() {
  editingIncomeSource.value = null
  incomeFormState.name = ''
  incomeFormState.amount = ''
  incomeFormState.frequency = ''
  isIncomeModalOpen.value = true
}

function closeIncomeModal() {
  isIncomeModalOpen.value = false
  editingIncomeSource.value = null
}

function editIncome(income: IncomeSource) {
  editingIncomeSource.value = income
  incomeFormState.name = income.name
  incomeFormState.amount = income.amount
  incomeFormState.frequency = income.frequency
  isIncomeModalOpen.value = true
}

async function handleIncomeSubmit() {
  if (!isIncomeFormValid.value) return

  isIncomeSubmitting.value = true
  
  try {
    const payload = {
      name: incomeFormState.name.trim(),
      amount: parseFloat(incomeFormState.amount),
      frequency: incomeFormState.frequency,
      person_id: parseInt(personId),
      is_active: true
    }

    if (editingIncomeSource.value) {
      // Update existing income source
      await $fetch(`/api/income-sources/${editingIncomeSource.value.id}`, {
        method: 'PUT',
        body: payload
      })
    } else {
      // Create new income source
      await $fetch('/api/income-sources', {
        method: 'POST',
        body: payload
      })
    }

    await refreshIncomeSources()
    closeIncomeModal()
    
    // Show success notification
    const toast = useToast()
    toast.add({
      title: editingIncomeSource.value ? 'Income source updated' : 'Income source added',
      description: `${incomeFormState.name} has been ${editingIncomeSource.value ? 'updated' : 'added'} successfully.`,
      color: 'success'
    })
  } catch (error: any) {
    const toast = useToast()
    toast.add({
      title: 'Error',
      description: error.data?.message || 'An error occurred',
      color: 'error'
    })
  } finally {
    isIncomeSubmitting.value = false
  }
}

async function deleteIncome(income: IncomeSource) {
  try {
    await $fetch(`/api/income-sources/${income.id}`, {
      method: 'DELETE'
    })

    await refreshIncomeSources()
    
    const toast = useToast()
    toast.add({
      title: 'Income source deleted',
      description: `${income.name} has been removed.`,
      color: 'success'
    })
  } catch (error: any) {
    const toast = useToast()
    toast.add({
      title: 'Error',
      description: error.data?.message || 'Failed to delete income source',
      color: 'error'
    })
  }
}

// Placeholder functions for other modals
function openEditPersonModal() {
  // TODO: Implement person editing
}

function openLoanModal() {
  // TODO: Implement loan modal
}

function openSavingsModal() {
  // TODO: Implement savings modal
}

function openInvestmentModal() {
  // TODO: Implement investment modal
}

// SEO
useHead({
  title: `${person.value?.name || 'Person'} - Financial Details`
})
</script>
