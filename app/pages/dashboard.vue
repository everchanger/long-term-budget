<template>
  <div>
    <!-- Page Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Users Dashboard</h1>
        <p class="mt-2 text-gray-600 dark:text-gray-400">
          Manage application users and their accounts
        </p>
      </div>
      <UButton @click="isModalOpen = true" icon="i-heroicons-plus" size="lg">
        Add User
      </UButton>
    </div>

    <!-- Users List -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200">
            All Users ({{ users?.length || 0 }})
          </h2>
          <UButton 
            v-if="users && users.length > 0"
            @click="refresh()" 
            color="gray" 
            variant="soft" 
            icon="i-heroicons-arrow-path"
            size="sm"
          >
            Refresh
          </UButton>
        </div>
      </template>
      
      <!-- Loading State -->
      <div v-if="pending" class="flex justify-center py-12">
        <div class="text-center">
          <div class="i-heroicons-arrow-path animate-spin text-3xl text-blue-600 mb-4"></div>
          <p class="text-gray-500 dark:text-gray-400">Loading users...</p>
        </div>
      </div>

      <!-- Error State -->
      <UAlert
        v-else-if="error"
        icon="i-heroicons-exclamation-triangle"
        color="red"
        variant="subtle"
        title="Error loading users"
        :description="error.message"
      />

      <!-- Users Table -->
      <ClientOnly>
        <div v-if="!pending && !error">
          <UTable 
            v-if="users && users.length > 0"
            :rows="users" 
            :columns="userColumns"
            class="w-full"
          >
            <template #actions-data="{ row }">
              <UDropdownMenu :items="getUserActions(row)">
                <UButton color="gray" variant="ghost" icon="i-heroicons-ellipsis-horizontal-20-solid" />
              </UDropdownMenu>
            </template>

            <template #createdAt-data="{ row }">
              <span class="text-sm text-gray-500 dark:text-gray-400">
                {{ formatDate(row.createdAt) }}
              </span>
            </template>
          </UTable>

          <div v-else class="text-center py-12">
            <div class="i-heroicons-users text-6xl text-gray-400 mb-4 mx-auto"></div>
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">No users yet</h3>
            <p class="text-gray-500 dark:text-gray-400 mb-6">Get started by adding your first user to the system.</p>
            <UButton @click="isModalOpen = true" icon="i-heroicons-plus">
              Add First User
            </UButton>
          </div>
        </div>
      </ClientOnly>
    </UCard>

    <!-- Add User Modal -->
    <UModal v-model="isModalOpen">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-medium">Add New User</h3>
            <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark" @click="isModalOpen = false" />
          </div>
        </template>

        <UForm 
          :schema="userSchema" 
          :state="newUser" 
          @submit="createUser"
          class="space-y-4"
        >
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
            <UInput 
              v-model="newUser.name" 
              placeholder="Enter user name"
              icon="i-heroicons-user"
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <UInput 
              v-model="newUser.email" 
              type="email"
              placeholder="Enter email address"
              icon="i-heroicons-envelope"
              required
            />
          </div>          <div class="flex justify-end space-x-3 pt-4">
            <UButton color="gray" variant="soft" @click="isModalOpen = false">
              Cancel
            </UButton>
            <UButton type="submit" :loading="isCreating">
              Create User
            </UButton>
          </div>
        </UForm>
      </UCard>
    </UModal>

    <!-- Edit User Modal -->
    <UModal v-model="isEditModalOpen">
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-medium">Edit User</h3>
            <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark" @click="isEditModalOpen = false" />
          </div>
        </template>

        <UForm 
          :schema="editUserSchema" 
          :state="editingUser" 
          @submit="updateUser"
          class="space-y-4"
        >
          <div class="space-y-2">
            <label for="edit-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Name *</label>
            <UInput 
              id="edit-name"
              v-model="editingUser.name" 
              placeholder="Enter user name"
              icon="i-heroicons-user"
            />
          </div>

          <div class="space-y-2">
            <label for="edit-email" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Email *</label>
            <UInput 
              id="edit-email"
              v-model="editingUser.email" 
              type="email"
              placeholder="Enter email address"
              icon="i-heroicons-envelope"
            />
          </div>

          <div class="flex justify-end space-x-3 pt-4">
            <UButton color="gray" variant="soft" @click="isEditModalOpen = false">
              Cancel
            </UButton>
            <UButton type="submit" :loading="isUpdating">
              Update User
            </UButton>
          </div>
        </UForm>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { insertUserSchema, updateUserSchema, type SelectUser } from '../../db/schemas'

// Types
type User = SelectUser

// Page meta
definePageMeta({
  title: 'Dashboard'
})

// State
const isModalOpen = ref(false)
const isEditModalOpen = ref(false)
const isCreating = ref(false)
const isUpdating = ref(false)

const newUser = ref({
  name: '',
  email: ''
})

const editingUser = ref({
  id: 0,
  name: '',
  email: ''
})

// Schema for form validation
const userSchema = insertUserSchema.omit({ createdAt: true })
const editUserSchema = updateUserSchema

// Table columns
const userColumns = [
  {
    key: 'id',
    label: 'ID',
    sortable: true
  },
  {
    key: 'name',
    label: 'Name',
    sortable: true
  },
  {
    key: 'email',
    label: 'Email',
    sortable: true
  },
  {
    key: 'createdAt',
    label: 'Created',
    sortable: true
  },
  {
    key: 'actions',
    label: 'Actions'
  }
]

// Fetch users
const { data: users, pending, error, refresh } = await useFetch<User[]>('/api/users')

// Actions for each user row
const getUserActions = (user: User) => [
  [{
    label: 'Edit',
    icon: 'i-heroicons-pencil-square',
    click: () => editUser(user)
  }],
  [{
    label: 'Delete',
    icon: 'i-heroicons-trash',
    click: () => deleteUser(user)
  }]
]

// Methods
const createUser = async () => {
  try {
    isCreating.value = true
    
    await $fetch('/api/users', {
      method: 'POST',
      body: newUser.value
    })

    // Reset form and close modal
    newUser.value = { name: '', email: '' }
    isModalOpen.value = false
    
    // Refresh the users list
    await refresh()
    
    // Show success toast
    $toast.add({
      title: 'Success',
      description: 'User created successfully',
      color: 'green'
    })
  } catch (error: any) {
    $toast.add({
      title: 'Error',
      description: error.message || 'Failed to create user',
      color: 'red'
    })
  } finally {
    isCreating.value = false
  }
}

const editUser = (user: User) => {
  editingUser.value = {
    id: user.id,
    name: user.name,
    email: user.email
  }
  isEditModalOpen.value = true
}

const updateUser = async () => {
  try {
    isUpdating.value = true
    
    await $fetch(`/api/users/${editingUser.value.id}`, {
      method: 'PUT',
      body: {
        name: editingUser.value.name,
        email: editingUser.value.email
      }
    })

    isEditModalOpen.value = false
    
    // Refresh the users list
    await refresh()
    
    // Show success toast
    $toast.add({
      title: 'Success',
      description: 'User updated successfully',
      color: 'green'
    })
  } catch (error: any) {
    $toast.add({
      title: 'Error',
      description: error.message || 'Failed to update user',
      color: 'red'
    })
  } finally {
    isUpdating.value = false
  }
}

const deleteUser = async (user: User) => {
  try {
    await $fetch(`/api/users/${user.id}`, {
      method: 'DELETE'
    })
    
    // Refresh the users list
    await refresh()
    
    // Show success toast
    $toast.add({
      title: 'Success',
      description: `User "${user.name}" deleted successfully`,
      color: 'green'
    })
  } catch (error: any) {
    $toast.add({
      title: 'Error',
      description: error.message || 'Failed to delete user',
      color: 'red'
    })
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>
