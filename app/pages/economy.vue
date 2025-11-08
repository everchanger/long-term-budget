<template>
  <div>
    <div class="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-neutral-900 dark:text-white">
            Your Economy Overview
          </h1>
        </div>

        <!-- Main Content -->
        <div v-if="userHousehold" class="space-y-6">
          <!-- Overview Stats -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            <div>
              <p class="text-sm text-neutral-600 dark:text-neutral-400">
                Created
              </p>
              <p class="font-semibold text-lg text-neutral-900 dark:text-white">
                {{ new Date(userHousehold.createdAt).toLocaleDateString() }}
              </p>
            </div>

            <div>
              <p class="text-sm text-neutral-600 dark:text-neutral-400">
                Members
              </p>
              <p class="font-semibold text-lg text-neutral-900 dark:text-white">
                {{ householdMembersText }}
              </p>
            </div>

            <div v-if="financialSummary">
              <p class="text-sm text-neutral-600 dark:text-neutral-400">
                Net Worth
              </p>
              <p
                class="font-semibold text-lg"
                :class="
                  netWorth >= 0
                    ? 'text-neutral-900 dark:text-neutral-100'
                    : 'text-neutral-700 dark:text-neutral-300'
                "
              >
                ${{ netWorth.toLocaleString() }}
              </p>
            </div>

            <div>
              <p class="text-sm text-neutral-600 dark:text-neutral-400">
                Planning
              </p>
              <UButton
                to="/scenarios"
                variant="ghost"
                size="sm"
                class="p-0 h-auto text-left justify-start font-semibold text-lg"
              >
                View Scenarios
              </UButton>
            </div>
          </div>

          <!-- Members Section -->
          <div
            class="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700"
          >
            <div
              class="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <div
                    class="w-8 h-8 bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center mr-3"
                  >
                    <UIcon
                      name="i-heroicons-users"
                      class="w-4 h-4 text-neutral-600 dark:text-neutral-400"
                    />
                  </div>
                  <h3
                    class="text-lg font-medium text-neutral-900 dark:text-white"
                  >
                    Members
                  </h3>
                </div>
                <UButton
                  v-if="householdMembers.length > 0"
                  size="sm"
                  variant="soft"
                  icon="i-heroicons-plus"
                  @click="openAddPersonModal"
                >
                  Add Member
                </UButton>
              </div>
            </div>

            <div class="p-6">
              <div v-if="householdMembers.length > 0" class="space-y-4">
                <div
                  v-for="member in householdMembers"
                  :key="member.id"
                  class="p-6 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div class="flex items-center mb-4 sm:mb-0">
                    <div
                      class="w-12 h-12 bg-neutral-200 dark:bg-neutral-700 rounded-full flex items-center justify-center mr-4"
                    >
                      <span
                        class="text-neutral-700 dark:text-neutral-300 font-semibold"
                        >{{ member.name.charAt(0).toUpperCase() }}</span
                      >
                    </div>
                    <div class="flex-grow">
                      <p
                        class="font-semibold text-lg text-neutral-900 dark:text-white"
                      >
                        {{ member.name }}
                      </p>
                      <p class="text-sm text-neutral-600 dark:text-neutral-400">
                        {{
                          member.age
                            ? `Age: ${member.age}`
                            : "Age not specified"
                        }}
                      </p>
                    </div>
                  </div>
                  <div class="flex flex-col sm:flex-row gap-3 sm:justify-end">
                    <UButton
                      :to="`/persons/${member.id}`"
                      size="lg"
                      variant="solid"
                      icon="i-heroicons-chart-bar"
                      class="w-full sm:w-auto justify-center"
                    >
                      Manage Finances
                    </UButton>
                    <UButton
                      size="lg"
                      variant="soft"
                      color="error"
                      icon="i-heroicons-trash"
                      class="w-full sm:w-auto justify-center"
                      @click="openDeletePersonModal(member)"
                      >Delete</UButton
                    >
                  </div>
                </div>
              </div>

              <div v-else class="text-center py-12">
                <div
                  class="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <UIcon
                    name="i-heroicons-user-group"
                    class="w-8 h-8 text-neutral-400"
                  />
                </div>
                <h4
                  class="text-lg font-medium text-neutral-900 dark:text-white mb-2"
                >
                  No members yet
                </h4>
                <p class="text-neutral-600 dark:text-neutral-400 mb-6">
                  Add your first member to get started
                </p>
                <UButton
                  variant="soft"
                  icon="i-heroicons-plus"
                  @click="openAddPersonModal"
                >
                  Add First Member
                </UButton>
              </div>
            </div>
          </div>

          <!-- Financial Summary Section -->
          <div
            v-if="financialSummary && householdMembers.length > 0"
            class="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700"
          >
            <div
              class="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700"
            >
              <div class="flex items-center">
                <div
                  class="w-8 h-8 bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center mr-3"
                >
                  <UIcon
                    name="i-heroicons-chart-bar"
                    class="w-4 h-4 text-neutral-600 dark:text-neutral-400"
                  />
                </div>
                <div>
                  <h3
                    class="text-lg font-medium text-neutral-900 dark:text-white"
                  >
                    Financial Overview
                  </h3>
                  <p class="text-sm text-neutral-600 dark:text-neutral-400">
                    Combined finances for all members
                  </p>
                </div>
              </div>
            </div>

            <div class="p-6">
              <div
                class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6"
              >
                <!-- Monthly Income -->
                <div
                  class="bg-neutral-50 dark:bg-neutral-900 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700"
                >
                  <div>
                    <p
                      class="text-sm font-medium text-neutral-600 dark:text-neutral-400"
                    >
                      Monthly Income
                    </p>
                    <p
                      class="text-2xl font-bold text-neutral-900 dark:text-white"
                    >
                      ${{
                        financialSummary.totalMonthlyIncome.toLocaleString()
                      }}
                    </p>
                    <p class="text-xs text-neutral-500 dark:text-neutral-500">
                      ${{ financialSummary.totalAnnualIncome.toLocaleString() }}
                      annually
                    </p>
                  </div>
                </div>

                <!-- Total Savings -->
                <div
                  class="bg-neutral-50 dark:bg-neutral-900 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700"
                >
                  <div>
                    <p
                      class="text-sm font-medium text-neutral-600 dark:text-neutral-400"
                    >
                      Total Savings
                    </p>
                    <p
                      class="text-2xl font-bold text-neutral-900 dark:text-white"
                    >
                      ${{ financialSummary.totalSavings.toLocaleString() }}
                    </p>
                    <p class="text-xs text-neutral-500 dark:text-neutral-500">
                      {{ financialSummary.savingsAccountsCount }} accounts
                    </p>
                  </div>
                </div>

                <!-- Total Debt -->
                <div
                  class="bg-neutral-50 dark:bg-neutral-900 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700"
                >
                  <div>
                    <p
                      class="text-sm font-medium text-neutral-600 dark:text-neutral-400"
                    >
                      Total Debt
                    </p>
                    <p
                      class="text-2xl font-bold text-neutral-900 dark:text-white"
                    >
                      ${{ financialSummary.totalDebt.toLocaleString() }}
                    </p>
                    <p class="text-xs text-neutral-500 dark:text-neutral-500">
                      {{ financialSummary.loansCount }} loans
                    </p>
                  </div>
                </div>
              </div>

              <!-- Net Worth Summary -->
              <div
                class="bg-neutral-50 dark:bg-neutral-800 p-6 rounded-lg border border-neutral-200 dark:border-neutral-700"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center">
                    <div
                      class="w-12 h-12 bg-neutral-100 dark:bg-neutral-700 rounded-xl flex items-center justify-center mr-4"
                    >
                      <UIcon
                        name="i-heroicons-trophy"
                        class="w-6 h-6 text-neutral-600 dark:text-neutral-400"
                      />
                    </div>
                    <div>
                      <p
                        class="text-lg font-medium text-neutral-900 dark:text-white"
                      >
                        Estimated Net Worth
                      </p>
                      <p class="text-sm text-neutral-600 dark:text-neutral-400">
                        (Savings - Debt)
                      </p>
                    </div>
                  </div>
                  <p
                    class="text-3xl font-bold text-neutral-900 dark:text-neutral-100"
                  >
                    ${{ netWorth.toLocaleString() }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Savings Goals Section -->
          <div
            v-if="userHousehold && householdMembers.length > 0"
            class="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700"
          >
            <div
              class="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <div
                    class="w-8 h-8 bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center mr-3"
                  >
                    <UIcon
                      name="i-heroicons-flag"
                      class="w-4 h-4 text-neutral-600 dark:text-neutral-400"
                    />
                  </div>
                  <div>
                    <h3
                      class="text-lg font-medium text-neutral-900 dark:text-white"
                    >
                      Savings Goals
                    </h3>
                    <p class="text-sm text-neutral-600 dark:text-neutral-400">
                      Track your financial objectives
                    </p>
                  </div>
                </div>
                <UButton
                  size="sm"
                  variant="soft"
                  icon="i-heroicons-plus"
                  @click="() => openSavingsGoalModal()"
                >
                  Add Goal
                </UButton>
              </div>
            </div>

            <div class="p-6">
              <div v-if="savingsGoalsLoading" class="text-center py-8">
                <UIcon
                  name="i-heroicons-arrow-path"
                  class="animate-spin h-6 w-6 mx-auto mb-2 text-neutral-600"
                />
                <p class="text-sm text-neutral-600 dark:text-neutral-400">
                  Loading goals...
                </p>
              </div>

              <div v-else-if="activeGoals.length > 0" class="space-y-4">
                <div
                  v-for="goal in activeGoals"
                  :key="goal.id"
                  class="p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700"
                >
                  <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center">
                      <div class="mr-3">
                        <h4
                          class="font-semibold text-neutral-900 dark:text-white"
                        >
                          {{ goal.name }}
                        </h4>
                        <p
                          v-if="goal.description"
                          class="text-sm text-neutral-600 dark:text-neutral-400"
                        >
                          {{ goal.description }}
                        </p>
                      </div>
                      <div v-if="goal.priority" class="flex items-center">
                        <UBadge
                          :color="
                            goal.priority === 3
                              ? 'error'
                              : goal.priority === 2
                              ? 'warning'
                              : 'success'
                          "
                          size="sm"
                        >
                          {{
                            goal.priority === 3
                              ? "High"
                              : goal.priority === 2
                              ? "Medium"
                              : "Low"
                          }}
                          Priority
                        </UBadge>
                      </div>
                    </div>
                    <div class="flex items-center space-x-2">
                      <UButton
                        size="sm"
                        variant="ghost"
                        icon="i-heroicons-pencil"
                        @click="editSavingsGoal(goal)"
                      />
                      <UButton
                        size="sm"
                        variant="ghost"
                        color="error"
                        icon="i-heroicons-trash"
                        @click="deleteSavingsGoal(goal.id)"
                      />
                    </div>
                  </div>

                  <!-- Progress Bar -->
                  <div class="mb-3">
                    <div class="flex justify-between text-sm mb-1">
                      <span class="text-neutral-600 dark:text-neutral-400"
                        >Progress</span
                      >
                      <span class="font-medium"
                        >{{ getGoalProgress(goal).toFixed(1) }}%</span
                      >
                    </div>
                    <div
                      class="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2"
                    >
                      <div
                        class="bg-neutral-600 dark:bg-neutral-400 h-2 rounded-full transition-all duration-300"
                        :style="{
                          width: `${Math.min(getGoalProgress(goal), 100)}%`,
                        }"
                      />
                    </div>
                    <div
                      class="flex justify-between text-xs text-neutral-500 dark:text-neutral-500 mt-1"
                    >
                      <span>${{ goal.currentAmount.toLocaleString() }}</span>
                      <span
                        >${{
                          parseFloat(goal.targetAmount).toLocaleString()
                        }}</span
                      >
                    </div>
                  </div>

                  <!-- Goal Details -->
                  <div class="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p class="text-neutral-600 dark:text-neutral-400">
                        Remaining
                      </p>
                      <p class="font-medium">
                        ${{ getRemainingAmount(goal).toLocaleString() }}
                      </p>
                    </div>
                    <div v-if="goal.category">
                      <p class="text-neutral-600 dark:text-neutral-400">
                        Category
                      </p>
                      <p class="font-medium capitalize">
                        {{ goal.category.replace("-", " ") }}
                      </p>
                    </div>
                    <div
                      v-if="
                        financialSummary &&
                        financialSummary.totalMonthlyIncome > 0
                      "
                    >
                      <p class="text-neutral-600 dark:text-neutral-400">
                        Time to Goal
                      </p>
                      <p class="font-medium">
                        {{ getEstimatedCompletionTime(goal) || "N/A" }}
                      </p>
                    </div>
                  </div>

                  <!-- Quick Actions -->
                  <div
                    class="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700"
                  >
                    <div class="flex items-center justify-between">
                      <div class="flex items-center space-x-2">
                        <UButton
                          v-if="getGoalProgress(goal) >= 100"
                          size="sm"
                          variant="soft"
                          color="success"
                          @click="markGoalAsCompleted(goal)"
                        >
                          Mark Complete
                        </UButton>
                      </div>
                      <p class="text-xs text-neutral-500 dark:text-neutral-500">
                        Created
                        {{ new Date(goal.createdAt).toLocaleDateString() }}
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Summary Stats -->
                <div
                  class="mt-6 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700"
                >
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="text-center">
                      <p
                        class="text-2xl font-bold text-neutral-900 dark:text-neutral-100"
                      >
                        ${{ totalTargetAmount }}
                      </p>
                      <p class="text-sm text-neutral-600 dark:text-neutral-400">
                        Total Goal Amount
                      </p>
                    </div>
                    <div class="text-center">
                      <p
                        class="text-2xl font-bold text-neutral-900 dark:text-neutral-100"
                      >
                        ${{ totalCurrentAmount }}
                      </p>
                      <p class="text-sm text-neutral-600 dark:text-neutral-400">
                        Total Saved
                      </p>
                    </div>
                    <div class="text-center">
                      <p
                        class="text-2xl font-bold text-neutral-900 dark:text-neutral-100"
                      >
                        {{ totalProgress.toFixed(1) }}%
                      </p>
                      <p class="text-sm text-neutral-600 dark:text-neutral-400">
                        Overall Progress
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div v-else class="text-center py-12">
                <div
                  class="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <UIcon
                    name="i-heroicons-flag"
                    class="w-8 h-8 text-neutral-600 dark:text-neutral-400"
                  />
                </div>
                <h4
                  class="text-lg font-medium text-neutral-900 dark:text-white mb-2"
                >
                  No savings goals yet
                </h4>
                <p class="text-neutral-600 dark:text-neutral-400 mb-6">
                  Set your first savings goal to start tracking your progress
                </p>
                <UButton
                  variant="soft"
                  icon="i-heroicons-plus"
                  @click="() => openSavingsGoalModal()"
                >
                  Create First Goal
                </UButton>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Savings Goal Modal -->
      <SavingsGoalModal
        v-model:open="isSavingsGoalModalOpen"
        :household-id="userHousehold?.id"
        :loading="isSavingsGoalSubmitting"
        :editing-goal="editingSavingsGoal"
        @submit="handleSavingsGoalSubmit"
        @cancel="closeSavingsGoalModal"
      />

      <!-- Add/Edit Person Modal -->
      <UModal v-model:open="isPersonModalOpen">
        <template #header>
          <h3 class="text-lg font-semibold">
            {{ editingPerson ? "Edit Member" : "Add Member" }}
          </h3>
        </template>

        <template #body>
          <div class="space-y-4">
            <div>
              <label
                for="person-name"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
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
              <label
                for="person-age"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
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
              :loading="isPersonSubmitting"
              :disabled="!isPersonFormValid"
              @click="handlePersonSubmit"
            >
              {{ editingPerson ? "Update" : "Add" }} Member
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
            <p>
              Are you sure you want to delete
              <strong>{{ personToDelete?.name }}</strong
              >?
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              This action cannot be undone. All associated financial data will
              also be removed.
            </p>
          </div>
        </template>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton variant="ghost" @click="closeDeletePersonModal"
              >Cancel</UButton
            >
            <UButton
              color="error"
              :loading="isDeletingPerson"
              @click="confirmPersonDelete"
            >
              Delete Member
            </UButton>
          </div>
        </template>
      </UModal>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ApiSuccessResponse } from "~~/server/utils/api-response";

// Page metadata
definePageMeta({
  title: "Economy",
  requiresAuth: true,
});

// Types
interface Household {
  id: number;
  name: string;
  createdAt: string;
}

interface Person {
  id: number;
  name: string;
  age: number | null;
  householdId: number;
}

interface FinancialSummary {
  totalMonthlyIncome: number;
  totalAnnualIncome: number;
  totalSavings: number;
  totalDebt: number;
  memberCount: number;
  incomeSourcesCount: number;
  loansCount: number;
  savingsAccountsCount: number;
}

// Reactive state
const isPersonModalOpen = ref(false);
const isDeletePersonModalOpen = ref(false);
const isPersonSubmitting = ref(false);
const isDeletingPerson = ref(false);
const editingPerson = ref<Person | null>(null);
const personToDelete = ref<Person | null>(null);

// Person form state
const personFormState = reactive({
  name: "",
  age: null as number | null,
});

// Note: This is now only used for person creation, household filtering is done by the API

// Fetch data
const { data: householdsResponse } = await useFetch<
  ApiSuccessResponse<Household[]>
>("/api/households");
const households = computed(() => householdsResponse.value?.data ?? []);

const { data: personsResponse, refresh: refreshPersons } = await useFetch<
  ApiSuccessResponse<Person[]>
>("/api/persons");
const persons = computed(() => personsResponse.value?.data ?? []);

// Computed properties
const userHousehold = computed(() => {
  // Since the API now returns only the current user's households, just take the first one
  if (
    !households.value ||
    !Array.isArray(households.value) ||
    households.value.length === 0
  )
    return null;
  return households.value[0] || null;
});

const householdMembers = computed(() => {
  if (!userHousehold.value || !persons.value || !Array.isArray(persons.value))
    return [];
  return persons.value.filter(
    (p: Person) => p.householdId === userHousehold.value!.id
  );
});

const householdMembersCount = computed(() => householdMembers.value.length);

// Fetch financial summary for the household - using watchEffect to handle reactivity properly
const financialSummary = ref<FinancialSummary | null>(null);
const refreshFinancialSummary = async () => {
  if (userHousehold.value) {
    try {
      const response = await $fetch<ApiSuccessResponse<FinancialSummary>>(
        `/api/households/${userHousehold.value.id}/financial-summary`
      );
      financialSummary.value = response.data;
    } catch (error) {
      console.error("Failed to fetch financial summary:", error);
      financialSummary.value = null;
    }
  } else {
    financialSummary.value = null;
  }
};

// Watch for changes in userHousehold and refresh financial summary
watchEffect(() => {
  if (userHousehold.value) {
    refreshFinancialSummary();
  }
});

const householdMembersText = computed(() => {
  const count = householdMembersCount.value;
  if (count === 1) {
    return "1 person";
  } else {
    return `${count} people`;
  }
});

// Methods
const isPersonFormValid = computed(() => {
  return personFormState.name.trim() !== "";
});

const netWorth = computed(() => {
  if (!financialSummary.value) return 0;
  return financialSummary.value.totalSavings - financialSummary.value.totalDebt;
});

// Person Management Methods
function openAddPersonModal() {
  editingPerson.value = null;
  resetPersonForm();
  isPersonModalOpen.value = true;
}

function closePersonModal() {
  isPersonModalOpen.value = false;
  editingPerson.value = null;
  resetPersonForm();
}

function resetPersonForm() {
  personFormState.name = "";
  personFormState.age = null;
}

function openDeletePersonModal(person: Person) {
  personToDelete.value = person;
  isDeletePersonModalOpen.value = true;
}

function closeDeletePersonModal() {
  isDeletePersonModalOpen.value = false;
  personToDelete.value = null;
}

async function handlePersonSubmit() {
  if (!isPersonFormValid.value || !userHousehold.value) return;

  isPersonSubmitting.value = true;

  try {
    const payload = {
      name: personFormState.name.trim(),
      age: personFormState.age,
      household_id: userHousehold.value.id,
    };

    if (editingPerson.value) {
      // Update existing person
      await $fetch(`/api/persons/${editingPerson.value.id}`, {
        method: "PUT",
        body: payload,
      });
    } else {
      // Create new person
      await $fetch("/api/persons", {
        method: "POST",
        body: payload,
      });
    }

    await refreshPersons();
    closePersonModal();

    // Show success notification
    const toast = useToast();
    toast.add({
      title: editingPerson.value ? "Member updated" : "Member added",
      description: `${personFormState.name} has been ${
        editingPerson.value ? "updated" : "added"
      } successfully.`,
      color: "success",
    });
  } catch (error: unknown) {
    const toast = useToast();
    toast.add({
      title: "Error",
      description: error instanceof Error ? error.message : "An error occurred",
      color: "error",
    });
  } finally {
    isPersonSubmitting.value = false;
  }
}

async function confirmPersonDelete() {
  if (!personToDelete.value) return;

  isDeletingPerson.value = true;

  try {
    await $fetch(`/api/persons/${personToDelete.value.id}`, {
      method: "DELETE",
    });

    await refreshPersons();
    closeDeletePersonModal();

    // Show success notification
    const toast = useToast();
    toast.add({
      title: "Member deleted",
      description: `${personToDelete.value.name} has been removed.`,
      color: "success",
    });
  } catch (error: unknown) {
    const toast = useToast();
    toast.add({
      title: "Error",
      description:
        error instanceof Error ? error.message : "Failed to delete member",
      color: "error",
    });
  } finally {
    isDeletingPerson.value = false;
  }
}

// Savings Goals Management
const savingsGoalsHouseholdId = computed(
  () => userHousehold.value?.id.toString() || ""
);

// Direct modal state management (like person modal)
const isSavingsGoalModalOpen = ref(false);
const isSavingsGoalSubmitting = ref(false);
const editingSavingsGoal = ref<(typeof activeGoals.value)[0] | null>(null);

const openSavingsGoalModal = () => {
  console.log("Opening savings goal modal");
  isSavingsGoalModalOpen.value = true;
  editingSavingsGoal.value = null;
};

const editSavingsGoal = (goal: (typeof activeGoals.value)[0]) => {
  editingSavingsGoal.value = goal;
  isSavingsGoalModalOpen.value = true;
};

const closeSavingsGoalModal = () => {
  isSavingsGoalModalOpen.value = false;
  editingSavingsGoal.value = null;
};

// Get the other functions from the composable
const {
  savingsGoals: _savingsGoalsData,
  savingsGoalsLoading,
  activeGoals,
  totalTargetAmount,
  totalCurrentAmount,
  totalProgress,
  getGoalProgress,
  getRemainingAmount,
  getEstimatedCompletionTime,
  createSavingsGoal,
  updateSavingsGoal,
  deleteSavingsGoal,
  markGoalAsCompleted,
} = useSavingsGoals(savingsGoalsHouseholdId);

// Handle savings goal submission
const handleSavingsGoalSubmit = async (formData: {
  name: string;
  description: string;
  targetAmount: string;
  priority: number;
  category: string;
  savingsAccountIds: number[];
}) => {
  isSavingsGoalSubmitting.value = true;
  try {
    if (editingSavingsGoal.value) {
      await updateSavingsGoal(editingSavingsGoal.value.id, formData);
    } else {
      await createSavingsGoal(formData);
    }
    closeSavingsGoalModal();
  } catch (error) {
    console.error("Error saving goal:", error);
  } finally {
    isSavingsGoalSubmitting.value = false;
  }
};
</script>
