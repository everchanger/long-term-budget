<template>
  <UPage>
    <!-- Loading State -->
    <div v-if="personLoading" class="text-center py-12">
      <UIcon
        name="i-heroicons-arrow-path"
        class="animate-spin h-8 w-8 mx-auto mb-4"
      />
      <p>{{ $t("common.loading") }}</p>
    </div>

    <!-- Error State -->
    <div v-else-if="!person" class="text-center py-12">
      <div class="max-w-md mx-auto">
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
          {{ $t("navigation.economy") }}
        </UButton>
      </div>
    </div>

    <!-- Person Details -->
    <template v-else>
      <UPageHeader
        :title="person.name"
        :description="
          person.age
            ? `${$t('person.age')}: ${person.age}`
            : $t('household.ageNotSpecified')
        "
      >
        <template #leading>
          <UButton
            to="/economy"
            variant="ghost"
            icon="i-heroicons-arrow-left"
            size="sm"
          >
            {{ $t("navigation.economy") }}
          </UButton>
        </template>
        <template #trailing>
          <UButton
            variant="soft"
            icon="i-heroicons-pencil"
            @click="() => openEditPersonModal(person || null)"
          >
            {{ $t("common.edit") }}
          </UButton>
        </template>
      </UPageHeader>

      <UPageBody>
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
      </UPageBody>
    </template>

    <EditPersonModal
      v-model:open="isEditPersonModalOpen"
      :person="person"
      :loading="false"
      @submit="handleEditPersonSubmit"
      @cancel="closeEditPersonModal"
    />
  </UPage>
</template>

<script setup lang="ts">
import type { SelectPerson } from "~~/database/validation-schemas";
import type { ApiSuccessResponse } from "~~/server/utils/api-response";

const { t } = useI18n();

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
const financialTabs = computed(() => [
  { value: "income", label: t("income.sources") },
  { value: "loans", label: t("loans.title") },
  { value: "savings", label: t("savings.title") },
]);

const selectedTab = ref("income");

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
      title: t("common.success"),
      description: t("dashboard.userUpdatedSuccess"),
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
