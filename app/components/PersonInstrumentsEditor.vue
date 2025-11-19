<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold">
          {{
            $t("projections.personFinancialInstruments", { name: person.name })
          }}
        </h3>
        <UButton
          :icon="
            isExpanded ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'
          "
          color="neutral"
          variant="ghost"
          size="xs"
          @click="isExpanded = !isExpanded"
        />
      </div>
    </template>

    <div v-if="isExpanded" class="space-y-6">
      <!-- Income Sources -->
      <div v-if="incomeSources.length > 0">
        <h4 class="text-sm font-semibold mb-3 flex items-center gap-2">
          <UIcon name="i-heroicons-banknotes" class="text-green-500" />
          {{ $t("income.sources") }}
        </h4>
        <div class="space-y-3">
          <div
            v-for="income in incomeSources"
            :key="income.id"
            class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
          >
            <div class="flex items-center justify-between mb-2">
              <span class="font-medium">{{ income.name }}</span>
              <span class="text-sm text-gray-500">{{ income.frequency }}</span>
            </div>
            <div class="space-y-2">
              <div>
                <label class="text-xs text-gray-500">{{
                  $t("common.amount")
                }}</label>
                <div class="flex items-center gap-2 mt-1">
                  <input
                    :value="localIncome[income.id]?.amount ?? income.amount"
                    type="number"
                    step="100"
                    min="0"
                    class="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900"
                    @input="
                      updateIncome(
                        income.id,
                        'amount',
                        ($event.target as HTMLInputElement).value
                      )
                    "
                  />
                  <UButton
                    icon="i-heroicons-arrow-path"
                    size="xs"
                    color="neutral"
                    variant="ghost"
                    @click="resetIncome(income.id)"
                  />
                </div>
              </div>
              <div class="text-xs text-gray-500">
                Monthly: {{ formatCurrency(calculateMonthlyIncome(income.id)) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Savings Accounts -->
      <div v-if="savingsAccounts.length > 0">
        <h4 class="text-sm font-semibold mb-3 flex items-center gap-2">
          <UIcon name="i-heroicons-building-library" class="text-blue-500" />
          {{ $t("savings.accounts") }}
        </h4>
        <div class="space-y-3">
          <div
            v-for="account in savingsAccounts"
            :key="account.id"
            class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
          >
            <div class="flex items-center justify-between mb-2">
              <span class="font-medium">{{ account.name }}</span>
              <span v-if="account.accountType" class="text-xs text-gray-500">{{
                account.accountType
              }}</span>
            </div>
            <div class="space-y-2">
              <div>
                <label class="text-xs text-gray-500">{{
                  $t("savings.currentBalance")
                }}</label>
                <div class="flex items-center gap-2 mt-1">
                  <input
                    :value="
                      localSavings[account.id]?.currentBalance ??
                      account.currentBalance
                    "
                    type="number"
                    step="100"
                    min="0"
                    class="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900"
                    @input="
                      updateSavings(
                        account.id,
                        'currentBalance',
                        ($event.target as HTMLInputElement).value
                      )
                    "
                  />
                  <UButton
                    icon="i-heroicons-arrow-path"
                    size="xs"
                    color="neutral"
                    variant="ghost"
                    @click="resetSavings(account.id)"
                  />
                </div>
              </div>
              <div>
                <label class="text-xs text-gray-500">{{
                  $t("savings.monthlyDeposit")
                }}</label>
                <input
                  :value="
                    localSavings[account.id]?.monthlyDeposit ??
                    account.monthlyDeposit
                  "
                  type="number"
                  step="50"
                  min="0"
                  class="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 mt-1"
                  @input="
                    updateSavings(
                      account.id,
                      'monthlyDeposit',
                      ($event.target as HTMLInputElement).value
                    )
                  "
                />
              </div>
              <div>
                <label class="text-xs text-gray-500">{{
                  $t("common.interestRate")
                }}</label>
                <input
                  :value="
                    (localSavings[account.id]?.interestRate ??
                      account.interestRate) * 100
                  "
                  type="number"
                  step="0.1"
                  min="0"
                  max="20"
                  class="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 mt-1"
                  @input="
                    updateSavings(
                      account.id,
                      'interestRate',
                      parseFloat(($event.target as HTMLInputElement).value) /
                        100
                    )
                  "
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Loans -->
      <div v-if="loans.length > 0">
        <h4 class="text-sm font-semibold mb-3 flex items-center gap-2">
          <UIcon name="i-heroicons-credit-card" class="text-red-500" />
          {{ $t("loans.title") }}
        </h4>
        <div class="space-y-3">
          <div
            v-for="loan in loans"
            :key="loan.id"
            class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
          >
            <div class="flex items-center justify-between mb-2">
              <span class="font-medium">{{ loan.name }}</span>
              <span v-if="loan.loanType" class="text-xs text-gray-500">{{
                loan.loanType
              }}</span>
            </div>
            <div class="space-y-2">
              <div>
                <label class="text-xs text-gray-500">{{
                  $t("loans.currentBalance")
                }}</label>
                <div class="flex items-center gap-2 mt-1">
                  <input
                    :value="
                      localLoans[loan.id]?.currentBalance ?? loan.currentBalance
                    "
                    type="number"
                    step="100"
                    min="0"
                    class="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900"
                    @input="
                      updateLoan(
                        loan.id,
                        'currentBalance',
                        ($event.target as HTMLInputElement).value
                      )
                    "
                  />
                  <UButton
                    icon="i-heroicons-arrow-path"
                    size="xs"
                    color="neutral"
                    variant="ghost"
                    @click="resetLoan(loan.id)"
                  />
                </div>
              </div>
              <div>
                <label class="text-xs text-gray-500">{{
                  $t("loans.monthlyPayment")
                }}</label>
                <input
                  :value="
                    localLoans[loan.id]?.monthlyPayment ?? loan.monthlyPayment
                  "
                  type="number"
                  step="50"
                  min="0"
                  class="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 mt-1"
                  @input="
                    updateLoan(
                      loan.id,
                      'monthlyPayment',
                      ($event.target as HTMLInputElement).value
                    )
                  "
                />
              </div>
              <div>
                <label class="text-xs text-gray-500">{{
                  $t("common.interestRate")
                }}</label>
                <input
                  :value="
                    (localLoans[loan.id]?.interestRate ?? loan.interestRate) *
                    100
                  "
                  type="number"
                  step="0.1"
                  min="0"
                  max="30"
                  class="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 mt-1"
                  @input="
                    updateLoan(
                      loan.id,
                      'interestRate',
                      parseFloat(($event.target as HTMLInputElement).value) /
                        100
                    )
                  "
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Broker Accounts -->
      <div v-if="brokerAccounts.length > 0">
        <h4 class="text-sm font-semibold mb-3 flex items-center gap-2">
          <UIcon name="i-heroicons-chart-bar" class="text-purple-500" />
          {{ $t("brokers.investmentAccounts") }}
        </h4>
        <div class="space-y-3">
          <div
            v-for="account in brokerAccounts"
            :key="account.id"
            class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
          >
            <div class="flex items-center justify-between mb-2">
              <span class="font-medium">{{ account.name }}</span>
              <span v-if="account.brokerName" class="text-xs text-gray-500">{{
                account.brokerName
              }}</span>
            </div>
            <div class="space-y-2">
              <div>
                <label class="text-xs text-gray-500">{{
                  $t("brokers.currentValue")
                }}</label>
                <div class="flex items-center gap-2 mt-1">
                  <input
                    :value="
                      localBrokers[account.id]?.currentValue ??
                      account.currentValue
                    "
                    type="number"
                    step="100"
                    min="0"
                    class="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900"
                    @input="
                      updateBroker(
                        account.id,
                        'currentValue',
                        ($event.target as HTMLInputElement).value
                      )
                    "
                  />
                  <UButton
                    icon="i-heroicons-arrow-path"
                    size="xs"
                    color="neutral"
                    variant="ghost"
                    @click="resetBroker(account.id)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <USeparator />
      <div class="flex gap-2">
        <UButton size="sm" color="primary" @click="applyChanges">{{
          $t("common.applyChanges")
        }}</UButton>
        <UButton size="sm" color="neutral" variant="ghost" @click="resetAll">{{
          $t("common.resetAll")
        }}</UButton>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
interface IncomeSource {
  id: number;
  name: string;
  amount: number;
  frequency: string;
  monthlyAmount: number;
}

interface SavingsAccount {
  id: number;
  name: string;
  currentBalance: number;
  monthlyDeposit: number;
  interestRate: number;
  accountType: string | null;
}

interface Loan {
  id: number;
  name: string;
  currentBalance: number;
  monthlyPayment: number;
  interestRate: number;
  loanType: string | null;
}

interface BrokerAccount {
  id: number;
  name: string;
  currentValue: number;
  brokerName: string | null;
  accountType: string | null;
}

interface Person {
  id: number;
  name: string;
}

interface Props {
  person: Person;
  incomeSources: IncomeSource[];
  savingsAccounts: SavingsAccount[];
  loans: Loan[];
  brokerAccounts: BrokerAccount[];
}

const props = defineProps<Props>();
const emit = defineEmits<{
  update: [
    data: {
      personId: number;
      income: Record<number, Partial<IncomeSource>>;
      savings: Record<number, Partial<SavingsAccount>>;
      loans: Record<number, Partial<Loan>>;
      brokers: Record<number, Partial<BrokerAccount>>;
    }
  ];
}>();

const isExpanded = ref(false);

// Local state for edits
const localIncome = ref<Record<number, Partial<IncomeSource>>>({});
const localSavings = ref<Record<number, Partial<SavingsAccount>>>({});
const localLoans = ref<Record<number, Partial<Loan>>>({});
const localBrokers = ref<Record<number, Partial<BrokerAccount>>>({});

// Update functions
const updateIncome = (
  id: number,
  field: keyof IncomeSource,
  value: string | number
) => {
  if (!localIncome.value[id]) {
    localIncome.value[id] = {};
  }
  const parsedValue = typeof value === "string" ? parseFloat(value) : value;
  localIncome.value[id] = { ...localIncome.value[id], [field]: parsedValue };
};

const updateSavings = (
  id: number,
  field: keyof SavingsAccount,
  value: string | number
) => {
  if (!localSavings.value[id]) {
    localSavings.value[id] = {};
  }
  const parsedValue = typeof value === "string" ? parseFloat(value) : value;
  localSavings.value[id] = { ...localSavings.value[id], [field]: parsedValue };
};

const updateLoan = (id: number, field: keyof Loan, value: string | number) => {
  if (!localLoans.value[id]) {
    localLoans.value[id] = {};
  }
  const parsedValue = typeof value === "string" ? parseFloat(value) : value;
  localLoans.value[id] = { ...localLoans.value[id], [field]: parsedValue };
};

const updateBroker = (
  id: number,
  field: keyof BrokerAccount,
  value: string | number
) => {
  if (!localBrokers.value[id]) {
    localBrokers.value[id] = {};
  }
  const parsedValue = typeof value === "string" ? parseFloat(value) : value;
  localBrokers.value[id] = { ...localBrokers.value[id], [field]: parsedValue };
};

// Reset functions
const resetIncome = (id: number) => {
  const { [id]: _, ...rest } = localIncome.value;
  localIncome.value = rest;
};

const resetSavings = (id: number) => {
  const { [id]: _, ...rest } = localSavings.value;
  localSavings.value = rest;
};

const resetLoan = (id: number) => {
  const { [id]: _, ...rest } = localLoans.value;
  localLoans.value = rest;
};

const resetBroker = (id: number) => {
  const { [id]: _, ...rest } = localBrokers.value;
  localBrokers.value = rest;
};

const resetAll = () => {
  localIncome.value = {};
  localSavings.value = {};
  localLoans.value = {};
  localBrokers.value = {};
};

// Calculate monthly income considering edits
const calculateMonthlyIncome = (id: number) => {
  const original = props.incomeSources.find((i) => i.id === id);
  if (!original) return 0;

  const amount = localIncome.value[id]?.amount ?? original.amount;
  const frequency = original.frequency;

  // Simple conversion
  const frequencyMultiplier: Record<string, number> = {
    monthly: 1,
    weekly: 4.33,
    biweekly: 2.17,
    yearly: 1 / 12,
  };

  return amount * (frequencyMultiplier[frequency] || 1);
};

// Apply changes
const applyChanges = () => {
  emit("update", {
    personId: props.person.id,
    income: localIncome.value,
    savings: localSavings.value,
    loans: localLoans.value,
    brokers: localBrokers.value,
  });
};

const { formatCurrency } = useFormatters();
</script>
