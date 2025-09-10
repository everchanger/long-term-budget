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
            <UButton variant="soft" icon="i-heroicons-pencil" @click="openEditPersonModal">
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
              <p class="text-sm text-neutral-600 dark:text-neutral-400">Monthly Income</p>
              <p class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">${{ totalMonthlyIncome }}</p>
            </div>
            <UIcon name="i-heroicons-banknotes" class="h-8 w-8 text-neutral-400" />
          </div>
        </UCard>

        <UCard>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-neutral-600 dark:text-neutral-400">Total Savings</p>
              <p class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">${{ totalSavings }}</p>
            </div>
            <UIcon name="i-heroicons-building-library" class="h-8 w-8 text-neutral-400" />
          </div>
        </UCard>

        <UCard>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-neutral-600 dark:text-neutral-400">Investment Value</p>
              <p class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">${{ totalInvestments }}</p>
            </div>
            <UIcon name="i-heroicons-chart-bar-square" class="h-8 w-8 text-neutral-400" />
          </div>
        </UCard>

        <UCard>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-neutral-600 dark:text-neutral-400">Total Debt</p>
              <p class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">${{ totalDebt }}</p>
            </div>
            <UIcon name="i-heroicons-credit-card" class="h-8 w-8 text-neutral-400" />
          </div>
        </UCard>
      </div>

      <!-- Financial Details Tabs -->
      <UCard>
        <UTabs v-model="selectedTab" :items="financialTabs" class="w-full">
          <template #content="{ item }">
            <div class="py-6">
              <!-- Income Sources Tab -->
              <div v-if="item.value === 'income'">
                <div class="flex justify-between items-center mb-6">
                  <div class="flex items-center gap-3">
                    <UIcon name="i-heroicons-banknotes" class="h-6 w-6 text-neutral-400" />
                    <div>
                      <h3 class="text-xl font-semibold text-neutral-900 dark:text-white">Income Sources</h3>
                      <p class="text-neutral-600 dark:text-neutral-400">Manage {{ person.name }}'s income sources</p>
                    </div>
                  </div>
                  <UButton icon="i-heroicons-plus" @click="openIncomeModal">
                    Add Income Source
                  </UButton>
                </div>

                <div v-if="incomeSourcesLoading" class="text-center py-8">
                  <UIcon name="i-heroicons-arrow-path" class="animate-spin h-6 w-6 mx-auto" />
                </div>
                <div v-else-if="incomeSources.length === 0" class="text-center py-12">
                  <UIcon name="i-heroicons-banknotes" class="mx-auto h-12 w-12 text-neutral-400 mb-4" />
                  <h4 class="text-lg font-medium text-neutral-900 dark:text-white mb-2">No Income Sources</h4>
                  <p class="text-neutral-600 dark:text-neutral-400 mb-4">Add {{ person.name }}'s first income source to
                    get started.</p>
                  <UButton variant="soft" icon="i-heroicons-plus" @click="openIncomeModal">
                    Add Income Source
                  </UButton>
                </div>
                <div v-else class="space-y-4">
                  <UCard v-for="income in incomeSources" :key="income.id">
                    <div class="flex justify-between items-start">
                      <div class="flex-1">
                        <div class="flex items-center gap-3 mb-2">
                          <h4 class="font-semibold text-neutral-900 dark:text-white">{{ income.name }}</h4>
                          <UBadge :color="income.isActive ? 'success' : 'error'">
                            {{ income.isActive ? 'Active' : 'Inactive' }}
                          </UBadge>
                        </div>
                        <p class="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-1">${{ income.amount }}
                          {{ income.frequency }}</p>
                        <div class="text-sm text-neutral-600 dark:text-neutral-400">
                          <p v-if="income.startDate">Started: {{ formatDate(income.startDate) }}</p>
                          <p v-if="income.endDate">Ends: {{ formatDate(income.endDate) }}</p>
                        </div>
                      </div>
                      <div class="flex gap-2">
                        <UButton size="sm" variant="ghost" icon="i-heroicons-pencil" @click="editIncome(income)" />
                        <UButton size="sm" variant="ghost" color="error" icon="i-heroicons-trash"
                          @click="deleteIncome(income)" />
                      </div>
                    </div>
                  </UCard>
                </div>
              </div>

              <!-- Loans & Debts Tab -->
              <div v-else-if="item.value === 'loans'">
                <div class="flex justify-between items-center mb-6">
                  <div class="flex items-center gap-3">
                    <UIcon name="i-heroicons-credit-card" class="h-6 w-6 text-gray-400" />
                    <div>
                      <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Loans & Debts</h3>
                      <p class="text-gray-600 dark:text-gray-400">Manage {{ person.name }}'s loans and debts</p>
                    </div>
                  </div>
                  <UButton icon="i-heroicons-plus" @click="openLoanModal">
                    Add Loan
                  </UButton>
                </div>

                <div v-if="loansLoading" class="text-center py-8">
                  <UIcon name="i-heroicons-arrow-path" class="animate-spin h-6 w-6 mx-auto" />
                </div>
                <div v-else-if="loans.length === 0" class="text-center py-12">
                  <UIcon name="i-heroicons-credit-card" class="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h4 class="text-lg font-medium text-gray-900 dark:text-white mb-2">No Loans Yet</h4>
                  <p class="text-gray-600 dark:text-gray-400 mb-4">Add loans and debts to track payments and balances.
                  </p>
                  <UButton variant="soft" icon="i-heroicons-plus" @click="openLoanModal">
                    Add Loan
                  </UButton>
                </div>
                <div v-else class="space-y-4">
                  <UCard v-for="loan in loans" :key="loan.id">
                    <div class="flex justify-between items-start">
                      <div class="flex-1">
                        <div class="flex items-center gap-3 mb-2">
                          <h4 class="font-semibold text-neutral-900 dark:text-white">{{ loan.name }}</h4>
                          <UBadge v-if="loan.loanType" color="neutral">{{ loan.loanType }}</UBadge>
                        </div>
                        <p class="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-1">
                          ${{ parseFloat(loan.currentBalance).toLocaleString() }} balance
                        </p>
                        <div class="text-sm text-neutral-600 dark:text-neutral-400">
                          <p v-if="loan.interestRate">Interest Rate: {{ parseFloat(loan.interestRate).toFixed(2) }}%</p>
                          <p v-if="loan.monthlyPayment">Monthly Payment: ${{
                            parseFloat(loan.monthlyPayment).toLocaleString() }}</p>
                        </div>
                      </div>
                      <div class="flex gap-2">
                        <UButton size="sm" variant="ghost" icon="i-heroicons-pencil" @click="editLoan(loan)" />
                        <UButton size="sm" variant="ghost" color="error" icon="i-heroicons-trash"
                          @click="deleteLoan(loan)" />
                      </div>
                    </div>
                  </UCard>
                </div>
              </div>

              <!-- Savings Accounts Tab -->
              <div v-else-if="item.value === 'savings'">
                <div class="flex justify-between items-center mb-6">
                  <div class="flex items-center gap-3">
                    <UIcon name="i-heroicons-building-library" class="h-6 w-6 text-gray-400" />
                    <div>
                      <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Savings Accounts</h3>
                      <p class="text-gray-600 dark:text-gray-400">Manage {{ person.name }}'s savings accounts</p>
                    </div>
                  </div>
                  <UButton icon="i-heroicons-plus" @click="openSavingsModal">
                    Add Savings Account
                  </UButton>
                </div>
                <div class="text-center py-12">
                  <UIcon name="i-heroicons-building-library" class="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h4 class="text-lg font-medium text-gray-900 dark:text-white mb-2">No Savings Accounts Yet</h4>
                  <p class="text-gray-600 dark:text-gray-400 mb-4">Add savings accounts to track balances and interest.
                  </p>
                  <UButton variant="soft" icon="i-heroicons-plus" @click="openSavingsModal">
                    Add Savings Account
                  </UButton>
                </div>
              </div>

              <!-- Investment Accounts Tab -->
              <div v-else-if="item.value === 'investments'">
                <div class="flex justify-between items-center mb-6">
                  <div class="flex items-center gap-3">
                    <UIcon name="i-heroicons-chart-bar-square" class="h-6 w-6 text-gray-400" />
                    <div>
                      <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Investment Accounts</h3>
                      <p class="text-gray-600 dark:text-gray-400">Manage {{ person.name }}'s investment portfolios</p>
                    </div>
                  </div>
                  <UButton icon="i-heroicons-plus" @click="openInvestmentModal">
                    Add Investment Account
                  </UButton>
                </div>
                <div class="text-center py-12">
                  <UIcon name="i-heroicons-chart-bar-square" class="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h4 class="text-lg font-medium text-gray-900 dark:text-white mb-2">No Investment Accounts Yet</h4>
                  <p class="text-gray-600 dark:text-gray-400 mb-4">Add investment accounts to track portfolio
                    performance.</p>
                  <UButton variant="soft" icon="i-heroicons-plus" @click="openInvestmentModal">
                    Add Investment Account
                  </UButton>
                </div>
              </div>
            </div>
          </template>
        </UTabs>
      </UCard>
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
            <input id="income-name" v-model="incomeFormState.name" type="text"
              placeholder="e.g., Salary, Freelance, etc." required
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white">
          </div>

          <div>
            <label for="income-amount" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Amount *
            </label>
            <input id="income-amount" v-model="incomeFormState.amount" type="number" step="0.01" min="0"
              placeholder="0.00" required
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white">
          </div>

          <div>
            <label for="income-frequency" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Frequency *
            </label>
            <select id="income-frequency" v-model="incomeFormState.frequency" required
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white">
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
          <UButton :loading="isIncomeSubmitting" :disabled="!isIncomeFormValid" @click="handleIncomeSubmit">
            {{ editingIncomeSource ? 'Update' : 'Add' }}
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Loan Modal -->
    <UModal v-model:open="isLoanModalOpen">
      <template #header>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          Add Loan/Debt
        </h3>
      </template>

      <template #body>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
            <input v-model="loanFormState.name" type="text" placeholder="e.g., Mortgage, Credit Card, etc." required
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Outstanding Amount *</label>
            <input v-model="loanFormState.amount" type="number" step="0.01" min="0" placeholder="0.00" required
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Interest Rate (%)</label>
            <input v-model="loanFormState.interestRate" type="number" step="0.01" min="0" placeholder="5.00"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Monthly Payment</label>
            <input v-model="loanFormState.monthlyPayment" type="number" step="0.01" min="0" placeholder="0.00"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Loan Type</label>
            <select v-model="loanFormState.loanType"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white">
              <option value="">Select type</option>
              <option value="mortgage">Mortgage</option>
              <option value="personal">Personal Loan</option>
              <option value="credit-card">Credit Card</option>
              <option value="auto">Auto Loan</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton variant="ghost" @click="closeLoanModal">Cancel</UButton>
          <UButton :loading="isLoanSubmitting" @click="handleLoanSubmit">
            {{ editingLoan ? 'Update' : 'Add' }} Loan
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Savings Modal -->
    <UModal v-model:open="isSavingsModalOpen">
      <template #header>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          Add Savings Account
        </h3>
      </template>

      <template #body>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Name *</label>
            <input v-model="savingsFormState.name" type="text" placeholder="e.g., Emergency Fund, Vacation Fund, etc."
              required
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Balance *</label>
            <input v-model="savingsFormState.balance" type="number" step="0.01" min="0" placeholder="0.00" required
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Interest Rate (%)</label>
            <input v-model="savingsFormState.interestRate" type="number" step="0.01" min="0" placeholder="2.50"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Type</label>
            <select v-model="savingsFormState.accountType"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white">
              <option value="">Select type</option>
              <option value="high-yield">High Yield Savings</option>
              <option value="regular">Regular Savings</option>
              <option value="money-market">Money Market</option>
              <option value="cd">Certificate of Deposit</option>
              <option value="other">Other</option>
            </select>
          </div>
          <p class="text-sm text-gray-500">This feature is coming soon! For now, this will just close the modal.</p>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton variant="ghost" @click="closeSavingsModal">Cancel</UButton>
          <UButton @click="closeSavingsModal">Add (Coming Soon)</UButton>
        </div>
      </template>
    </UModal>

    <!-- Investment Modal -->
    <UModal v-model:open="isInvestmentModalOpen">
      <template #header>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          Add Investment Account
        </h3>
      </template>

      <template #body>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Name *</label>
            <input v-model="investmentFormState.name" type="text" placeholder="e.g., 401k, Roth IRA, Brokerage, etc."
              required
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Value *</label>
            <input v-model="investmentFormState.currentValue" type="number" step="0.01" min="0" placeholder="0.00"
              required
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Type</label>
            <select v-model="investmentFormState.accountType"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white">
              <option value="">Select type</option>
              <option value="401k">401(k)</option>
              <option value="roth-ira">Roth IRA</option>
              <option value="traditional-ira">Traditional IRA</option>
              <option value="brokerage">Brokerage Account</option>
              <option value="other">Other</option>
            </select>
          </div>
          <p class="text-sm text-gray-500">This feature is coming soon! For now, this will just close the modal.</p>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton variant="ghost" @click="closeInvestmentModal">Cancel</UButton>
          <UButton @click="closeInvestmentModal">Add (Coming Soon)</UButton>
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

// Financial tabs

const financialTabs = [
  { value: 'income', label: 'Income Sources', icon: 'i-heroicons-banknotes' },
  { value: 'loans', label: 'Loans & Debts', icon: 'i-heroicons-credit-card' },
  { value: 'savings', label: 'Savings', icon: 'i-heroicons-building-library' },
  { value: 'investments', label: 'Investments', icon: 'i-heroicons-chart-bar-square' }
]

const selectedTab = ref(financialTabs[0]?.value)

// Income sources
const { data: incomeSources, pending: incomeSourcesLoading, refresh: refreshIncomeSources } = await useFetch<IncomeSource[]>('/api/income-sources', {
  query: { personId },
  default: () => []
})

// Loans
const { data: loans, pending: loansLoading, refresh: refreshLoans } = await useFetch<any[]>('/api/loans', {
  query: { personId },
  default: () => []
})

// Savings accounts
const { data: savingsAccounts, pending: savingsLoading, refresh: refreshSavings } = await useFetch<any[]>('/api/savings-accounts', {
  query: { personId },
  default: () => []
})

// Broker accounts (investments)
const { data: brokerAccounts, pending: investmentsLoading, refresh: refreshInvestments } = await useFetch<any[]>('/api/broker-accounts', {
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

// Loans form state
const isLoanModalOpen = ref(false)
const isLoanSubmitting = ref(false)
const editingLoan = ref<any>(null)
const loanFormState = reactive({
  name: '',
  amount: '',
  interestRate: '',
  monthlyPayment: '',
  loanType: ''
})

// Savings form state
const isSavingsModalOpen = ref(false)
const isSavingsSubmitting = ref(false)
const editingSavings = ref<any>(null)
const savingsFormState = reactive({
  name: '',
  balance: '',
  interestRate: '',
  accountType: ''
})

// Investments form state
const isInvestmentModalOpen = ref(false)
const isInvestmentSubmitting = ref(false)
const editingInvestment = ref<any>(null)
const investmentFormState = reactive({
  name: '',
  currentValue: '',
  accountType: ''
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

const totalSavings = computed(() => {
  if (!savingsAccounts.value) return '0.00'
  return savingsAccounts.value
    .reduce((total, account) => total + parseFloat(account.currentBalance || 0), 0)
    .toFixed(2)
})

const totalInvestments = computed(() => {
  if (!brokerAccounts.value) return '0.00'
  return brokerAccounts.value
    .reduce((total, account) => total + parseFloat(account.currentValue || 0), 0)
    .toFixed(2)
})

const totalDebt = computed(() => {
  if (!loans.value) return '0.00'
  return loans.value
    .reduce((total, loan) => total + parseFloat(loan.currentBalance || 0), 0)
    .toFixed(2)
})

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
  editingLoan.value = null
  loanFormState.name = ''
  loanFormState.amount = ''
  loanFormState.interestRate = ''
  loanFormState.monthlyPayment = ''
  loanFormState.loanType = ''
  isLoanModalOpen.value = true
}

function closeLoanModal() {
  isLoanModalOpen.value = false
  editingLoan.value = null
}

async function handleLoanSubmit() {
  if (!loanFormState.name || !loanFormState.amount) return

  isLoanSubmitting.value = true

  try {
    const payload = {
      name: loanFormState.name.trim(),
      originalAmount: parseFloat(loanFormState.amount),
      currentBalance: parseFloat(loanFormState.amount),
      interestRate: parseFloat(loanFormState.interestRate) || 0,
      monthlyPayment: parseFloat(loanFormState.monthlyPayment) || 0,
      loanType: loanFormState.loanType,
      personId: parseInt(personId),
    }

    if (editingLoan.value) {
      await $fetch(`/api/loans/${editingLoan.value.id}`, {
        method: 'PUT',
        body: payload
      })
    } else {
      await $fetch('/api/loans', {
        method: 'POST',
        body: payload
      })
    }

    await refreshLoans()
    closeLoanModal()

    const toast = useToast()
    toast.add({
      title: editingLoan.value ? 'Loan updated' : 'Loan added',
      description: `${loanFormState.name} has been ${editingLoan.value ? 'updated' : 'added'} successfully.`,
      color: 'success'
    })
  } catch (error: unknown) {
    const toast = useToast()
    toast.add({
      title: 'Error',
      description: error instanceof Error ? error.message : 'An error occurred',
      color: 'error'
    })
  } finally {
    isLoanSubmitting.value = false
  }
}

function openSavingsModal() {
  editingSavings.value = null
  savingsFormState.name = ''
  savingsFormState.balance = ''
  savingsFormState.interestRate = ''
  savingsFormState.accountType = ''
  isSavingsModalOpen.value = true
}

function closeSavingsModal() {
  isSavingsModalOpen.value = false
  editingSavings.value = null
}

function openInvestmentModal() {
  editingInvestment.value = null
  investmentFormState.name = ''
  investmentFormState.currentValue = ''
  investmentFormState.accountType = ''
  isInvestmentModalOpen.value = true
}

function closeInvestmentModal() {
  isInvestmentModalOpen.value = false
  editingInvestment.value = null
}

// CRUD functions for loans
function editLoan(loan: any) {
  editingLoan.value = loan
  loanFormState.name = loan.name
  loanFormState.amount = loan.currentBalance
  loanFormState.interestRate = loan.interestRate
  loanFormState.loanType = loan.loanType
  isLoanModalOpen.value = true
}

async function deleteLoan(loan: any) {
  try {
    await $fetch(`/api/loans/${loan.id}`, { method: 'DELETE' })
    refreshLoans()
    const toast = useToast()
    toast.add({
      title: 'Loan deleted',
      description: `${loan.name} has been removed.`,
      color: 'success'
    })
  } catch (error) {
    const toast = useToast()
    toast.add({
      title: 'Error',
      description: 'Failed to delete loan',
      color: 'error'
    })
  }
}

// SEO
useHead({
  title: `${person.value?.name || 'Person'} - Financial Details`
})
</script>
