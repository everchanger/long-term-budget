<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Household Management</h1>
        <p class="text-gray-600 dark:text-gray-400">Create and manage your household</p>
      </div>
      <UButton 
        v-if="!userHousehold" 
        @click="openCreateModal" 
        color="primary" 
        icon="i-heroicons-plus"
      >
        Create Household
      </UButton>
    </div>

    <!-- User's Household Card -->
    <div v-if="userHousehold">
      <UCard>
        <template #header>
          <div class="flex justify-between items-center">
            <h2 class="text-lg font-semibold">{{ userHousehold.name }}</h2>
            <div class="flex space-x-2">
              <UButton @click="openEditModal" variant="ghost" icon="i-heroicons-pencil-square">
                Edit
              </UButton>
              <UButton @click="openDeleteModal" color="error" variant="ghost" icon="i-heroicons-trash">
                Delete
              </UButton>
            </div>
          </div>
        </template>

        <div class="space-y-4">
          <div>
            <p class="text-sm text-gray-600 dark:text-gray-400">Created</p>
            <p class="font-medium">{{ new Date(userHousehold.createdAt).toLocaleDateString() }}</p>
          </div>
          
          <div>
            <p class="text-sm text-gray-600 dark:text-gray-400">Members</p>
            <p class="font-medium">{{ householdMembersText }}</p>
          </div>

          <div v-if="householdMembers.length > 0">
            <div class="flex justify-between items-center mb-2">
              <p class="text-sm text-gray-600 dark:text-gray-400">Household Members</p>
              <UButton @click="openAddPersonModal" size="sm" variant="soft" icon="i-heroicons-plus">
                Add Member
              </UButton>
            </div>
            <div class="space-y-2">
              <div 
                v-for="member in householdMembers" 
                :key="member.id"
                class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-md"
              >
                <div>
                  <p class="font-medium">{{ member.name }}</p>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    {{ member.age ? `Age: ${member.age}` : 'Age not specified' }}
                  </p>
                </div>
                <div class="flex space-x-2">
                  <button 
                    @click="openEditPersonModal(member)"
                    class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                  >
                    Edit
                  </button>
                  <button 
                    @click="openDeletePersonModal(member)"
                    class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div v-else>
            <div class="text-center py-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md">
              <UIcon name="i-heroicons-user-group" class="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">No household members yet</p>
              <UButton @click="openAddPersonModal" size="sm" variant="soft" icon="i-heroicons-plus">
                Add First Member
              </UButton>
            </div>
          </div>

          <div class="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div class="flex justify-between items-center">
              <div>
                <p class="text-sm font-medium text-gray-900 dark:text-white">Financial Planning</p>
                <p class="text-sm text-gray-600 dark:text-gray-400">Manage budgets and scenarios</p>
              </div>
              <UButton to="/scenarios" variant="soft" icon="i-heroicons-chart-bar">
                View Scenarios
              </UButton>
            </div>
          </div>
        </div>
      </UCard>
    </div>

    <!-- No Household State -->
    <div v-else class="text-center py-12">
      <UCard>
        <div class="space-y-4">
          <UIcon name="i-heroicons-home" class="mx-auto h-16 w-16 text-gray-400" />
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">No Household Found</h3>
          <p class="text-gray-600 dark:text-gray-400">
            Create your household to start managing your financial planning. You can only have one household per account.
          </p>
          <UButton @click="openCreateModal" color="primary" icon="i-heroicons-plus">
            Create Your Household
          </UButton>
        </div>
      </UCard>
    </div>

    <!-- Create/Edit Household Modal -->
    <UModal v-model:open="isModalOpen">
      <template #header>
        <h3 class="text-lg font-semibold">
          {{ editingHousehold ? 'Edit Household' : 'Create Household' }}
        </h3>
      </template>

      <template #body>
        <div class="space-y-4">
          <div>
            <label for="household-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Household Name *
            </label>
            <input
              id="household-name"
              v-model="formState.name"
              type="text"
              placeholder="Enter household name (e.g., 'The Smith Family')"
              required
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          
          <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md">
            <div class="flex">
              <UIcon name="i-heroicons-information-circle" class="text-blue-400 mr-2 mt-0.5" />
              <div class="text-sm text-blue-700 dark:text-blue-300">
                <p class="font-medium">Note:</p>
                <p>You can only have one household per account. After creating your household, you can add family members and manage your financial planning together.</p>
              </div>
            </div>
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton variant="ghost" @click="closeModal">Cancel</UButton>
          <UButton 
            @click="handleSubmit" 
            :loading="isSubmitting"
            :disabled="!isFormValid"
          >
            {{ editingHousehold ? 'Update' : 'Create' }} Household
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Add/Edit Person Modal -->
    <UModal v-model:open="isPersonModalOpen">
      <template #header>
        <h3 class="text-lg font-semibold">
          {{ editingPerson ? 'Edit Member' : 'Add Member' }}
        </h3>
      </template>

      <template #body>
        <div class="space-y-4">
          <div>
            <label for="person-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name *
            </label>
            <input
              id="person-name"
              v-model="personFormState.name"
              type="text"
              placeholder="Enter person's name"
              required
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label for="person-age" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Age
            </label>
            <input
              id="person-age"
              v-model="personFormState.age"
              type="number"
              placeholder="Enter age (optional)"
              min="0"
              max="120"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton variant="ghost" @click="closePersonModal">Cancel</UButton>
          <UButton 
            @click="handlePersonSubmit" 
            :loading="isPersonSubmitting"
            :disabled="!isPersonFormValid"
          >
            {{ editingPerson ? 'Update' : 'Add' }} Member
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Delete Confirmation Modal -->
    <UModal v-model:open="isDeleteModalOpen">
      <template #header>
        <h3 class="text-lg font-semibold text-red-600">Delete Household</h3>
      </template>

      <template #body>
        <div class="space-y-3">
          <p>Are you sure you want to delete <strong>{{ userHousehold?.name }}</strong>?</p>
          <div class="bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
            <div class="flex">
              <UIcon name="i-heroicons-exclamation-triangle" class="text-red-400 mr-2 mt-0.5" />
              <div class="text-sm text-red-700 dark:text-red-300">
                <p class="font-medium">Warning:</p>
                <p>This action cannot be undone. All household members, financial data, and scenarios will be permanently deleted.</p>
              </div>
            </div>
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton variant="ghost" @click="closeDeleteModal">Cancel</UButton>
          <UButton 
            color="error" 
            @click="confirmDelete"
            :loading="isDeleting"
          >
            Delete Household
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Delete Person Confirmation Modal -->
    <UModal v-model:open="isDeletePersonModalOpen">
      <template #header>
        <h3 class="text-lg font-semibold text-red-600">Delete Member</h3>
      </template>

      <template #body>
        <div class="space-y-3">
          <p>Are you sure you want to delete <strong>{{ personToDelete?.name }}</strong>?</p>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            This action cannot be undone. All associated financial data will also be removed.
          </p>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton variant="ghost" @click="closeDeletePersonModal">Cancel</UButton>
          <UButton 
            color="error" 
            @click="confirmPersonDelete"
            :loading="isDeletingPerson"
          >
            Delete Member
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
// Page metadata
definePageMeta({
  title: 'Households'
})

// Types
interface Household {
  id: number
  name: string
  userId: number
  createdAt: string
  ownerName: string | null
}

interface Person {
  id: number
  name: string
  age: number | null
  householdId: number
}

// Reactive state
const isModalOpen = ref(false)
const isDeleteModalOpen = ref(false)
const isSubmitting = ref(false)
const isDeleting = ref(false)
const editingHousehold = ref(false)

// Person management state
const isPersonModalOpen = ref(false)
const isDeletePersonModalOpen = ref(false)
const isPersonSubmitting = ref(false)
const isDeletingPerson = ref(false)
const editingPerson = ref<Person | null>(null)
const personToDelete = ref<Person | null>(null)

// Form state
const formState = reactive({
  name: ''
})

// Person form state
const personFormState = reactive({
  name: '',
  age: null as number | null
})

// Mock current user ID (in a real app, this would come from auth)
const currentUserId = ref(1) // This should come from authentication

// Fetch data
const { data: households, pending, refresh } = await useFetch('/api/households')
const { data: persons, refresh: refreshPersons } = await useFetch('/api/persons')

// Computed properties
const userHousehold = computed(() => {
  if (!households.value || !Array.isArray(households.value)) return null
  return households.value.find((h: Household) => h.userId === currentUserId.value) || null
})

const householdMembers = computed(() => {
  if (!userHousehold.value || !persons.value || !Array.isArray(persons.value)) return []
  return persons.value.filter((p: Person) => p.householdId === userHousehold.value!.id)
})

const householdMembersCount = computed(() => householdMembers.value.length)

const householdMembersText = computed(() => {
  const count = householdMembersCount.value
  if (count === 1) {
    return '1 person'
  } else {
    return `${count} people`
  }
})

const isFormValid = computed(() => {
  return formState.name.trim() !== ''
})

const isPersonFormValid = computed(() => {
  return personFormState.name.trim() !== ''
})

// Methods
function openCreateModal() {
  editingHousehold.value = false
  resetForm()
  isModalOpen.value = true
}

function openEditModal() {
  if (!userHousehold.value) return
  editingHousehold.value = true
  formState.name = userHousehold.value.name
  isModalOpen.value = true
}

function closeModal() {
  isModalOpen.value = false
  editingHousehold.value = false
  resetForm()
}

function resetForm() {
  formState.name = ''
}

function openDeleteModal() {
  isDeleteModalOpen.value = true
}

function closeDeleteModal() {
  isDeleteModalOpen.value = false
}

async function handleSubmit() {
  if (!isFormValid.value) return

  isSubmitting.value = true
  
  try {
    const payload = {
      name: formState.name.trim(),
      user_id: currentUserId.value
    }

    if (editingHousehold.value && userHousehold.value) {
      // Update existing household
      await $fetch(`/api/households/${userHousehold.value.id}`, {
        method: 'PUT',
        body: { name: payload.name }
      })
    } else {
      // Create new household
      await $fetch('/api/households', {
        method: 'POST',
        body: payload
      })
    }

    await refresh()
    closeModal()
    
    // Show success notification
    const toast = useToast()
    toast.add({
      title: editingHousehold.value ? 'Household updated' : 'Household created',
      description: `${formState.name} has been ${editingHousehold.value ? 'updated' : 'created'} successfully.`,
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
    isSubmitting.value = false
  }
}

async function confirmDelete() {
  if (!userHousehold.value) return

  isDeleting.value = true
  
  try {
    await $fetch(`/api/households/${userHousehold.value.id}`, {
      method: 'DELETE'
    })

    await refresh()
    closeDeleteModal()
    
    // Show success notification
    const toast = useToast()
    toast.add({
      title: 'Household deleted',
      description: `${userHousehold.value.name} has been removed.`,
      color: 'success'
    })
  } catch (error: any) {
    const toast = useToast()
    toast.add({
      title: 'Error',
      description: error.data?.message || 'Failed to delete household',
      color: 'error'
    })
  } finally {
    isDeleting.value = false
  }
}

// Person Management Methods
function openAddPersonModal() {
  editingPerson.value = null
  resetPersonForm()
  isPersonModalOpen.value = true
}

function openEditPersonModal(person: Person) {
  editingPerson.value = person
  personFormState.name = person.name
  personFormState.age = person.age
  isPersonModalOpen.value = true
}

function closePersonModal() {
  isPersonModalOpen.value = false
  editingPerson.value = null
  resetPersonForm()
}

function resetPersonForm() {
  personFormState.name = ''
  personFormState.age = null
}

function openDeletePersonModal(person: Person) {
  personToDelete.value = person
  isDeletePersonModalOpen.value = true
}

function closeDeletePersonModal() {
  isDeletePersonModalOpen.value = false
  personToDelete.value = null
}

async function handlePersonSubmit() {
  if (!isPersonFormValid.value || !userHousehold.value) return

  isPersonSubmitting.value = true
  
  try {
    const payload = {
      name: personFormState.name.trim(),
      age: personFormState.age,
      household_id: userHousehold.value.id
    }

    if (editingPerson.value) {
      // Update existing person
      await $fetch(`/api/persons/${editingPerson.value.id}`, {
        method: 'PUT',
        body: payload
      })
    } else {
      // Create new person
      await $fetch('/api/persons', {
        method: 'POST',
        body: payload
      })
    }

    await refreshPersons()
    closePersonModal()
    
    // Show success notification
    const toast = useToast()
    toast.add({
      title: editingPerson.value ? 'Member updated' : 'Member added',
      description: `${personFormState.name} has been ${editingPerson.value ? 'updated' : 'added'} successfully.`,
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
    isPersonSubmitting.value = false
  }
}

async function confirmPersonDelete() {
  if (!personToDelete.value) return

  isDeletingPerson.value = true
  
  try {
    await $fetch(`/api/persons/${personToDelete.value.id}`, {
      method: 'DELETE'
    })

    await refreshPersons()
    closeDeletePersonModal()
    
    // Show success notification
    const toast = useToast()
    toast.add({
      title: 'Member deleted',
      description: `${personToDelete.value.name} has been removed.`,
      color: 'success'
    })
  } catch (error: any) {
    const toast = useToast()
    toast.add({
      title: 'Error',
      description: error.data?.message || 'Failed to delete member',
      color: 'error'
    })
  } finally {
    isDeletingPerson.value = false
  }
}
</script>
