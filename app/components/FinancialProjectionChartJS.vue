<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold">10-Year Financial Projection</h3>
        <div class="flex gap-2">
          <UButton
            :color="selectedView === 'netWorth' ? 'primary' : 'neutral'"
            size="xs"
            @click="selectedView = 'netWorth'"
          >
            Net Worth
          </UButton>
          <UButton
            :color="selectedView === 'breakdown' ? 'primary' : 'neutral'"
            size="xs"
            @click="selectedView = 'breakdown'"
          >
            Assets
          </UButton>
          <UButton
            :color="selectedView === 'debt' ? 'primary' : 'neutral'"
            size="xs"
            @click="selectedView = 'debt'"
          >
            Debt
          </UButton>
        </div>
      </div>
    </template>

    <div class="space-y-4">
      <!-- Chart Container -->
      <div class="h-[400px] w-full">
        <Line :data="chartData" :options="chartOptions" />
      </div>

      <!-- Summary stats -->
      <div
        class="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700"
      >
        <div>
          <div class="text-xs text-gray-500 dark:text-gray-400">
            Starting Net Worth
          </div>
          <div class="text-lg font-semibold">
            {{ formatCurrency(startValue) }}
          </div>
        </div>
        <div>
          <div class="text-xs text-gray-500 dark:text-gray-400">
            Projected (10 Years)
          </div>
          <div class="text-lg font-semibold text-green-600 dark:text-green-400">
            {{ formatCurrency(endValue) }}
          </div>
        </div>
        <div>
          <div class="text-xs text-gray-500 dark:text-gray-400">
            Total Growth
          </div>
          <div class="text-lg font-semibold text-blue-600 dark:text-blue-400">
            {{ formatCurrency(endValue - startValue) }}
          </div>
        </div>
        <div>
          <div class="text-xs text-gray-500 dark:text-gray-400">
            Growth Rate
          </div>
          <div class="text-lg font-semibold">
            {{
              Math.abs(startValue) > 0
                ? (
                    ((endValue - startValue) / Math.abs(startValue)) *
                    100
                  ).toFixed(1)
                : "0.0"
            }}%
          </div>
        </div>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { Line } from "vue-chartjs";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions,
} from "chart.js";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface Props {
  yearlyNetWorth: number[];
  yearlySavings: number[];
  yearlyInvestments: number[];
  yearlyDebt: number[];
  baselineNetWorth?: number[];
  baselineSavings?: number[];
  baselineInvestments?: number[];
  baselineDebt?: number[];
}

const props = defineProps<Props>();

// Selected view toggle
const selectedView = ref<"netWorth" | "breakdown" | "debt">("netWorth");

// Generate year labels
const yearLabels = computed(() => {
  return Array.from({ length: 11 }, (_, i) => `Year ${i}`);
});

// Chart data
const chartData = computed(() => {
  if (selectedView.value === "netWorth") {
    const datasets = [
      {
        label: "Projected Net Worth",
        data: props.yearlyNetWorth,
        borderColor: "rgb(34, 197, 94)",
        backgroundColor: "rgba(34, 197, 94, 0.1)",
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ];

    // Add baseline if provided
    if (props.baselineNetWorth && props.baselineNetWorth.length > 0) {
      datasets.push({
        label: "Original Projection",
        data: props.baselineNetWorth,
        borderColor: "rgb(156, 163, 175)",
        backgroundColor: "rgba(156, 163, 175, 0.05)",
        borderWidth: 2,
        borderDash: [5, 5] as [number, number],
        fill: false,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 4,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
    }

    return {
      labels: yearLabels.value,
      datasets,
    };
  } else if (selectedView.value === "debt") {
    const datasets = [
      {
        label: "Debt Balance",
        data: props.yearlyDebt,
        borderColor: "rgb(239, 68, 68)",
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ];

    // Add baseline if provided
    if (props.baselineDebt && props.baselineDebt.length > 0) {
      datasets.push({
        label: "Original Debt",
        data: props.baselineDebt,
        borderColor: "rgb(156, 163, 175)",
        backgroundColor: "rgba(156, 163, 175, 0.05)",
        borderWidth: 2,
        borderDash: [5, 5] as [number, number],
        fill: false,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 4,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
    }

    return {
      labels: yearLabels.value,
      datasets,
    };
  } else {
    return {
      labels: yearLabels.value,
      datasets: [
        {
          label: "Savings",
          data: props.yearlySavings,
          borderColor: "rgb(59, 130, 246)",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          borderWidth: 2,
          fill: false,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 5,
        },
        {
          label: "Investments",
          data: props.yearlyInvestments,
          borderColor: "rgb(168, 85, 247)",
          backgroundColor: "rgba(168, 85, 247, 0.1)",
          borderWidth: 2,
          fill: false,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 5,
        },
      ],
    };
  }
});

// Chart options
const chartOptions = computed<ChartOptions<"line">>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: "index",
    intersect: false,
  },
  plugins: {
    legend: {
      display: true,
      position: "top",
      labels: {
        usePointStyle: true,
        padding: 15,
        font: {
          size: 12,
        },
      },
    },
    tooltip: {
      backgroundColor: "rgba(0, 0, 0, 0.8)",
      padding: 12,
      titleFont: {
        size: 14,
        weight: "bold",
      },
      bodyFont: {
        size: 13,
      },
      callbacks: {
        label: (context) => {
          const label = context.dataset.label || "";
          const value = context.parsed.y ?? 0;
          return `${label}: ${formatCurrency(value)}`;
        },
      },
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
    },
    y: {
      beginAtZero: false,
      ticks: {
        callback: (value) => {
          const num = value as number;
          if (Math.abs(num) >= 1_000_000) {
            return `$${(num / 1_000_000).toFixed(1)}M`;
          } else if (Math.abs(num) >= 1_000) {
            return `$${(num / 1_000).toFixed(0)}k`;
          }
          return `$${num.toFixed(0)}`;
        },
      },
    },
  },
}));

// Format currency
const formatCurrency = (value: number) => {
  const absValue = Math.abs(value);
  if (absValue >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  } else if (absValue >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}k`;
  }
  return `$${value.toFixed(0)}`;
};

// Summary stats
const startValue = computed(() => props.yearlyNetWorth[0] || 0);
const endValue = computed(
  () => props.yearlyNetWorth[props.yearlyNetWorth.length - 1] || 0
);
</script>
