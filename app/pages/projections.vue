<template>
  <UPage>
    <UPageHeader :title="$t('projections.title')" />

    <UPageBody>
      <div v-if="!userHousehold" class="text-center py-12">
        <p class="text-gray-500">
          {{ $t("projections.noHousehold") }}
        </p>
      </div>

      <div v-else-if="loading" class="text-center py-12">
        <div
          class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"
        />
        <p class="mt-4 text-gray-500">
          {{ $t("projections.generatingProjections") }}
        </p>
      </div>

      <div v-else-if="error" class="text-center py-12">
        <p class="text-red-500">
          {{ $t("projections.errorLoadingProjections") }}: {{ error.message }}
        </p>
      </div>

      <template v-else-if="data">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Left Column: Instrument Editors -->
          <div class="lg:col-span-1 space-y-4">
            <UCard>
              <template #header>
                <h2 class="text-xl font-semibold">
                  {{ $t("projections.adjustInstruments") }}
                </h2>
                <p class="text-sm text-gray-500 mt-1">
                  {{ $t("projections.adjustInstrumentsDesc") }}
                </p>
              </template>

              <div class="space-y-3">
                <PersonInstrumentsEditor
                  v-for="person in data.persons"
                  :key="person.person.id"
                  :person="person.person"
                  :income-sources="person.incomeSources as IncomeSource[]"
                  :savings-accounts="person.savingsAccounts as SavingsAccount[]"
                  :loans="person.loans as Loan[]"
                  :broker-accounts="person.brokerAccounts as BrokerAccount[]"
                  @update="handleInstrumentUpdate"
                />
              </div>
            </UCard>

            <!-- Global Assumptions (Optional) -->
            <UCard>
              <template #header>
                <div class="flex items-center justify-between">
                  <div>
                    <h2 class="text-lg font-semibold">
                      {{ $t("projections.globalAssumptions") }}
                    </h2>
                    <p class="text-xs text-gray-500 mt-1">
                      {{ $t("projections.globalAssumptionsDesc") }}
                    </p>
                  </div>
                  <USwitch
                    v-model="enableGlobalAssumptions"
                    @update:model-value="debouncedUpdate"
                  />
                </div>
              </template>
              <div v-if="enableGlobalAssumptions" class="space-y-4">
                <UFormField
                  :label="$t('projections.incomeGrowth')"
                  name="incomeGrowth"
                >
                  <template #hint>
                    <span class="text-sm font-semibold">
                      {{ formatPercent(incomeGrowth) }}
                    </span>
                  </template>
                  <USlider
                    v-model="incomeGrowth"
                    :min="0"
                    :max="10"
                    :step="0.5"
                    @update:model-value="debouncedUpdate"
                  />
                </UFormField>

                <UFormField
                  :label="$t('projections.expenseGrowth')"
                  name="expenseGrowth"
                >
                  <template #hint>
                    <span class="text-sm font-semibold">
                      {{ formatPercent(expenseGrowth) }}
                    </span>
                  </template>
                  <USlider
                    v-model="expenseGrowth"
                    :min="0"
                    :max="10"
                    :step="0.5"
                    @update:model-value="debouncedUpdate"
                  />
                </UFormField>

                <UFormField
                  :label="$t('projections.investmentReturn')"
                  name="investmentReturn"
                >
                  <template #hint>
                    <span class="text-sm font-semibold">
                      {{ formatPercent(investmentReturn) }}
                    </span>
                  </template>
                  <USlider
                    v-model="investmentReturn"
                    :min="0"
                    :max="15"
                    :step="0.5"
                    @update:model-value="debouncedUpdate"
                  />
                </UFormField>
              </div>
              <div
                v-else
                class="text-center py-8 text-gray-500 dark:text-gray-400 text-sm"
              >
                {{ $t("projections.enableToAdjust") }}
              </div>
            </UCard>
          </div>

          <!-- Right Column: Chart and Summary -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Current State (Database Values) -->
            <UCard>
              <template #header>
                <div>
                  <h2 class="text-xl font-semibold">
                    {{ $t("projections.storedFinancialData") }}
                  </h2>
                  <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {{ $t("projections.storedFinancialDataDesc") }}
                  </p>
                </div>
              </template>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div class="text-sm text-gray-500 dark:text-gray-400">
                    {{ $t("projections.netWorth") }}
                  </div>
                  <div
                    class="text-2xl font-bold"
                    :class="
                      (originalCurrentState?.netWorth ?? 0) >= 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    "
                  >
                    {{ formatCurrency(originalCurrentState?.netWorth ?? 0) }}
                  </div>
                </div>
                <div>
                  <div class="text-sm text-gray-500 dark:text-gray-400">
                    {{ $t("projections.monthlyIncome") }}
                  </div>
                  <div class="text-2xl font-bold">
                    {{
                      formatCurrency(originalCurrentState?.monthlyIncome ?? 0)
                    }}
                  </div>
                </div>
                <div>
                  <div class="text-sm text-gray-500 dark:text-gray-400">
                    {{ $t("projections.monthlyExpenses") }}
                  </div>
                  <div class="text-2xl font-bold">
                    {{
                      formatCurrency(originalCurrentState?.monthlyExpenses ?? 0)
                    }}
                  </div>
                </div>
                <div>
                  <div class="text-sm text-gray-500 dark:text-gray-400">
                    {{ $t("projections.totalDebt") }}
                  </div>
                  <div
                    class="text-2xl font-bold text-red-600 dark:text-red-400"
                  >
                    {{ formatCurrency(originalCurrentState?.debt ?? 0) }}
                  </div>
                </div>
              </div>
            </UCard>

            <!-- Projected Starting Values (With Adjustments) -->
            <UCard
              v-if="
                Object.keys(instrumentAdjustments).length > 0 &&
                data.projection.dataPoints.length > 0
              "
            >
              <template #header>
                <div>
                  <h2 class="text-xl font-semibold">
                    {{ $t("projections.adjustedProjectionValues") }}
                  </h2>
                  <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {{ $t("projections.adjustedProjectionValuesDesc") }}
                  </p>
                </div>
              </template>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div class="text-sm text-gray-500 dark:text-gray-400">
                    Net Worth
                  </div>
                  <div
                    class="text-2xl font-bold"
                    :class="data.projection.dataPoints[0]!.netWorth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'"
                  >
                    {{
                      formatCurrency(data.projection.dataPoints[0]!.netWorth)
                    }}
                  </div>
                </div>
                <div>
                  <div class="text-sm text-gray-500 dark:text-gray-400">
                    Monthly Income
                  </div>
                  <div class="text-2xl font-bold">
                    {{
                      formatCurrency(
                        data.projection.dataPoints[0]!.monthlyIncome
                      )
                    }}
                  </div>
                </div>
                <div>
                  <div class="text-sm text-gray-500 dark:text-gray-400">
                    Monthly Expenses
                  </div>
                  <div class="text-2xl font-bold">
                    {{
                      formatCurrency(
                        data.projection.dataPoints[0]!.monthlyExpenses
                      )
                    }}
                  </div>
                </div>
                <div>
                  <div class="text-sm text-gray-500 dark:text-gray-400">
                    Total Debt
                  </div>
                  <div
                    class="text-2xl font-bold text-red-600 dark:text-red-400"
                  >
                    {{ formatCurrency(data.projection.dataPoints[0]!.debt) }}
                  </div>
                </div>
              </div>
            </UCard>

            <!-- Projection Chart -->
            <FinancialProjectionChartJS
              :yearly-net-worth="getYearlyNetWorth()"
              :yearly-savings="getYearlySavings()"
              :yearly-investments="getYearlyInvestments()"
              :yearly-debt="getYearlyDebt()"
              :baseline-net-worth="
                enableGlobalAssumptions
                  ? baselineProjection?.yearlyNetWorth
                  : undefined
              "
              :baseline-savings="
                enableGlobalAssumptions
                  ? baselineProjection?.yearlySavings
                  : undefined
              "
              :baseline-investments="
                enableGlobalAssumptions
                  ? baselineProjection?.yearlyInvestments
                  : undefined
              "
              :baseline-debt="
                enableGlobalAssumptions
                  ? baselineProjection?.yearlyDebt
                  : undefined
              "
            />

            <!-- Data Table -->
            <UCard>
              <template #header>
                <div class="flex items-center justify-between">
                  <h2 class="text-xl font-semibold">
                    {{ $t("projections.projectionData") }}
                  </h2>
                  <UButton
                    :color="showDataTable ? 'primary' : 'neutral'"
                    size="sm"
                    @click="showDataTable = !showDataTable"
                  >
                    <UIcon
                      :name="
                        showDataTable
                          ? 'i-heroicons-eye-slash'
                          : 'i-heroicons-eye'
                      "
                      class="mr-1"
                    />
                    {{
                      showDataTable
                        ? $t("projections.hideTable")
                        : $t("projections.showTable")
                    }}
                  </UButton>
                </div>
              </template>
              <UTable
                v-if="showDataTable"
                :data="tableRows"
                :columns="tableColumns as any"
              >
                <template #netWorth-cell="{ row }">
                  <span
                    :class="
                      (row.original as ProjectionTableRow).netWorth >= 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    "
                  >
                    {{
                      formatCurrency(
                        (row.original as ProjectionTableRow).netWorth
                      )
                    }}
                  </span>
                </template>
                <template #savings-cell="{ row }">
                  {{
                    formatCurrency((row.original as ProjectionTableRow).savings)
                  }}
                </template>
                <template #investments-cell="{ row }">
                  {{
                    formatCurrency(
                      (row.original as ProjectionTableRow).investments
                    )
                  }}
                </template>
                <template #debt-cell="{ row }">
                  <span
                    :class="
                      (row.original as ProjectionTableRow).debt > 0
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-gray-500'
                    "
                  >
                    {{
                      formatCurrency((row.original as ProjectionTableRow).debt)
                    }}
                  </span>
                </template>
                <template #monthlyIncome-cell="{ row }">
                  {{
                    formatCurrency(
                      (row.original as ProjectionTableRow).monthlyIncome
                    )
                  }}
                </template>
                <template #monthlyExpenses-cell="{ row }">
                  {{
                    formatCurrency(
                      (row.original as ProjectionTableRow).monthlyExpenses
                    )
                  }}
                </template>
              </UTable>
              <div
                v-else
                class="text-center py-4 text-gray-500 dark:text-gray-400 text-sm"
              >
                {{ $t("projections.clickShowTable") }}
              </div>
            </UCard>

            <!-- Milestones -->
            <UCard v-if="data.projection.milestones.length > 0">
              <template #header>
                <h2 class="text-xl font-semibold">
                  {{ $t("projections.keyMilestones") }}
                </h2>
              </template>
              <UTimeline :items="timelineItems" color="primary" />
            </UCard>

            <!-- Summary -->
            <UCard>
              <template #header>
                <h2 class="text-xl font-semibold">
                  {{ $t("projections.summary") }}
                </h2>
              </template>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="space-y-4">
                  <div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                      {{ $t("projections.startingNetWorth") }}
                    </div>
                    <div class="text-2xl font-bold">
                      {{
                        formatCurrency(data.projection.summary.startNetWorth)
                      }}
                    </div>
                  </div>
                  <div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                      {{ $t("projections.endingNetWorth") }}
                    </div>
                    <div
                      class="text-2xl font-bold text-green-600 dark:text-green-400"
                    >
                      {{ formatCurrency(data.projection.summary.endNetWorth) }}
                    </div>
                  </div>
                  <div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                      {{ $t("projections.totalGrowth") }}
                    </div>
                    <div
                      class="text-2xl font-bold text-blue-600 dark:text-blue-400"
                    >
                      {{ formatCurrency(data.projection.summary.totalGrowth) }}
                    </div>
                  </div>
                </div>
                <div class="space-y-4">
                  <div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                      {{ $t("projections.totalSaved") }}
                    </div>
                    <div class="text-2xl font-bold">
                      {{
                        formatCurrency(
                          data.projection.summary.totalSavingsAccumulated
                        )
                      }}
                    </div>
                  </div>
                  <div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                      {{ $t("projections.totalDebtPaid") }}
                    </div>
                    <div
                      class="text-2xl font-bold text-green-600 dark:text-green-400"
                    >
                      {{
                        formatCurrency(data.projection.summary.totalDebtPaid)
                      }}
                    </div>
                  </div>
                  <div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                      {{ $t("projections.avgMonthlyCashFlow") }}
                    </div>
                    <div class="text-2xl font-bold">
                      {{
                        formatCurrency(
                          data.projection.summary.averageMonthlyIncome -
                            data.projection.summary.averageMonthlyExpenses
                        )
                      }}
                    </div>
                  </div>
                </div>
              </div>
            </UCard>
          </div>
        </div>
      </template>
    </UPageBody>
  </UPage>
</template>

<script setup lang="ts">
import type {
  IncomeSource,
  SavingsAccount,
  Loan,
  BrokerAccount,
} from "~/composables/useFinancialProjection";

definePageMeta({
  middleware: "auth",
});

const { t } = useI18n();
const { formatCurrencyCompact } = useFormatters();

// Fetch user's household
const { data: householdsData } = await useFetch("/api/households");
const userHousehold = computed(() => householdsData.value?.data?.[0] || null);
const householdId = computed(() =>
  userHousehold.value ? userHousehold.value.id : null
);

// Use projection composable
const {
  data,
  loading,
  error,
  updateParams,
  formatCurrency,
  formatPercent,
  getYearlyNetWorth,
  getYearlySavings,
  getYearlyInvestments,
  getYearlyDebt,
} = useFinancialProjection(householdId);

// Global assumptions state
const enableGlobalAssumptions = ref(false);
const incomeGrowth = ref(3);
const expenseGrowth = ref(2);
const investmentReturn = ref(8);

// Data table visibility
const showDataTable = ref(false);

// Define table row type
interface ProjectionTableRow {
  year: string;
  netWorth: number;
  savings: number;
  investments: number;
  debt: number;
  monthlyIncome: number;
  monthlyExpenses: number;
}

// Table columns
const tableColumns = [
  { accessorKey: "year", header: t("projections.year") },
  { accessorKey: "netWorth", header: t("projections.netWorth") },
  { accessorKey: "savings", header: t("savings.title") },
  { accessorKey: "investments", header: t("projections.investments") },
  { accessorKey: "debt", header: t("projections.debt") },
  { accessorKey: "monthlyIncome", header: t("projections.monthlyIncome") },
  { accessorKey: "monthlyExpenses", header: t("projections.monthlyExpenses") },
];

// Table rows
const tableRows = computed<ProjectionTableRow[]>(() => {
  if (!data.value) return [];

  return Array.from({ length: 10 }, (_, i) => {
    const year = i;
    const monthIndex = Math.min(
      year * 12,
      data.value!.projection.dataPoints.length - 1
    );
    const dataPoint = data.value!.projection.dataPoints[monthIndex];

    return {
      year: `${t("projections.year")} ${year}`,
      netWorth: getYearlyNetWorth()[year] ?? 0,
      savings: getYearlySavings()[year] ?? 0,
      investments: getYearlyInvestments()[year] ?? 0,
      debt: getYearlyDebt()[year] ?? 0,
      monthlyIncome: dataPoint?.monthlyIncome ?? 0,
      monthlyExpenses: dataPoint?.monthlyExpenses ?? 0,
    };
  });
});

// Computed values that return 0 when disabled
const activeIncomeGrowth = computed(() =>
  enableGlobalAssumptions.value ? incomeGrowth.value : 0
);
const activeExpenseGrowth = computed(() =>
  enableGlobalAssumptions.value ? expenseGrowth.value : 0
);
const activeInvestmentReturn = computed(() =>
  enableGlobalAssumptions.value ? investmentReturn.value : 0
);

// Timeline items for milestones
const timelineItems = computed(() => {
  if (!data.value) return [];

  return data.value.projection.milestones.map((milestone, index) => {
    const colorClass = getMilestoneColor(milestone.type);
    // Extract color from text-xxx-xxx pattern
    const bgClass = colorClass.replace("text-", "bg-");

    return {
      date: formatMilestoneTime(milestone.month),
      title: getMilestoneDescription(milestone),
      description: milestone.amount
        ? formatCurrency(milestone.amount)
        : undefined,
      icon: getMilestoneIcon(milestone.type),
      value: index,
      ui: {
        indicator: bgClass,
      },
    };
  });
});

// Instrument adjustments
interface InstrumentUpdate {
  personId: number;
  income: Record<number, Partial<IncomeSource>>;
  savings: Record<number, Partial<SavingsAccount>>;
  loans: Record<number, Partial<Loan>>;
  brokers: Record<number, Partial<BrokerAccount>>;
}

interface InstrumentAdjustment {
  income?: Record<number, Partial<IncomeSource>>;
  savings?: Record<number, Partial<SavingsAccount>>;
  loans?: Record<number, Partial<Loan>>;
  brokers?: Record<number, Partial<BrokerAccount>>;
}

const instrumentAdjustments = ref<Record<number, InstrumentAdjustment>>({});

// Store baseline projection (original data before any adjustments)
const baselineProjection = ref<{
  yearlyNetWorth: number[];
  yearlySavings: number[];
  yearlyInvestments: number[];
  yearlyDebt: number[];
} | null>(null);

// Store original current state (before any adjustments)
const originalCurrentState = ref<{
  netWorth: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  debt: number;
} | null>(null);

// Capture original current state on first load
watch(
  data,
  (newData) => {
    if (newData && !originalCurrentState.value) {
      originalCurrentState.value = {
        netWorth: newData.currentState.netWorth,
        monthlyIncome: newData.currentState.monthlyIncome,
        monthlyExpenses: newData.currentState.monthlyExpenses,
        debt: newData.currentState.debt,
      };
    }
  },
  { immediate: true }
);

// Capture baseline (0 growth) when Global Assumptions are enabled
watch(enableGlobalAssumptions, (enabled, wasEnabled) => {
  if (enabled && !wasEnabled && data.value) {
    // Store scroll position before capturing baseline
    const scrollY = window.scrollY;

    // When enabling, capture current state as baseline (should be 0 growth)
    baselineProjection.value = {
      yearlyNetWorth: getYearlyNetWorth(),
      yearlySavings: getYearlySavings(),
      yearlyInvestments: getYearlyInvestments(),
      yearlyDebt: getYearlyDebt(),
    };

    // Restore scroll position
    nextTick(() => {
      window.scrollTo(0, scrollY);
    });
  }
});

// Handle instrument updates
const handleInstrumentUpdate = (updateData: InstrumentUpdate) => {
  // Store only the instrument data that actually has changes (non-empty objects)
  const adjustment: InstrumentAdjustment = {};

  if (Object.keys(updateData.income).length > 0) {
    adjustment.income = updateData.income;
  }
  if (Object.keys(updateData.savings).length > 0) {
    adjustment.savings = updateData.savings;
  }
  if (Object.keys(updateData.loans).length > 0) {
    adjustment.loans = updateData.loans;
  }
  if (Object.keys(updateData.brokers).length > 0) {
    adjustment.brokers = updateData.brokers;
  }

  instrumentAdjustments.value[updateData.personId] = adjustment;
  debouncedUpdate();
};

// Debounce updates with scroll preservation
let updateTimeout: NodeJS.Timeout | null = null;
const debouncedUpdate = () => {
  if (updateTimeout) clearTimeout(updateTimeout);

  // Store current scroll position
  const scrollY = window.scrollY;

  updateTimeout = setTimeout(() => {
    updateParams({
      incomeGrowth: activeIncomeGrowth.value,
      expenseGrowth: activeExpenseGrowth.value,
      savingsRate: 0, // Always use individual account interest rates
      investmentReturn: activeInvestmentReturn.value,
      adjustments: instrumentAdjustments.value,
    });

    // Restore scroll position after Vue updates the DOM
    nextTick(() => {
      window.scrollTo(0, scrollY);
    });
  }, 500);
};

// Initialize with data from API
watch(
  data,
  (newData) => {
    if (newData && !updateTimeout) {
      incomeGrowth.value = newData.inputs.incomeGrowthRate;
      expenseGrowth.value = newData.inputs.expenseGrowthRate;
      investmentReturn.value = newData.inputs.investmentReturnRate;
    }
  },
  { immediate: true }
);

// Initialize with 0 growth rates on mount (since toggle starts as disabled)
onMounted(() => {
  updateParams({
    incomeGrowth: 0,
    expenseGrowth: 0,
    savingsRate: 0, // Always 0 - use individual account rates
    investmentReturn: 0,
  });
});

// Milestone helpers
const formatMilestoneTime = (month: number) => {
  if (month <= 12) {
    return `${t("projections.month")} ${month}`;
  }
  const years = Math.floor((month - 1) / 12);
  const months = month - years * 12;
  if (months === 0) {
    return `${t("projections.year")} ${years}`;
  }
  return `${t("projections.year")} ${years}, ${t(
    "projections.month"
  )} ${months}`;
};

const getMilestoneDescription = (milestone: any) => {
  if (milestone.type === "net_worth_milestone" && milestone.amount) {
    const amount = formatCurrencyCompact(milestone.amount);
    return t("projections.reachedNetWorth", { amount });
  }
  return milestone.description;
};

const getMilestoneIcon = (type: string) => {
  switch (type) {
    case "debt_free":
      return "i-heroicons-check-circle";
    case "net_worth_milestone":
      return "i-heroicons-trophy";
    case "savings_goal":
      return "i-heroicons-star";
    default:
      return "i-heroicons-flag";
  }
};

const getMilestoneColor = (type: string) => {
  switch (type) {
    case "debt_free":
      return "text-green-500";
    case "net_worth_milestone":
      return "text-yellow-500";
    case "savings_goal":
      return "text-blue-500";
    default:
      return "text-purple-500";
  }
};
</script>
