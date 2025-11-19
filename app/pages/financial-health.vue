<template>
  <UPage>
    <UPageHeader
      :title="$t('financialHealth.dashboard')"
      :description="$t('financialHealth.subtitle')"
    />

    <UPageBody>
      <!-- Loading State -->
      <div v-if="loading" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <USkeleton v-for="i in 4" :key="i" class="h-64" />
      </div>

      <!-- Error State -->
      <UAlert
        v-else-if="error"
        color="error"
        variant="subtle"
        :title="$t('financialHealth.failedToLoad')"
        :description="error"
        class="mb-6"
      />

      <!-- Dashboard Content -->
      <div v-else-if="data" class="space-y-6">
        <!-- Overall Health Summary -->
        <UCard>
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-2xl font-bold mb-2">
                {{ $t("financialHealth.overallFinancialHealth") }}
              </h2>
              <p class="text-gray-600 dark:text-gray-400">
                {{ $t("financialHealth.overallHealthDesc") }}
              </p>
            </div>
            <UBadge
              :color="getStatusColor(data.summary.overallHealth)"
              variant="solid"
              size="xl"
              class="text-lg px-4 py-2"
            >
              <UIcon
                :name="getStatusIcon(data.summary.overallHealth)"
                class="w-6 h-6 mr-2"
              />
              {{ getStatusText(data.summary.overallHealth) }}
            </UBadge>
          </div>
        </UCard>

        <!-- Key Metrics Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <NetWorthCard
            :data="data"
            :format-currency="formatCurrency"
            :get-status-color="getStatusColor"
            :get-status-text="getStatusText"
          />

          <CashFlowCard
            :data="data"
            :format-currency="formatCurrency"
            :format-percent="formatPercent"
            :get-status-color="getStatusColor"
            :get-status-text="getStatusText"
          />

          <DebtToIncomeCard
            :data="data"
            :format-currency="formatCurrency"
            :format-percent="formatPercent"
            :get-status-color="getStatusColor"
            :get-status-text="getStatusText"
          />

          <EmergencyFundCard
            :data="data"
            :format-currency="formatCurrency"
            :get-status-color="getStatusColor"
            :get-status-text="getStatusText"
          />
        </div>

        <!-- Action Items / Recommendations -->
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">
              {{ $t("financialHealth.recommendedActions") }}
            </h3>
          </template>

          <div class="space-y-3">
            <div
              v-for="recommendation in recommendations"
              :key="recommendation.title"
              class="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <UIcon
                :name="recommendation.icon"
                class="w-5 h-5 mt-0.5"
                :class="recommendation.iconColor"
              />
              <div class="flex-1">
                <h4 class="font-semibold mb-1">{{ recommendation.title }}</h4>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  {{ recommendation.description }}
                </p>
              </div>
            </div>

            <div
              v-if="recommendations.length === 0"
              class="text-center py-8 text-gray-500 dark:text-gray-400"
            >
              <UIcon
                name="i-heroicons-trophy"
                class="w-12 h-12 mx-auto mb-2 text-green-500"
              />
              <p class="font-semibold">
                {{ $t("financialHealth.excellentWork") }}
              </p>
              <p class="text-sm">
                {{ $t("financialHealth.financesInGreatShape") }}
              </p>
            </div>
          </div>
        </UCard>
      </div>
    </UPageBody>
  </UPage>
</template>

<script setup lang="ts">
import { useFinancialHealth } from "~/composables/useFinancialHealth";
import NetWorthCard from "~/components/NetWorthCard.vue";
import CashFlowCard from "~/components/CashFlowCard.vue";
import DebtToIncomeCard from "~/components/DebtToIncomeCard.vue";
import EmergencyFundCard from "~/components/EmergencyFundCard.vue";

const { t } = useI18n();

definePageMeta({
  middleware: "auth",
});

// Fetch current user's households
const { data: householdsResponse } = await useFetch("/api/households");
const households = computed(() => householdsResponse.value?.data ?? []);

// Get first household (current user's household)
const userHousehold = computed(() => {
  if (
    !households.value ||
    !Array.isArray(households.value) ||
    households.value.length === 0
  ) {
    return null;
  }
  return households.value[0] || null;
});

// Use financial health composable with household ID
const currentHouseholdId = computed(() => userHousehold.value?.id ?? null);
const {
  data,
  loading,
  error,
  formatCurrency,
  formatPercent,
  getStatusColor,
  getStatusIcon,
  getStatusText,
} = useFinancialHealth(currentHouseholdId);

// Generate smart recommendations based on data
const recommendations = computed(() => {
  if (!data.value) return [];

  const recs: Array<{
    title: string;
    description: string;
    icon: string;
    iconColor: string;
    priority: number;
  }> = [];

  // Emergency fund recommendations
  if (data.value.emergencyFund.monthsOfExpenses < 3) {
    recs.push({
      title: t("financialHealth.buildEmergencyFund"),
      description: t("financialHealth.buildEmergencyFundDesc", {
        months: data.value.emergencyFund.monthsOfExpenses.toFixed(1),
      }),
      icon: "i-heroicons-shield-exclamation",
      iconColor: "text-red-500",
      priority: 1,
    });
  }

  // Debt-to-income recommendations
  if (data.value.debtToIncome.ratio > 36) {
    recs.push({
      title: t("financialHealth.reduceDebtBurden"),
      description: t("financialHealth.reduceDebtBurdenDesc", {
        ratio: data.value.debtToIncome.ratio.toFixed(1),
      }),
      icon: "i-heroicons-credit-card",
      iconColor: "text-orange-500",
      priority: 2,
    });
  }

  // Cash flow recommendations
  if (data.value.cashFlow.savingsRate < 10) {
    recs.push({
      title: t("financialHealth.increaseSavingsRate"),
      description: t("financialHealth.increaseSavingsRateDesc", {
        rate: data.value.cashFlow.savingsRate.toFixed(1),
      }),
      icon: "i-heroicons-arrow-trending-up",
      iconColor: "text-blue-500",
      priority: 3,
    });
  }

  // Net worth growth opportunity
  if (
    data.value.netWorth.total > 0 &&
    data.value.cashFlow.monthly.netCashFlow > 0
  ) {
    recs.push({
      title: t("financialHealth.investExcessCashFlow"),
      description: t("financialHealth.investExcessCashFlowDesc", {
        amount: formatCurrency(data.value.cashFlow.monthly.netCashFlow),
      }),
      icon: "i-heroicons-chart-bar",
      iconColor: "text-green-500",
      priority: 4,
    });
  }

  // Sort by priority
  return recs.sort((a, b) => a.priority - b.priority).slice(0, 3);
});
</script>
