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
              @add-income="openIncomeModal"
              @edit-income="editIncome"
              @delete-income="deleteIncome"
            />

            <LoansTab
              v-else-if="item.value === 'loans'"
              :loans="loans"
              :loading="loansLoading"
              :person-name="person.name"
              @add-loan="openLoanModal"
              @edit-loan="editLoan"
              @delete-loan="deleteLoan"
            />

            <SavingsAccountsTab
              v-else-if="item.value === 'savings'"
              :savings-accounts="savingsAccounts"
              :loading="savingsLoading"
              :person-name="person.name"
              @add-savings="openSavingsModal"
              @edit-savings="editSavings"
              @delete-savings="deleteSavings"
            />
          </template>
        </UTabs>
      </UCard>
    </div>

    <IncomeSourceModal
      v-model:open="isIncomeModalOpen"
      :income-source="editingIncomeSource"
      :loading="isIncomeSubmitting"
      @submit="handleIncomeSubmit"
      @cancel="closeIncomeModal"
    />

    <LoanModal
      v-model:open="isLoanModalOpen"
      :loan="editingLoan"
      :loading="isLoanSubmitting"
      @submit="handleLoanSubmit"
      @cancel="closeLoanModal"
    />

    <SavingsAccountModal
      v-model:open="isSavingsModalOpen"
      :savings-account="editingSavings"
      :loading="isSavingsSubmitting"
      @submit="handleSavingsSubmit"
      @cancel="closeSavingsModal"
    />

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

// Route params
const route = useRoute();
const personId = route.params.id as string;

// Person data
const {
  data: person,
  pending: personLoading,
  refresh: refreshPerson,
} = await useFetch<SelectPerson>(`/api/persons/${personId}`);

// Financial tabs
const financialTabs = [
  { value: "income", label: "Income Sources", icon: "i-heroicons-banknotes" },
  { value: "loans", label: "Loans & Debts", icon: "i-heroicons-credit-card" },
  { value: "savings", label: "Savings", icon: "i-heroicons-building-library" },
];

const selectedTab = ref(financialTabs[0]?.value);

// Use composables for financial data management
const incomeSourcesComposable = useIncomeSources(personId);
const loansComposable = useLoans(personId);
const savingsAccountsComposable = useSavingsAccounts(personId);
const personEditComposable = usePersonEdit(personId, refreshPerson);

// Extract values from composables for template usage
const {
  incomeSources,
  incomeSourcesLoading,
  isIncomeModalOpen,
  isIncomeSubmitting,
  editingIncomeSource,
  totalMonthlyIncome,
  openIncomeModal,
  closeIncomeModal,
  editIncome,
  handleIncomeSubmit,
  deleteIncome,
} = incomeSourcesComposable;

const {
  loans,
  loansLoading,
  isLoanModalOpen,
  isLoanSubmitting,
  editingLoan,
  totalDebt,
  openLoanModal,
  closeLoanModal,
  editLoan,
  handleLoanSubmit,
  deleteLoan,
} = loansComposable;

const {
  savingsAccounts,
  savingsLoading,
  isSavingsModalOpen,
  isSavingsSubmitting,
  editingSavings,
  totalSavings,
  openSavingsModal,
  closeSavingsModal,
  editSavings,
  handleSavingsSubmit,
  deleteSavings,
} = savingsAccountsComposable;

const {
  isEditPersonModalOpen,
  openEditPersonModal,
  closeEditPersonModal,
  handleEditPersonSubmit,
} = personEditComposable;

// SEO
useHead({
  title: `${person.value?.name || "Person"} - Financial Details`,
});
</script>
