<template>
  <div class="space-y-6">
    <!-- Loading State -->
    <div v-if="pending" class="text-center py-12">
      <UIcon name="i-heroicons-arrow-path" class="animate-spin h-8 w-8 text-neutral-400 mx-auto mb-4" />
      <p class="text-neutral-600 dark:text-neutral-400">Loading scenario...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-12">
      <UCard>
        <div class="space-y-4">
          <UIcon name="i-heroicons-exclamation-triangle" class="h-16 w-16 text-red-400 mx-auto" />
          <h3 class="text-lg font-medium text-red-900 dark:text-red-100">Error Loading Scenario</h3>
          <p class="text-red-600 dark:text-red-400">{{ error.message }}</p>
          <UButton to="/scenarios" color="neutral" variant="soft">
            Back to Scenarios
          </UButton>
        </div>
      </UCard>
    </div>

    <!-- Scenario Content -->
    <div v-else-if="scenarioData">
      <!-- Header -->
      <div class="flex justify-between items-start">
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <UButton
              to="/scenarios"
              variant="ghost"
              icon="i-heroicons-arrow-left"
              size="sm"
            >
              Back to Scenarios
            </UButton>
          </div>
          <h1 class="text-2xl font-bold text-neutral-900 dark:text-white">{{ scenarioData.name }}</h1>
          <p v-if="scenarioData.description" class="text-neutral-600 dark:text-neutral-400">
            {{ scenarioData.description }}
          </p>
          <p class="text-sm text-neutral-500 dark:text-neutral-400">
            {{ formatDateRange(scenarioData.startDate, scenarioData.endDate) }}
          </p>
        </div>
        
        <div class="flex items-center gap-2">
          <UButton
            @click="generateProjections"
            :loading="isGenerating"
            color="primary"
            icon="i-heroicons-calculator"
          >
            {{ hasProjections ? 'Regenerate' : 'Generate' }} Projections
          </UButton>
          <UDropdownMenu :items="scenarioActions">
            <UButton variant="ghost" icon="i-heroicons-ellipsis-vertical" />
          </UDropdownMenu>
        </div>
      </div>

      <!-- Scenario Status -->
      <UCard>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <UIcon 
              :name="hasProjections ? 'i-heroicons-check-circle' : 'i-heroicons-clock'" 
              :class="hasProjections ? 'text-green-500' : 'text-amber-500'"
              size="6"
            />
            <div>
              <p class="font-medium text-neutral-900 dark:text-white">
                {{ hasProjections ? 'Projections Available' : 'No Projections Yet' }}
              </p>
              <p class="text-sm text-neutral-600 dark:text-neutral-400">
                {{ hasProjections ? 
                  `Last updated ${new Date(scenarioData.createdAt).toLocaleDateString()}` : 
                  'Generate projections to see financial forecasts' 
                }}
              </p>
            </div>
          </div>
          
          <div v-if="hasProjections && projectionStats" class="text-right">
            <p class="text-sm text-neutral-500 dark:text-neutral-400">Net Worth Change</p>
            <p class="text-lg font-bold" :class="projectionStats.netWorthChange >= 0 ? 'text-green-600' : 'text-red-600'">
              {{ formatCurrency(projectionStats.netWorthChange) }}
            </p>
          </div>
        </div>
      </UCard>

      <!-- Modifications Section -->
      <div class="space-y-4">
        <div class="flex justify-between items-center">
          <h2 class="text-lg font-semibold text-neutral-900 dark:text-white">Scenario Modifications</h2>
          <UButton @click="openAddModificationModal" variant="soft" icon="i-heroicons-plus">
            Add Modification
          </UButton>
        </div>

        <div v-if="modifications.length > 0" class="space-y-3">
          <UCard v-for="mod in modifications" :key="mod.id">
            <div class="flex justify-between items-start">
              <div class="space-y-2">
                <div class="flex items-center gap-2">
                  <UBadge :color="getModificationTypeColor(mod.type)">
                    {{ formatModificationType(mod.type) }}
                  </UBadge>
                  <span class="text-sm text-neutral-500 dark:text-neutral-400">
                    ID: {{ mod.targetId }}
                  </span>
                </div>
                <p class="font-medium text-neutral-900 dark:text-white">
                  {{ mod.modification }}
                </p>
                <div class="flex items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400">
                  <span>Effective: {{ new Date(mod.effectiveDate).toLocaleDateString() }}</span>
                  <span>Type: {{ mod.targetType }}</span>
                </div>
              </div>
              <UButton
                @click="deleteModification(mod.id)"
                variant="ghost"
                color="error"
                icon="i-heroicons-trash"
                size="sm"
              />
            </div>
          </UCard>
        </div>

        <div v-else>
          <UCard>
            <div class="text-center py-8">
              <UIcon name="i-heroicons-adjustments-horizontal" class="mx-auto h-12 w-12 text-neutral-400 mb-4" />
              <h3 class="text-lg font-medium text-neutral-900 dark:text-white mb-2">No Modifications Yet</h3>
              <p class="text-neutral-600 dark:text-neutral-400 mb-4">
                Add modifications to model changes like salary increases, new expenses, loan payments, or investments.
              </p>
              <UButton @click="openAddModificationModal" color="primary" icon="i-heroicons-plus">
                Add Your First Modification
              </UButton>
            </div>
          </UCard>
        </div>
      </div>

      <!-- Projections Section -->
      <div v-if="hasProjections" class="space-y-4">
        <h2 class="text-lg font-semibold text-neutral-900 dark:text-white">Financial Projections</h2>
        
        <!-- Coming Soon: Charts and detailed projections -->
        <UCard>
          <div class="text-center py-8">
            <UIcon name="i-heroicons-chart-bar" class="mx-auto h-12 w-12 text-neutral-400 mb-4" />
            <h3 class="text-lg font-medium text-neutral-900 dark:text-white mb-2">Projection Visualizations</h3>
            <p class="text-neutral-600 dark:text-neutral-400">
              Charts and detailed financial projections will be displayed here.
            </p>
          </div>
        </UCard>
      </div>
    </div>

    <!-- Add Modification Modal -->
    <UModal v-model:open="isAddModificationModalOpen">
      <template #header>
        <h3 class="text-lg font-semibold text-neutral-900 dark:text-white">Add Scenario Modification</h3>
      </template>

      <template #body>
        <form @submit.prevent="handleAddModification" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Person <span class="text-red-500">*</span>
            </label>
            <USelect
              v-model="modificationForm.personId"
              :items="personOptions"
              placeholder="Select a household member"
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Modification Type <span class="text-red-500">*</span>
            </label>
            <USelect
              v-model="modificationForm.modificationType"
              :items="modificationTypeOptions"
              placeholder="Select modification type"
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Description <span class="text-red-500">*</span>
            </label>
            <UInput
              v-model="modificationForm.description"
              placeholder="e.g., Salary increase to $75,000"
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Amount <span class="text-red-500">*</span>
            </label>
            <UInput
              v-model="modificationForm.amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              required
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Effective Date <span class="text-red-500">*</span>
              </label>
              <UInput
                v-model="modificationForm.effectiveDate"
                type="date"
                required
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                End Date (Optional)
              </label>
              <UInput
                v-model="modificationForm.endDate"
                type="date"
              />
            </div>
          </div>

          <div class="flex justify-end space-x-3 pt-4">
            <UButton
              color="neutral"
              variant="soft"
              @click="closeAddModificationModal"
              type="button"
            >
              Cancel
            </UButton>
            <UButton
              type="submit"
              :loading="isAddingModification"
              icon="i-heroicons-plus"
            >
              Add Modification
            </UButton>
          </div>
        </form>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
// Page meta
definePageMeta({
  title: 'Scenario Details'
})

// Route params
const route = useRoute()
const scenarioId = computed(() => parseInt(route.params.id as string))

// Fetch scenario data
const { data: scenario, pending, error } = await useFetch(`/api/scenarios/${scenarioId.value}`)

// Fetch modifications
const { data: modificationsData, refresh: refreshModifications } = await useFetch(`/api/scenarios/${scenarioId.value}/modifications`)
const modifications = computed(() => Array.isArray(modificationsData.value) ? modificationsData.value : [])

// Fetch household members for modification form
const currentUserId = ref(1) // This should come from authentication
const { data: households } = await useFetch('/api/households')

const userHousehold = computed(() => {
  if (!households.value || !Array.isArray(households.value)) return null
  return households.value.find((h: any) => h.userId === currentUserId.value) || null
})

const householdId = computed(() => userHousehold.value?.id || null)

const { data: membersData } = await useFetch(() => 
  householdId.value ? `/api/households/${householdId.value}/persons` : '/api/households/0/persons'
)
const householdMembers = computed(() => {
  if (membersData.value && typeof membersData.value === 'object' && 'persons' in membersData.value) {
    return (membersData.value as any).persons || []
  }
  return []
})

// State
const isGenerating = ref(false)
const isAddModificationModalOpen = ref(false)
const isAddingModification = ref(false)
const hasProjections = ref(false) // Will be updated when we fetch projections
const projectionStats = ref<{ netWorthChange: number } | null>(null)

const modificationForm = reactive({
  personId: null,
  modificationType: '',
  description: '',
  amount: '',
  effectiveDate: '',
  endDate: ''
})

// Computed
const scenarioData = computed(() => {
  if (scenario.value && typeof scenario.value === 'object' && !Array.isArray(scenario.value) && 'name' in scenario.value) {
    return scenario.value as any
  }
  return null
})

const personOptions = computed(() => {
  if (Array.isArray(householdMembers.value) && householdMembers.value.length > 0) {
    return householdMembers.value.map((person: any) => ({
      label: person.name,
      value: person.id
    }))
  }
  return [{ label: 'No members found', value: null }]
})

const modificationTypeOptions = computed(() => {
  const options = [
    { label: 'Income Change', value: 'income_change' },
    { label: 'New Income Source', value: 'new_income' },
    { label: 'Remove Income Source', value: 'remove_income' },
    { label: 'Expense Change', value: 'expense_change' },
    { label: 'New Expense', value: 'new_expense' },
    { label: 'Remove Expense', value: 'remove_expense' },
    { label: 'New Loan', value: 'new_loan' },
    { label: 'Loan Payment Change', value: 'loan_payment_change' },
    { label: 'Pay Off Loan', value: 'payoff_loan' },
    { label: 'New Investment', value: 'new_investment' },
    { label: 'Investment Change', value: 'investment_change' },
    { label: 'Withdraw Investment', value: 'withdraw_investment' }
  ]
  return options
})

const scenarioActions = [
  [{
    label: 'Edit Scenario',
    icon: 'i-heroicons-pencil-square',
    click: () => console.log('Edit scenario')
  }],
  [{
    label: 'Delete Scenario',
    icon: 'i-heroicons-trash',
    click: () => console.log('Delete scenario')
  }]
]

// Methods
async function generateProjections() {
  isGenerating.value = true
  
  try {
    await $fetch(`/api/scenarios/${scenarioId.value}/projections`, {
      method: 'POST'
    })
    
    hasProjections.value = true
    // TODO: Fetch and display the generated projections
  } catch (error) {
    console.error('Failed to generate projections:', error)
  } finally {
    isGenerating.value = false
  }
}

function openAddModificationModal() {
  console.log('Opening modal, householdId:', householdId.value)
  console.log('Opening modal, householdMembers:', householdMembers.value)
  console.log('Opening modal, personOptions:', personOptions.value)
  isAddModificationModalOpen.value = true
  // Set default effective date to today
  modificationForm.effectiveDate = new Date().toISOString().split('T')[0] ?? ''
}

function closeAddModificationModal() {
  isAddModificationModalOpen.value = false
  Object.assign(modificationForm, {
    personId: null,
    modificationType: '',
    description: '',
    amount: '',
    effectiveDate: '',
    endDate: ''
  })
}

async function handleAddModification() {
  isAddingModification.value = true
  
  try {
    await $fetch(`/api/scenarios/${scenarioId.value}/modifications`, {
      method: 'POST',
      body: {
        personId: modificationForm.personId,
        modificationType: modificationForm.modificationType,
        description: modificationForm.description,
        amount: parseFloat(modificationForm.amount),
        effectiveDate: modificationForm.effectiveDate,
        endDate: modificationForm.endDate || null
      }
    })
    
    await refreshModifications()
    closeAddModificationModal()
  } catch (error) {
    console.error('Failed to add modification:', error)
  } finally {
    isAddingModification.value = false
  }
}

async function deleteModification(modificationId: number) {
  try {
    await $fetch(`/api/scenarios/${scenarioId.value}/modifications/${modificationId}`, {
      method: 'DELETE'
    })
    
    await refreshModifications()
  } catch (error) {
    console.error('Failed to delete modification:', error)
  }
}

// Utility functions
function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate).toLocaleDateString()
  const end = new Date(endDate).toLocaleDateString()
  return `${start} - ${end}`
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function formatModificationType(type: string): string {
  return type.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')
}

function getModificationTypeColor(type: string): "primary" | "success" | "error" | "neutral" {
  if (type.includes('income') || type.includes('investment')) return 'success'
  if (type.includes('expense') || type.includes('loan')) return 'error'
  return 'primary'
}
</script>
