<template>
  <div class="container mx-auto py-8 px-4">
    <!-- Loading State -->
    <div v-if="personLoading" class="text-center py-12">
      <UIcon
        name="i-heroicons-arrow-path"
        class="animate-spin h-8 w-8 mx-auto mb-4"
      />
      <p>Loading person details...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="!person" class="text-center py-12">
      <UCard>
        <UIcon
          name="i-heroicons-exclamation-triangle"
          class="mx-auto h-16 w-16 text-red-400 mb-4"
        />
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Person Not Found
        </h3>
        <p class="text-gray-600 dark:text-gray-400 mb-4">
          The person you're looking for doesn't exist.
        </p>
        <UButton to="/economy" icon="i-heroicons-arrow-left">
          Back to Economy
        </UButton>
      </UCard>
    </div>

    <!-- Person Details -->
    <div v-else>
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div>
            <UButton
              to="/economy"
              variant="ghost"
              icon="i-heroicons-arrow-left"
              class="mb-4"
            >
              Back to Economy
            </UButton>
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
              {{ person.name }}
            </h1>
            <p class="text-gray-600 dark:text-gray-400">
              {{ person.age ? `Age: ${person.age}` : "Age not specified" }}
            </p>
          </div>
          <div class="flex gap-2">
            <UButton
              variant="soft"
              icon="i-heroicons-pencil"
              @click="() => openEditPersonModal(person || null)"
            >
              Edit
            </UButton>
          </div>
        </div>
      </div>

      <FinancialOverviewCards
        :total-monthly-income="totalMonthlyIncome"
        :total-savings="totalSavings"
        :total-debt="totalDebt"
        class="mb-8"
      />

      <UCard>
        <UTabs v-model="selectedTab" :items="financialTabs" class="w-full">
          <template #content="{ item }">
            <IncomeSourcesTab
              v-if="item.value === 'income'"
              :income-sources="incomeSources"
              :loading="incomeSourcesLoading"
              :person-name="person.name"
              :person-id="personId"
            />

            <LoansTab
              v-else-if="item.value === 'loans'"
              :loans="loans"
              :loading="loansLoading"
              :person-name="person.name"
              :person-id="personId"
            />

            <SavingsAccountsTab
              v-else-if="item.value === 'savings'"
              :savings-accounts="savingsAccounts"
              :loading="savingsLoading"
              :person-name="person.name"
              :person-id="personId"
            />
          </template>
        </UTabs>
      </UCard>
    </div>

    <EditPersonModal
      v-model:open="isEditPersonModalOpen"
      :person="person"
      :loading="false"
      @submit="handleEditPersonSubmit"
      @cancel="closeEditPersonModal"
    />
  </div>
</template>

<script setup lang="ts">
import type { SelectPerson } from "~~/database/validation-schemas";
import type { ApiSuccessResponse } from "~~/server/utils/api-response";

// Route params
const route = useRoute();
const personId = route.params.id as string;

// Person data
const {
  data: personResponse,
  pending: personLoading,
  refresh: refreshPerson,
} = await useFetch<ApiSuccessResponse<SelectPerson>>(
  `/api/persons/${personId}`
);

const person = computed(() => personResponse.value?.data);

// Financial tabs
const financialTabs = [
  { value: "income", label: "Income Sources" },
  { value: "loans", label: "Loans & Debts" },
  { value: "savings", label: "Savings" },
];

const selectedTab = ref(financialTabs[0]?.value);

// Use composables for financial data management
const incomeSourcesComposable = useIncomeSources(personId);
const loansComposable = useLoans(personId);
const savingsAccountsComposable = useSavingsAccounts(personId);
const { updatePerson } = usePersonEdit(personId);

// Extract values from composables for template usage
const { incomeSources, incomeSourcesLoading, totalMonthlyIncome } =
  incomeSourcesComposable;

const { loans, loansLoading, totalDebt } = loansComposable;

const { savingsAccounts, savingsLoading, totalSavings } =
  savingsAccountsComposable;

// EditPersonModal state - now managed by this component
const isEditPersonModalOpen = ref(false);

// Modal functions
const openEditPersonModal = (personData: SelectPerson | null) => {
  if (personData) {
    isEditPersonModalOpen.value = true;
  }
};

const closeEditPersonModal = () => {
  isEditPersonModalOpen.value = false;
};

// Handle form submission
const handleEditPersonSubmit = async (formData: {
  name?: string;
  age?: number;
}) => {
  if (!formData.name?.trim()) return;

  try {
    await updatePerson({
      name: formData.name.trim(),
      age: formData.age ?? null,
    });
    await refreshPerson();
    closeEditPersonModal();

    const toast = useToast();
    toast.add({
      title: "Person updated",
      description: `${formData.name} has been updated successfully.`,
      color: "success",
    });
  } catch (error: unknown) {
    const toast = useToast();
    toast.add({
      title: "Error",
      description:
        (error as { data?: { message?: string } }).data?.message ||
        "Failed to update person",
      color: "error",
    });
  }
};

// SEO
useHead({
  title: `${person.value?.name || "Person"} - Financial Details`,
});
</script>
