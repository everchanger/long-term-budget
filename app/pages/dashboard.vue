<template>
  <div>
    <!-- Page Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
          {{ $t("dashboard.title") }}
        </h1>
        <p class="mt-2 text-gray-600 dark:text-gray-400">
          {{ $t("dashboard.description") }}
        </p>
      </div>
      <div class="flex items-center gap-4">
        <UButton
          color="gray"
          icon="i-heroicons-arrow-right-on-rectangle"
          @click="handleSignOut"
        >
          {{ $t("auth.signOut") }}
        </UButton>
        <UButton icon="i-heroicons-plus" size="lg" @click="isModalOpen = true">
          {{ $t("dashboard.addUser") }}
        </UButton>
      </div>
    </div>

    <!-- Users List -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200">
            {{ $t("dashboard.allUsers", { count: users?.length || 0 }) }}
          </h2>
          <UButton
            v-if="users && users.length > 0"
            variant="soft"
            icon="i-heroicons-arrow-path"
            size="sm"
            @click="refresh()"
          >
            {{ $t("common.refresh") }}
          </UButton>
        </div>
      </template>

      <!-- Loading State -->
      <div v-if="pending" class="flex justify-center py-12">
        <div class="text-center">
          <div
            class="i-heroicons-arrow-path animate-spin text-3xl text-blue-600 mb-4"
          />
          <p class="text-gray-500 dark:text-gray-400">
            {{ $t("dashboard.loadingUsers") }}
          </p>
        </div>
      </div>

      <!-- Error State -->
      <UAlert
        v-else-if="error"
        icon="i-heroicons-exclamation-triangle"
        color="red"
        variant="subtle"
        :title="$t('dashboard.errorLoadingUsers')"
        :description="error.message"
      />

      <!-- Users Table -->
      <ClientOnly>
        <div v-if="!pending && !error">
          <UTable v-if="users && users.length > 0" :data="users" class="w-full">
            <template #actions-data="{ row }">
              <UDropdownMenu :items="getUserActions(row)">
                <UButton
                  variant="ghost"
                  icon="i-heroicons-ellipsis-horizontal-20-solid"
                />
              </UDropdownMenu>
            </template>

            <template #createdAt-data="{ row }">
              <span class="text-sm text-gray-500 dark:text-gray-400">
                {{ formatDate(row.createdAt) }}
              </span>
            </template>
          </UTable>

          <div v-else class="text-center py-12">
            <div
              class="i-heroicons-users text-6xl text-gray-400 mb-4 mx-auto"
            />
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {{ $t("dashboard.noUsers") }}
            </h3>
            <p class="text-gray-500 dark:text-gray-400 mb-6">
              {{ $t("dashboard.getStarted") }}
            </p>
            <UButton icon="i-heroicons-plus" @click="isModalOpen = true">
              {{ $t("dashboard.addFirstUser") }}
            </UButton>
          </div>
        </div>
      </ClientOnly>
    </UCard>

    <!-- Add User Modal -->
    <UModal v-model:open="isModalOpen">
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-medium">{{ $t("dashboard.addNewUser") }}</h3>
          <UButton
            variant="ghost"
            icon="i-heroicons-x-mark"
            @click="isModalOpen = false"
          />
        </div>
      </template>

      <template #body>
        <UForm
          :schema="userSchema"
          :state="newUser"
          class="space-y-4"
          @submit="createUser"
        >
          <div>
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >{{ $t("auth.name") }}</label
            >
            <UInput
              v-model="newUser.name"
              :placeholder="$t('dashboard.enterUserName')"
              icon="i-heroicons-user"
              required
            />
          </div>

          <div>
            <label
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >{{ $t("auth.email") }}</label
            >
            <UInput
              v-model="newUser.email"
              type="email"
              :placeholder="$t('dashboard.enterEmailAddress')"
              icon="i-heroicons-envelope"
              required
            />
          </div>
          <div class="flex justify-end space-x-3 pt-4">
            <UButton variant="soft" @click="isModalOpen = false">
              {{ $t("common.cancel") }}
            </UButton>
            <UButton type="submit" :loading="isCreating">
              {{ $t("dashboard.createUser") }}
            </UButton>
          </div>
        </UForm>
      </template>
    </UModal>

    <!-- Edit User Modal -->
    <UModal v-model="isEditModalOpen">
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-medium">{{ $t("dashboard.editUser") }}</h3>
          <UButton
            variant="ghost"
            icon="i-heroicons-x-mark"
            @click="isEditModalOpen = false"
          />
        </div>
      </template>

      <template #body>
        <UForm
          :schema="editUserSchema"
          :state="editingUser"
          class="space-y-4"
          @submit="updateUser"
        >
          <div class="space-y-2">
            <label
              for="edit-name"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >{{ $t("auth.name") }} *</label
            >
            <UInput
              id="edit-name"
              v-model="editingUser.name"
              :placeholder="$t('dashboard.enterUserName')"
              icon="i-heroicons-user"
            />
          </div>

          <div class="space-y-2">
            <label
              for="edit-email"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >{{ $t("auth.email") }} *</label
            >
            <UInput
              id="edit-email"
              v-model="editingUser.email"
              type="email"
              :placeholder="$t('dashboard.enterEmailAddress')"
              icon="i-heroicons-envelope"
            />
          </div>

          <div class="flex justify-end space-x-3 pt-4">
            <UButton variant="soft" @click="isEditModalOpen = false">
              {{ $t("common.cancel") }}
            </UButton>
            <UButton type="submit" :loading="isUpdating">
              {{ $t("dashboard.updateUser") }}
            </UButton>
          </div>
        </UForm>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import {
  insertUserSchema,
  updateUserSchema,
  type SelectUser,
} from "~~/database/validation-schemas";

// Types
type User = SelectUser;

// Page meta
definePageMeta({
  title: "Dashboard",
  middleware: "auth",
});

const toast = useToast();
const { signOut } = useAuth();
const { t } = useI18n();

// State
const isModalOpen = ref(false);
const isEditModalOpen = ref(false);
const isCreating = ref(false);
const isUpdating = ref(false);

const newUser = ref({
  name: "",
  email: "",
});

const editingUser = ref({
  id: 0,
  name: "",
  email: "",
});

// Schema for form validation
const userSchema = insertUserSchema.omit({ createdAt: true });
const editUserSchema = updateUserSchema;

// Fetch users
const {
  data: users,
  pending,
  error,
  refresh,
} = await useFetch<User[]>("/api/users");

// Actions for each user row
const getUserActions = (user: User) => [
  [
    {
      label: t("common.edit"),
      icon: "i-heroicons-pencil-square",
      click: () => editUser(user),
    },
  ],
  [
    {
      label: t("common.delete"),
      icon: "i-heroicons-trash",
      click: () => deleteUser(user),
    },
  ],
];

// Methods
const createUser = async () => {
  try {
    isCreating.value = true;

    await $fetch("/api/users", {
      method: "POST",
      body: newUser.value,
    });

    // Reset form and close modal
    newUser.value = { name: "", email: "" };
    isModalOpen.value = false;

    // Refresh the users list
    await refresh();

    // Show success toast
    toast.add({
      title: t("common.success"),
      description: t("dashboard.userCreatedSuccess"),
      color: "success",
    });
  } catch (error: any) {
    toast.add({
      title: t("common.error"),
      description: error.message || t("dashboard.failedToCreateUser"),
      color: "warning",
    });
  } finally {
    isCreating.value = false;
  }
};

const editUser = (user: User) => {
  editingUser.value = {
    id: user.id,
    name: user.name,
    email: user.email,
  };
  isEditModalOpen.value = true;
};

const updateUser = async () => {
  try {
    isUpdating.value = true;

    await $fetch(`/api/users/${editingUser.value.id}`, {
      method: "PUT",
      body: {
        name: editingUser.value.name,
        email: editingUser.value.email,
      },
    });

    isEditModalOpen.value = false;

    // Refresh the users list
    await refresh();

    // Show success toast
    toast.add({
      title: t("common.success"),
      description: t("dashboard.userUpdatedSuccess"),
      color: "success",
    });
  } catch (error: any) {
    toast.add({
      title: t("common.error"),
      description: error.message || t("dashboard.failedToUpdateUser"),
      color: "warning",
    });
  } finally {
    isUpdating.value = false;
  }
};

const deleteUser = async (user: User) => {
  try {
    await $fetch(`/api/users/${user.id}`, {
      method: "DELETE",
    });

    // Refresh the users list
    await refresh();

    // Show success toast
    toast.add({
      title: t("common.success"),
      description: t("dashboard.userDeletedSuccess", { name: user.name }),
      color: "success",
    });
  } catch (error: any) {
    toast.add({
      title: t("common.error"),
      description: error.message || t("dashboard.failedToDeleteUser"),
      color: "warning",
    });
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const handleSignOut = async () => {
  try {
    await signOut();
    await navigateTo("/auth");
  } catch (error) {
    console.error("Sign out error:", error);
  }
};
</script>
