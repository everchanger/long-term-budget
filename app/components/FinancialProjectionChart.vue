<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold">10-Year Financial Projection</h3>
        <div class="flex gap-2">
          <UButton
            :color="selectedMetric === 'netWorth' ? 'primary' : 'neutral'"
            size="xs"
            @click="selectedMetric = 'netWorth'"
          >
            Net Worth
          </UButton>
          <UButton
            :color="selectedMetric === 'components' ? 'primary' : 'neutral'"
            size="xs"
            @click="selectedMetric = 'components'"
          >
            Breakdown
          </UButton>
        </div>
      </div>
    </template>

    <div class="space-y-4">
      <!-- Chart Container -->
      <div class="h-[400px] w-full">
        <svg
          ref="chartSvg"
          class="w-full h-full"
          :viewBox="`0 0 ${width} ${height}`"
          preserveAspectRatio="xMidYMid meet"
        >
          <!-- Background grid -->
          <g class="grid">
            <line
              v-for="i in 5"
              :key="`h-${i}`"
              :x1="padding.left"
              :y1="
                padding.top + ((height - padding.top - padding.bottom) / 5) * i
              "
              :x2="width - padding.right"
              :y2="
                padding.top + ((height - padding.top - padding.bottom) / 5) * i
              "
              stroke="currentColor"
              stroke-opacity="0.1"
              stroke-width="1"
            />
            <line
              v-for="i in 11"
              :key="`v-${i}`"
              :x1="
                padding.left +
                ((width - padding.left - padding.right) / 10) * (i - 1)
              "
              :y1="padding.top"
              :x2="
                padding.left +
                ((width - padding.left - padding.right) / 10) * (i - 1)
              "
              :y2="height - padding.bottom"
              stroke="currentColor"
              stroke-opacity="0.1"
              stroke-width="1"
            />
          </g>

          <!-- Y-axis labels -->
          <g class="y-axis-labels">
            <text
              v-for="(label, i) in yAxisLabels"
              :key="`y-${i}`"
              :x="padding.left - 10"
              :y="
                padding.top +
                ((height - padding.top - padding.bottom) / 5) * (5 - i)
              "
              text-anchor="end"
              alignment-baseline="middle"
              class="text-xs fill-gray-600 dark:fill-gray-400"
            >
              {{ label }}
            </text>
          </g>

          <!-- X-axis labels (years) -->
          <g class="x-axis-labels">
            <text
              v-for="i in 11"
              :key="`x-${i}`"
              :x="
                padding.left +
                ((width - padding.left - padding.right) / 10) * (i - 1)
              "
              :y="height - padding.bottom + 20"
              text-anchor="middle"
              class="text-xs fill-gray-600 dark:fill-gray-400"
            >
              {{ i - 1 }}
            </text>
          </g>

          <!-- Lines -->
          <g v-if="selectedMetric === 'netWorth'">
            <path
              :d="netWorthPath"
              fill="none"
              stroke="rgb(34, 197, 94)"
              stroke-width="2"
              class="drop-shadow-sm"
            />
          </g>

          <g v-else>
            <!-- Savings line -->
            <path
              :d="savingsPath"
              fill="none"
              stroke="rgb(59, 130, 246)"
              stroke-width="2"
              class="drop-shadow-sm"
            />
            <!-- Investments line -->
            <path
              :d="investmentsPath"
              fill="none"
              stroke="rgb(168, 85, 247)"
              stroke-width="2"
              class="drop-shadow-sm"
            />
            <!-- Debt line -->
            <path
              :d="debtPath"
              fill="none"
              stroke="rgb(239, 68, 68)"
              stroke-width="2"
              class="drop-shadow-sm"
            />
          </g>

          <!-- Data point tooltips (on hover) -->
          <g v-if="hoveredPoint">
            <circle
              :cx="hoveredPoint.x"
              :cy="hoveredPoint.y"
              r="5"
              fill="rgb(34, 197, 94)"
              class="drop-shadow-md"
            />
          </g>
        </svg>
      </div>

      <!-- Legend -->
      <div class="flex justify-center gap-6 text-sm">
        <div
          v-if="selectedMetric === 'netWorth'"
          class="flex items-center gap-2"
        >
          <div class="w-4 h-0.5 bg-green-500" />
          <span>Net Worth</span>
        </div>
        <template v-else>
          <div class="flex items-center gap-2">
            <div class="w-4 h-0.5 bg-blue-500" />
            <span>Savings</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-4 h-0.5 bg-purple-500" />
            <span>Investments</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-4 h-0.5 bg-red-500" />
            <span>Debt</span>
          </div>
        </template>
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
              (((endValue - startValue) / Math.abs(startValue)) * 100).toFixed(
                1
              )
            }}%
          </div>
        </div>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
interface Props {
  yearlyNetWorth: number[];
  yearlySavings: number[];
  yearlyInvestments: number[];
  yearlyDebt: number[];
}

const props = defineProps<Props>();

// Chart dimensions
const width = 800;
const height = 400;
const padding = { top: 20, right: 20, bottom: 40, left: 80 };

// Selected metric toggle
const selectedMetric = ref<"netWorth" | "components">("netWorth");

// Hovered point state
const hoveredPoint = ref<{ x: number; y: number } | null>(null);

// Calculate chart bounds
const chartWidth = width - padding.left - padding.right;
const chartHeight = height - padding.top - padding.bottom;

// Get data based on selected metric
const currentData = computed(() => {
  if (selectedMetric.value === "netWorth") {
    return props.yearlyNetWorth;
  }
  // For components view, use max of all three
  return props.yearlyNetWorth;
});

// Calculate Y-axis range
const minValue = computed(() => {
  if (selectedMetric.value === "netWorth") {
    return Math.min(...props.yearlyNetWorth, 0);
  }
  // For components, show from 0 to max net worth
  return 0;
});

const maxValue = computed(() => {
  if (selectedMetric.value === "netWorth") {
    return Math.max(...props.yearlyNetWorth);
  }
  // For components, get max of savings + investments
  const maxSavings = Math.max(...props.yearlySavings);
  const maxInvestments = Math.max(...props.yearlyInvestments);
  return Math.max(maxSavings + maxInvestments, ...props.yearlyNetWorth);
});

const valueRange = computed(() => maxValue.value - minValue.value);

// Y-axis labels
const yAxisLabels = computed(() => {
  const labels: string[] = [];
  for (let i = 0; i <= 5; i++) {
    const value = minValue.value + (valueRange.value / 5) * i;
    labels.push(formatCurrency(value));
  }
  return labels;
});

// Scale functions
const scaleX = (index: number) => {
  return padding.left + (chartWidth / 10) * index;
};

const scaleY = (value: number) => {
  const normalized = (value - minValue.value) / valueRange.value;
  return height - padding.bottom - normalized * chartHeight;
};

// Generate SVG path for net worth
const netWorthPath = computed(() => {
  const points = props.yearlyNetWorth.map((value, index) => {
    const x = scaleX(index);
    const y = scaleY(value);
    return `${index === 0 ? "M" : "L"} ${x} ${y}`;
  });
  return points.join(" ");
});

// Generate paths for components
const savingsPath = computed(() => {
  const points = props.yearlySavings.map((value, index) => {
    const x = scaleX(index);
    const y = scaleY(value);
    return `${index === 0 ? "M" : "L"} ${x} ${y}`;
  });
  return points.join(" ");
});

const investmentsPath = computed(() => {
  const points = props.yearlyInvestments.map((value, index) => {
    const x = scaleX(index);
    const y = scaleY(value);
    return `${index === 0 ? "M" : "L"} ${x} ${y}`;
  });
  return points.join(" ");
});

const debtPath = computed(() => {
  const points = props.yearlyDebt.map((value, index) => {
    const x = scaleX(index);
    const y = scaleY(value);
    return `${index === 0 ? "M" : "L"} ${x} ${y}`;
  });
  return points.join(" ");
});

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
const startValue = computed(() => currentData.value[0] || 0);
const endValue = computed(
  () => currentData.value[currentData.value.length - 1] || 0
);
</script>
