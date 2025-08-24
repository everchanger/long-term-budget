<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-neutral-900 dark:text-white">Financial Scenarios</h1>
        <p class="text-neutral-600 dark:text-neutral-400">Model different financial strategies and compare their long-term impact</p>
      </div>
      <UButton @click="openCreateModal" color="primary" icon="i-heroicons-plus">
        Create Scenario
      </UButton>
    </div>

    <!-- Scenarios Grid -->
    <div v-if="scenarios.length > 0" class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <UCard 
        v-for="scenario in scenarios" 
        :key="scenario.id"
        class="hover:shadow-lg transition-shadow cursor-pointer"
        @click="navigateTo(`/scenarios/${scenario.id}`)"
      >
        <template #header>
          <div class="flex justify-between items-start">
            <div>
              <h3 class="text-lg font-semibold text-neutral-900 dark:text-white">{{ scenario.name }}</h3>
              <p class="text-sm text-neutral-600 dark:text-neutral-400">
                {{ formatDateRange(scenario.startDate, scenario.endDate) }}
              </p>
            </div>
            <UDropdownMenu :items="getScenarioActions(scenario)">
              <UButton variant="ghost" icon="i-heroicons-ellipsis-vertical" size="sm" @click.stop />
            </UDropdownMenu>
          </div>
        </template>

        <div class="space-y-3">
          <p v-if="scenario.description" class="text-neutral-700 dark:text-neutral-300 text-sm">
            {{ scenario.description }}
          </p>
          
          <!-- Scenario Status -->
          <div class="flex items-center gap-2">
            <UIcon 
              :name="hasProjections(scenario) ? 'i-heroicons-check-circle' : 'i-heroicons-clock'" 
              :class="hasProjections(scenario) ? 'text-green-500' : 'text-amber-500'"
              size="4"
            />
            <span class="text-sm text-neutral-600 dark:text-neutral-400">
              {{ hasProjections(scenario) ? 'Projections ready' : 'Not calculated yet' }}
            </span>
          </div>

          <!-- Quick Stats if projections exist -->
          <div v-if="getScenarioStats(scenario)" class="grid grid-cols-2 gap-3 pt-2 border-t">
            <div>
              <p class="text-xs text-neutral-500 dark:text-neutral-400">Net Worth Change</p>
              <p class="font-medium text-sm" :class="getScenarioStats(scenario)!.netWorthChange >= 0 ? 'text-green-600' : 'text-red-600'">
                {{ formatCurrency(getScenarioStats(scenario)!.netWorthChange) }}
              </p>
            </div>
            <div>
              <p class="text-xs text-neutral-500 dark:text-neutral-400">Projection Period</p>
              <p class="font-medium text-sm text-neutral-900 dark:text-neutral-100">
                {{ getScenarioStats(scenario)!.months }} months
              </p>
            </div>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-16">
      <UCard>
        <div class="space-y-6">
          <UIcon name="i-heroicons-chart-pie" class="mx-auto h-16 w-16 text-neutral-400" />
          <div>
            <h3 class="text-xl font-semibold text-neutral-900 dark:text-white mb-2">No Scenarios Yet</h3>
            <p class="text-neutral-600 dark:text-neutral-400 max-w-md mx-auto">
              Create your first financial scenario to model different strategies like paying off loans early, 
              increasing income, or making new investments.
            </p>
          </div>
          <UButton @click="openCreateModal" color="primary" icon="i-heroicons-plus" size="lg">
            Create Your First Scenario
          </UButton>
        </div>
      </UCard>
    </div>

    <!-- Create Scenario Modal -->
    <UModal v-model:open="isCreateModalOpen">
      <template #header>
        <h3 class="text-lg font-semibold text-neutral-900 dark:text-white">Create New Scenario</h3>
      </template>

      <template #body>
        <form @submit.prevent="handleCreateScenario" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Scenario Name <span class="text-red-500">*</span>
            </label>
            <UInput
              v-model="createForm.name"
              placeholder="e.g., Pay off car loan early"
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Description
            </label>
            <UTextarea
              v-model="createForm.description"
              placeholder="Describe what this scenario models..."
              :rows="3"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Start Date <span class="text-red-500">*</span>
              </label>
              <UInput
                v-model="createForm.startDate"
                type="date"
                required
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                End Date <span class="text-red-500">*</span>
              </label>
              <UInput
                v-model="createForm.endDate"
                type="date"
                required
              />
            </div>
          </div>

          <div class="flex justify-end space-x-3 pt-4">
            <UButton
              color="neutral"
              variant="soft"
              @click="closeCreateModal"
              type="button"
            >
              Cancel
            </UButton>
            <UButton
              type="submit"
              :loading="isCreating"
              icon="i-heroicons-plus"
            >
              Create Scenario
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
  title: 'Financial Scenarios'
})

// Types
interface Scenario {
  id: number
  householdId: number
  name: string
  description?: string | null
  startDate: string | Date
  endDate: string | Date
  createdAt: string | Date
}

// State
const scenarios = ref<Scenario[]>([])
const isCreateModalOpen = ref(false)
const isCreating = ref(false)
const createForm = reactive({
  name: '',
  description: '',
  startDate: '',
  endDate: ''
})

// Get user's household ID using the same pattern as households page
const currentUserId = ref(1) // This should come from authentication
const { data: households } = await useFetch('/api/households')

const userHousehold = computed(() => {
  if (!households.value || !Array.isArray(households.value)) return null
  return households.value.find((h: any) => h.userId === currentUserId.value) || null
})

const householdId = computed(() => userHousehold.value?.id || null)

// Fetch scenarios
async function fetchScenarios() {
  if (!householdId.value) return
  
  try {
    const response = await $fetch(`/api/scenarios?householdId=${householdId.value}`)
    scenarios.value = Array.isArray(response) ? response : []
  } catch (error) {
    console.error('Failed to fetch scenarios:', error)
  }
}

// Load scenarios on mount
onMounted(() => {
  fetchScenarios()
})

// Modal handlers
function openCreateModal() {
  isCreateModalOpen.value = true
  // Set default dates
  const today = new Date()
  const nextYear = new Date()
  nextYear.setFullYear(today.getFullYear() + 5)
  
  createForm.startDate = today.toISOString().split('T')[0] ?? ''
  createForm.endDate = nextYear.toISOString().split('T')[0] ?? ''
}

function closeCreateModal() {
  isCreateModalOpen.value = false
  Object.assign(createForm, {
    name: '',
    description: '',
    startDate: '',
    endDate: ''
  })
}

// Create scenario
async function handleCreateScenario() {
  if (!householdId.value) return
  
  isCreating.value = true
  
  try {
    const newScenario = await $fetch('/api/scenarios', {
      method: 'POST',
      body: {
        householdId: householdId.value,
        name: createForm.name,
        description: createForm.description,
        startDate: createForm.startDate,
        endDate: createForm.endDate
      }
    })
    
    if (newScenario && typeof newScenario === 'object' && 'id' in newScenario) {
      scenarios.value.push(newScenario as Scenario)
      closeCreateModal()
      // Navigate to the new scenario
      await navigateTo(`/scenarios/${newScenario.id}`)
    }
  } catch (error) {
    console.error('Failed to create scenario:', error)
  } finally {
    isCreating.value = false
  }
}

// Utility functions
function formatDateRange(startDate: string | Date, endDate: string | Date): string {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate
  return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function hasProjections(scenario: Scenario): boolean {
  // This would check if projections exist for this scenario
  // For now, return false since we haven't generated any yet
  return false
}

function getScenarioStats(scenario: Scenario): { netWorthChange: number; months: number } | null {
  // This would return calculated stats if projections exist
  // For now, return null since we haven't implemented projection stats yet
  return null
}

function getScenarioActions(scenario: Scenario) {
  return [
    [{
      label: 'View Details',
      icon: 'i-heroicons-eye',
      click: () => navigateTo(`/scenarios/${scenario.id}`)
    }],
    [{
      label: 'Delete',
      icon: 'i-heroicons-trash',
      click: () => deleteScenario(scenario.id)
    }]
  ]
}

async function deleteScenario(scenarioId: number) {
  // Implementation for deleting scenarios
  console.log('Delete scenario:', scenarioId)
}
</script>
