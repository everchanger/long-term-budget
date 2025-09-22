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
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-red-600 dark:text-red-400'
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
                    class="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mr-3"
                  >
                    <UIcon
                      name="i-heroicons-users"
                      class="w-4 h-4 text-blue-600 dark:text-blue-400"
                    />
                  </div>
                  <h3
                    class="text-lg font-medium text-neutral-900 dark:text-white"
                  >
                    Family Members
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
                  class="flex items-center justify-between p-6 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div class="flex items-center">
                    <div
                      class="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-4"
                    >
                      <span class="text-white font-semibold">{{
                        member.name.charAt(0).toUpperCase()
                      }}</span>
                    </div>
                    <div>
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
                  <div class="flex items-center space-x-3">
                    <UButton
                      :to="`/persons/${member.id}`"
                      size="lg"
                      variant="solid"
                      icon="i-heroicons-chart-bar"
                      class="px-2"
                    >
                      Manage Finances
                    </UButton>
                    <UButton
                      size="lg"
                      variant="soft"
                      color="error"
                      icon="i-heroicons-trash"
                      square
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
                  No family members yet
                </h4>
                <p class="text-neutral-600 dark:text-neutral-400 mb-6">
                  Add your first family member to get started
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
                  class="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center mr-3"
                >
                  <UIcon
                    name="i-heroicons-chart-bar"
                    class="w-4 h-4 text-emerald-600 dark:text-emerald-400"
                  />
                </div>
                <div>
                  <h3
                    class="text-lg font-medium text-neutral-900 dark:text-white"
                  >
                    Financial Overview
                  </h3>
                  <p class="text-sm text-neutral-600 dark:text-neutral-400">
                    Combined finances for all family members
                  </p>
                </div>
              </div>
            </div>

            <div class="p-6">
              <div
                class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6"
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

                <!-- Total Investments -->
                <div
                  class="bg-neutral-50 dark:bg-neutral-900 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700"
                >
                  <div>
                    <p
                      class="text-sm font-medium text-neutral-600 dark:text-neutral-400"
                    >
                      Investments
                    </p>
                    <p
                      class="text-2xl font-bold text-neutral-900 dark:text-white"
                    >
                      ${{ financialSummary.totalInvestments.toLocaleString() }}
                    </p>
                    <p class="text-xs text-neutral-500 dark:text-neutral-500">
                      {{ financialSummary.investmentAccountsCount }} accounts
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
                class="bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-900/10 dark:to-blue-900/10 p-6 rounded-lg border border-emerald-200 dark:border-emerald-700"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center">
                    <div
                      class="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center mr-4"
                    >
                      <UIcon
                        name="i-heroicons-trophy"
                        class="w-6 h-6 text-emerald-600 dark:text-emerald-400"
                      />
                    </div>
                    <div>
                      <p
                        class="text-lg font-medium text-neutral-900 dark:text-white"
                      >
                        Estimated Net Worth
                      </p>
                      <p class="text-sm text-neutral-600 dark:text-neutral-400">
                        (Savings + Investments - Debt)
                      </p>
                    </div>
                  </div>
                  <p
                    class="text-3xl font-bold"
                    :class="
                      netWorth >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400'
                    "
                  >
                    ${{ netWorth.toLocaleString() }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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
// Page metadata
definePageMeta({
  title: "Economy",
  requiresAuth: true,
});

// Types
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
  totalInvestments: number;
  totalDebt: number;
  memberCount: number;
  incomeSourcesCount: number;
  loansCount: number;
  savingsAccountsCount: number;
  investmentAccountsCount: number;
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
const { data: households } = await useFetch("/api/households");
const { data: persons, refresh: refreshPersons } = await useFetch(
  "/api/persons"
);

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
      const data = await $fetch<FinancialSummary>(
        `/api/households/${userHousehold.value.id}/financial-summary`
      );
      financialSummary.value = data;
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
  return (
    financialSummary.value.totalSavings +
    financialSummary.value.totalInvestments -
    financialSummary.value.totalDebt
  );
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
</script>
