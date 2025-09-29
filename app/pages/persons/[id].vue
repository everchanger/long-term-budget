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
              @click="openEditPersonModal"
            >
              Edit
            </UButton>
          </div>
        </div>
      </div>

      <!-- Financial Overview Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <UCard>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-neutral-600 dark:text-neutral-400">
                Monthly Income
              </p>
              <p
                class="text-2xl font-bold text-neutral-900 dark:text-neutral-100"
              >
                ${{ totalMonthlyIncome }}
              </p>
            </div>
            <UIcon
              name="i-heroicons-banknotes"
              class="h-8 w-8 text-neutral-400"
            />
          </div>
        </UCard>

        <UCard>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-neutral-600 dark:text-neutral-400">
                Total Savings
              </p>
              <p
                class="text-2xl font-bold text-neutral-900 dark:text-neutral-100"
              >
                ${{ totalSavings }}
              </p>
            </div>
            <UIcon
              name="i-heroicons-building-library"
              class="h-8 w-8 text-neutral-400"
            />
          </div>
        </UCard>

        <UCard>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-neutral-600 dark:text-neutral-400">
                Total Debt
              </p>
              <p
                class="text-2xl font-bold text-neutral-900 dark:text-neutral-100"
              >
                ${{ totalDebt }}
              </p>
            </div>
            <UIcon
              name="i-heroicons-credit-card"
              class="h-8 w-8 text-neutral-400"
            />
          </div>
        </UCard>
      </div>

      <!-- Financial Details Tabs -->
      <UCard>
        <UTabs v-model="selectedTab" :items="financialTabs" class="w-full">
          <template #content="{ item }">
            <div class="py-6">
              <!-- Income Sources Tab -->
              <div v-if="item.value === 'income'">
                <div class="flex justify-between items-center mb-6">
                  <div class="flex items-center gap-3">
                    <UIcon
                      name="i-heroicons-banknotes"
                      class="h-6 w-6 text-neutral-400"
                    />
                    <div>
                      <h3
                        class="text-xl font-semibold text-neutral-900 dark:text-white"
                      >
                        Income Sources
                      </h3>
                      <p class="text-neutral-600 dark:text-neutral-400">
                        Manage {{ person.name }}'s income sources
                      </p>
                    </div>
                  </div>
                  <UButton icon="i-heroicons-plus" @click="openIncomeModal">
                    Add Income Source
                  </UButton>
                </div>

                <div v-if="incomeSourcesLoading" class="text-center py-8">
                  <UIcon
                    name="i-heroicons-arrow-path"
                    class="animate-spin h-6 w-6 mx-auto"
                  />
                </div>
                <div
                  v-else-if="incomeSources.length === 0"
                  class="text-center py-12"
                >
                  <UIcon
                    name="i-heroicons-banknotes"
                    class="mx-auto h-12 w-12 text-neutral-400 mb-4"
                  />
                  <h4
                    class="text-lg font-medium text-neutral-900 dark:text-white mb-2"
                  >
                    No Income Sources
                  </h4>
                  <p class="text-neutral-600 dark:text-neutral-400 mb-4">
                    Add {{ person.name }}'s first income source to get started.
                  </p>
                  <UButton
                    variant="soft"
                    icon="i-heroicons-plus"
                    @click="openIncomeModal"
                  >
                    Add Income Source
                  </UButton>
                </div>
                <div v-else class="space-y-4">
                  <UCard v-for="income in incomeSources" :key="income.id">
                    <div class="flex justify-between items-start">
                      <div class="flex-1">
                        <div class="flex items-center gap-3 mb-2">
                          <h4
                            class="font-semibold text-neutral-900 dark:text-white"
                          >
                            {{ income.name }}
                          </h4>
                          <UBadge
                            :color="income.isActive ? 'success' : 'error'"
                          >
                            {{ income.isActive ? "Active" : "Inactive" }}
                          </UBadge>
                        </div>
                        <p
                          class="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-1"
                        >
                          ${{ income.amount }} {{ income.frequency }}
                        </p>
                        <div
                          class="text-sm text-neutral-600 dark:text-neutral-400"
                        >
                          <p v-if="income.startDate">
                            Started: {{ formatDate(income.startDate) }}
                          </p>
                          <p v-if="income.endDate">
                            Ends: {{ formatDate(income.endDate) }}
                          </p>
                        </div>
                      </div>
                      <div class="flex gap-2">
                        <UButton
                          size="sm"
                          variant="ghost"
                          icon="i-heroicons-pencil"
                          @click="editIncome(income)"
                        />
                        <UButton
                          size="sm"
                          variant="ghost"
                          color="error"
                          icon="i-heroicons-trash"
                          @click="deleteIncome(income)"
                        />
                      </div>
                    </div>
                  </UCard>
                </div>
              </div>

              <!-- Loans & Debts Tab -->
              <div v-else-if="item.value === 'loans'">
                <div class="flex justify-between items-center mb-6">
                  <div class="flex items-center gap-3">
                    <UIcon
                      name="i-heroicons-credit-card"
                      class="h-6 w-6 text-gray-400"
                    />
                    <div>
                      <h3
                        class="text-xl font-semibold text-gray-900 dark:text-white"
                      >
                        Loans & Debts
                      </h3>
                      <p class="text-gray-600 dark:text-gray-400">
                        Manage {{ person.name }}'s loans and debts
                      </p>
                    </div>
                  </div>
                  <UButton icon="i-heroicons-plus" @click="openLoanModal">
                    Add Loan
                  </UButton>
                </div>

                <div v-if="loansLoading" class="text-center py-8">
                  <UIcon
                    name="i-heroicons-arrow-path"
                    class="animate-spin h-6 w-6 mx-auto"
                  />
                </div>
                <div v-else-if="loans.length === 0" class="text-center py-12">
                  <UIcon
                    name="i-heroicons-credit-card"
                    class="mx-auto h-12 w-12 text-gray-400 mb-4"
                  />
                  <h4
                    class="text-lg font-medium text-gray-900 dark:text-white mb-2"
                  >
                    No Loans Yet
                  </h4>
                  <p class="text-gray-600 dark:text-gray-400 mb-4">
                    Add loans and debts to track payments and balances.
                  </p>
                  <UButton
                    variant="soft"
                    icon="i-heroicons-plus"
                    @click="openLoanModal"
                  >
                    Add Loan
                  </UButton>
                </div>
                <div v-else class="space-y-4">
                  <UCard v-for="loan in loans" :key="loan.id">
                    <div class="flex justify-between items-start">
                      <div class="flex-1">
                        <div class="flex items-center gap-3 mb-2">
                          <h4
                            class="font-semibold text-neutral-900 dark:text-white"
                          >
                            {{ loan.name }}
                          </h4>
                          <UBadge v-if="loan.loanType" color="neutral">{{
                            loan.loanType
                          }}</UBadge>
                        </div>
                        <p
                          class="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-1"
                        >
                          ${{
                            parseFloat(loan.currentBalance).toLocaleString()
                          }}
                          balance
                        </p>
                        <div
                          class="text-sm text-neutral-600 dark:text-neutral-400"
                        >
                          <p v-if="loan.interestRate">
                            Interest Rate:
                            {{ parseFloat(loan.interestRate).toFixed(2) }}%
                          </p>
                          <p v-if="loan.monthlyPayment">
                            Monthly Payment: ${{
                              parseFloat(loan.monthlyPayment).toLocaleString()
                            }}
                          </p>
                        </div>
                      </div>
                      <div class="flex gap-2">
                        <UButton
                          size="sm"
                          variant="ghost"
                          icon="i-heroicons-pencil"
                          @click="editLoan(loan)"
                        />
                        <UButton
                          size="sm"
                          variant="ghost"
                          color="error"
                          icon="i-heroicons-trash"
                          @click="deleteLoan(loan)"
                        />
                      </div>
                    </div>
                  </UCard>
                </div>
              </div>

              <!-- Savings Accounts Tab -->
              <div v-else-if="item.value === 'savings'">
                <div class="flex justify-between items-center mb-6">
                  <div class="flex items-center gap-3">
                    <UIcon
                      name="i-heroicons-building-library"
                      class="h-6 w-6 text-neutral-400"
                    />
                    <div>
                      <h3
                        class="text-xl font-semibold text-neutral-900 dark:text-white"
                      >
                        Savings Accounts
                      </h3>
                      <p class="text-neutral-600 dark:text-neutral-400">
                        Manage {{ person.name }}'s savings accounts
                      </p>
                    </div>
                  </div>
                  <UButton icon="i-heroicons-plus" @click="openSavingsModal">
                    Add Savings Account
                  </UButton>
                </div>

                <div v-if="savingsLoading" class="text-center py-8">
                  <UIcon
                    name="i-heroicons-arrow-path"
                    class="animate-spin h-6 w-6 mx-auto"
                  />
                </div>
                <div
                  v-else-if="savingsAccounts.length === 0"
                  class="text-center py-12"
                >
                  <UIcon
                    name="i-heroicons-building-library"
                    class="mx-auto h-12 w-12 text-neutral-400 mb-4"
                  />
                  <h4
                    class="text-lg font-medium text-neutral-900 dark:text-white mb-2"
                  >
                    No Savings Accounts
                  </h4>
                  <p class="text-neutral-600 dark:text-neutral-400 mb-4">
                    Add {{ person.name }}'s first savings account to start
                    tracking balances.
                  </p>
                  <UButton
                    variant="soft"
                    icon="i-heroicons-plus"
                    @click="openSavingsModal"
                  >
                    Add Savings Account
                  </UButton>
                </div>
                <div v-else class="space-y-4">
                  <UCard v-for="account in savingsAccounts" :key="account.id">
                    <div class="flex justify-between items-start">
                      <div class="flex-1">
                        <div class="flex items-center gap-3 mb-2">
                          <h4
                            class="font-semibold text-neutral-900 dark:text-white"
                          >
                            {{ account.name }}
                          </h4>
                          <UBadge v-if="account.accountType" color="neutral">{{
                            account.accountType
                          }}</UBadge>
                        </div>
                        <p
                          class="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-1"
                        >
                          ${{
                            parseFloat(account.currentBalance).toLocaleString()
                          }}
                          balance
                        </p>
                        <div
                          class="text-sm text-neutral-600 dark:text-neutral-400"
                        >
                          <p v-if="account.interestRate">
                            Interest Rate:
                            {{ parseFloat(account.interestRate).toFixed(2) }}%
                          </p>
                        </div>
                      </div>
                      <div class="flex gap-2">
                        <UButton
                          size="sm"
                          variant="ghost"
                          icon="i-heroicons-pencil"
                          @click="editSavings(account)"
                        />
                        <UButton
                          size="sm"
                          variant="ghost"
                          color="error"
                          icon="i-heroicons-trash"
                          @click="deleteSavings(account)"
                        />
                      </div>
                    </div>
                  </UCard>
                </div>
              </div>
            </div>
          </template>
        </UTabs>
      </UCard>
    </div>

    <!-- Modal Components -->
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

    <!-- Savings Modal -->
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
import type {
  SelectIncomeSource,
  SelectPerson,
  SelectLoan,
  SelectSavingsAccount,
} from "~~/database/validation-schemas";

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

// Income sources
const {
  data: incomeSources,
  pending: incomeSourcesLoading,
  refresh: refreshIncomeSources,
} = await useFetch<SelectIncomeSource[]>("/api/income-sources", {
  query: { personId },
  default: () => [],
});

// Loans
const {
  data: loans,
  pending: loansLoading,
  refresh: refreshLoans,
} = await useFetch<SelectLoan[]>("/api/loans", {
  query: { personId },
  default: () => [],
});

// Savings accounts
const {
  data: savingsAccounts,
  pending: savingsLoading,
  refresh: refreshSavings,
} = await useFetch<SelectSavingsAccount[]>("/api/savings-accounts", {
  query: { personId },
  default: () => [],
});

// Income form state
const isIncomeModalOpen = ref(false);
const isIncomeSubmitting = ref(false);
const editingIncomeSource = ref<SelectIncomeSource | null>(null);
const incomeFormState = reactive({
  name: "",
  amount: "",
  frequency: "",
});

// Loans form state
const isLoanModalOpen = ref(false);
const isLoanSubmitting = ref(false);
const editingLoan = ref<SelectLoan | null>(null);
const loanFormState = reactive({
  name: "",
  amount: "",
  interestRate: "",
  monthlyPayment: "",
  loanType: "",
});

// Savings form state
const isSavingsModalOpen = ref(false);
const isSavingsSubmitting = ref(false);
const editingSavings = ref<SelectSavingsAccount | null>(null);
const savingsFormState = reactive({
  name: "",
  balance: "",
  interestRate: "",
  accountType: "",
});

// Computed values
const totalMonthlyIncome = computed(() => {
  if (!incomeSources.value) return "0.00";
  return incomeSources.value
    .filter((income) => income.isActive)
    .reduce((total, income) => {
      const amount = parseFloat(income.amount);
      switch (income.frequency) {
        case "monthly":
          return total + amount;
        case "yearly":
          return total + amount / 12;
        case "weekly":
          return total + amount * 4.33;
        case "bi-weekly":
          return total + amount * 2.17;
        default:
          return total;
      }
    }, 0)
    .toFixed(2);
});

const totalSavings = computed(() => {
  if (!savingsAccounts.value) return "0.00";
  return savingsAccounts.value
    .reduce(
      (total, account) => total + parseFloat(account.currentBalance || "0"),
      0
    )
    .toFixed(2);
});

const totalDebt = computed(() => {
  if (!loans.value) return "0.00";
  return loans.value
    .reduce((total, loan) => total + parseFloat(loan.currentBalance || "0"), 0)
    .toFixed(2);
});

const isIncomeFormValid = computed(() => {
  return (
    incomeFormState.name.trim() !== "" &&
    incomeFormState.amount !== "" &&
    parseFloat(incomeFormState.amount) > 0 &&
    incomeFormState.frequency !== ""
  );
});

const isSavingsFormValid = computed(() => {
  return (
    savingsFormState.name.trim() !== "" &&
    savingsFormState.balance !== "" &&
    parseFloat(savingsFormState.balance) >= 0
  );
});

// Functions
function formatDate(date: Date | string) {
  if (date instanceof Date) {
    return date.toLocaleDateString();
  }
  return new Date(date).toLocaleDateString();
}

function openIncomeModal() {
  editingIncomeSource.value = null;
  incomeFormState.name = "";
  incomeFormState.amount = "";
  incomeFormState.frequency = "";
  isIncomeModalOpen.value = true;
}

function closeIncomeModal() {
  isIncomeModalOpen.value = false;
  editingIncomeSource.value = null;
}

function editIncome(income: SelectIncomeSource) {
  editingIncomeSource.value = income;
  incomeFormState.name = income.name;
  incomeFormState.amount = income.amount;
  incomeFormState.frequency = income.frequency;
  isIncomeModalOpen.value = true;
}

async function handleIncomeSubmit() {
  if (!isIncomeFormValid.value) return;

  isIncomeSubmitting.value = true;

  try {
    const payload = {
      name: incomeFormState.name.trim(),
      amount: parseFloat(incomeFormState.amount),
      frequency: incomeFormState.frequency,
      person_id: parseInt(personId),
      is_active: true,
    };

    if (editingIncomeSource.value) {
      // Update existing income source
      await $fetch(`/api/income-sources/${editingIncomeSource.value.id}`, {
        method: "PUT",
        body: payload,
      });
    } else {
      // Create new income source
      await $fetch("/api/income-sources", {
        method: "POST",
        body: payload,
      });
    }

    await refreshIncomeSources();
    closeIncomeModal();

    // Show success notification
    const toast = useToast();
    toast.add({
      title: editingIncomeSource.value
        ? "Income source updated"
        : "Income source added",
      description: `${incomeFormState.name} has been ${
        editingIncomeSource.value ? "updated" : "added"
      } successfully.`,
      color: "success",
    });
  } catch (error: unknown) {
    const toast = useToast();
    toast.add({
      title: "Error",
      description:
        (error as { data?: { message?: string } }).data?.message ||
        "An error occurred",
      color: "error",
    });
  } finally {
    isIncomeSubmitting.value = false;
  }
}

async function deleteIncome(income: SelectIncomeSource) {
  try {
    await $fetch(`/api/income-sources/${income.id}`, {
      method: "DELETE",
    });

    await refreshIncomeSources();

    const toast = useToast();
    toast.add({
      title: "Income source deleted",
      description: `${income.name} has been removed.`,
      color: "success",
    });
  } catch (error: unknown) {
    const toast = useToast();
    toast.add({
      title: "Error",
      description:
        (error as { data?: { message?: string } }).data?.message ||
        "Failed to delete income source",
      color: "error",
    });
  }
}

// Person editing modal state
const isEditPersonModalOpen = ref(false);
const editPersonFormState = reactive({
  name: "",
  age: null as number | null,
});

function openEditPersonModal() {
  if (person.value) {
    editPersonFormState.name = person.value.name;
    editPersonFormState.age = person.value.age;
    isEditPersonModalOpen.value = true;
  }
}

function closeEditPersonModal() {
  isEditPersonModalOpen.value = false;
}

async function handleEditPersonSubmit() {
  if (!editPersonFormState.name.trim()) return;

  try {
    await $fetch(`/api/persons/${personId}`, {
      method: "PUT",
      body: {
        name: editPersonFormState.name.trim(),
        age: editPersonFormState.age,
      },
    });

    // Refresh person data
    await refreshPerson();

    closeEditPersonModal();

    const toast = useToast();
    toast.add({
      title: "Person updated",
      description: `${editPersonFormState.name} has been updated successfully.`,
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
}

function openLoanModal() {
  editingLoan.value = null;
  loanFormState.name = "";
  loanFormState.amount = "";
  loanFormState.interestRate = "";
  loanFormState.monthlyPayment = "";
  loanFormState.loanType = "";
  isLoanModalOpen.value = true;
}

function closeLoanModal() {
  isLoanModalOpen.value = false;
  editingLoan.value = null;
}

async function handleLoanSubmit() {
  if (!loanFormState.name || !loanFormState.amount) return;

  isLoanSubmitting.value = true;

  try {
    const payload = {
      name: loanFormState.name.trim(),
      originalAmount: parseFloat(loanFormState.amount),
      currentBalance: parseFloat(loanFormState.amount),
      interestRate: parseFloat(loanFormState.interestRate) || 0,
      monthlyPayment: parseFloat(loanFormState.monthlyPayment) || 0,
      loanType: loanFormState.loanType,
      personId: parseInt(personId),
    };

    if (editingLoan.value) {
      await $fetch(`/api/loans/${editingLoan.value.id}`, {
        method: "PUT",
        body: payload,
      });
    } else {
      await $fetch("/api/loans", {
        method: "POST",
        body: payload,
      });
    }

    await refreshLoans();
    closeLoanModal();

    const toast = useToast();
    toast.add({
      title: editingLoan.value ? "Loan updated" : "Loan added",
      description: `${loanFormState.name} has been ${
        editingLoan.value ? "updated" : "added"
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
    isLoanSubmitting.value = false;
  }
}

function openSavingsModal() {
  editingSavings.value = null;
  savingsFormState.name = "";
  savingsFormState.balance = "";
  savingsFormState.interestRate = "";
  savingsFormState.accountType = "";
  isSavingsModalOpen.value = true;
}

function closeSavingsModal() {
  isSavingsModalOpen.value = false;
  editingSavings.value = null;
}

async function handleSavingsSubmit() {
  if (!isSavingsFormValid.value) return;

  isSavingsSubmitting.value = true;

  try {
    const payload = {
      name: savingsFormState.name.trim(),
      currentBalance: parseFloat(savingsFormState.balance),
      interestRate: parseFloat(savingsFormState.interestRate) || 0,
      accountType: savingsFormState.accountType || null,
      personId: parseInt(personId),
    };

    if (editingSavings.value) {
      await $fetch(`/api/savings-accounts/${editingSavings.value.id}`, {
        method: "PUT",
        body: payload,
      });
    } else {
      await $fetch("/api/savings-accounts", {
        method: "POST",
        body: payload,
      });
    }

    await refreshSavings();
    closeSavingsModal();

    const toast = useToast();
    toast.add({
      title: editingSavings.value
        ? "Savings account updated"
        : "Savings account added",
      description: `${savingsFormState.name} has been ${
        editingSavings.value ? "updated" : "added"
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
    isSavingsSubmitting.value = false;
  }
}

function editSavings(account: SelectSavingsAccount) {
  editingSavings.value = account;
  savingsFormState.name = account.name;
  savingsFormState.balance = account.currentBalance;
  savingsFormState.interestRate = account.interestRate || "";
  savingsFormState.accountType = account.accountType || "";
  isSavingsModalOpen.value = true;
}

async function deleteSavings(account: SelectSavingsAccount) {
  try {
    await $fetch(`/api/savings-accounts/${account.id}`, { method: "DELETE" });
    await refreshSavings();
    const toast = useToast();
    toast.add({
      title: "Savings account deleted",
      description: `${account.name} has been removed.`,
      color: "success",
    });
  } catch (error: unknown) {
    const toast = useToast();
    toast.add({
      title: "Error",
      description:
        error instanceof Error
          ? error.message
          : "Failed to delete savings account",
      color: "error",
    });
  }
}

// CRUD functions for loans
function editLoan(loan: SelectLoan) {
  editingLoan.value = loan;
  loanFormState.name = loan.name;
  loanFormState.amount = loan.currentBalance;
  loanFormState.interestRate = loan.interestRate;
  loanFormState.loanType = loan.loanType || "";
  isLoanModalOpen.value = true;
}

async function deleteLoan(loan: SelectLoan) {
  try {
    await $fetch(`/api/loans/${loan.id}`, { method: "DELETE" });
    refreshLoans();
    const toast = useToast();
    toast.add({
      title: "Loan deleted",
      description: `${loan.name} has been removed.`,
      color: "success",
    });
  } catch {
    const toast = useToast();
    toast.add({
      title: "Error",
      description: "Failed to delete loan",
      color: "error",
    });
  }
}

// SEO
useHead({
  title: `${person.value?.name || "Person"} - Financial Details`,
});
</script>
