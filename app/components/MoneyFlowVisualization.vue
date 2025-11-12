<template>
  <div class="w-full max-w-6xl mx-auto text-center relative">
    <h2 class="text-4xl md:text-5xl font-black mb-16 text-blue-100">
      Where Your Money Goes
    </h2>

    <div
      class="relative min-h-[600px] flex flex-col items-center justify-center"
    >
      <!-- Income Source (Top) -->
      <div class="mb-12 animate-float">
        <div class="text-6xl mb-4">💵</div>
        <div
          class="bg-green-500/20 backdrop-blur-lg rounded-3xl p-8 border-4 border-green-400 min-w-[300px]"
        >
          <div class="text-sm text-green-200 mb-2">Total Income</div>
          <div class="text-4xl font-black text-green-300">
            {{ formatCurrency(income) }}
          </div>
        </div>
      </div>

      <!-- Animated Flow Lines -->
      <svg
        class="absolute top-[160px] left-0 w-full h-[400px] pointer-events-none"
        viewBox="0 0 1000 400"
        preserveAspectRatio="xMidYMid meet"
      >
        <!-- Main flow line down -->
        <path
          d="M 500 0 L 500 120"
          stroke="rgba(255,255,255,0.3)"
          stroke-width="4"
          fill="none"
          stroke-dasharray="10,5"
          class="animate-dash"
        />

        <!-- Branches to categories -->
        <!-- To Expenses (left) -->
        <path
          d="M 500 120 Q 500 160, 250 240"
          stroke="rgba(239,68,68,0.5)"
          stroke-width="3"
          fill="none"
          stroke-dasharray="8,4"
          class="animate-dash"
          style="animation-delay: 0.3s"
        />
        <!-- To Debt (center) -->
        <path
          d="M 500 120 L 500 240"
          stroke="rgba(251,146,60,0.5)"
          stroke-width="3"
          fill="none"
          stroke-dasharray="8,4"
          class="animate-dash"
          style="animation-delay: 0.6s"
        />
        <!-- To Savings (right) -->
        <path
          d="M 500 120 Q 500 160, 750 240"
          stroke="rgba(34,197,94,0.5)"
          stroke-width="3"
          fill="none"
          stroke-dasharray="8,4"
          class="animate-dash"
          style="animation-delay: 0.9s"
        />
      </svg>

      <!-- Expense Categories (Bottom) -->
      <div
        class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 w-full max-w-4xl relative z-10"
      >
        <!-- Expenses -->
        <div
          class="bg-red-500/20 backdrop-blur-lg rounded-2xl p-6 border-2 border-red-400 transform hover:scale-105 transition-all animate-slide-up"
        >
          <div class="text-5xl mb-3">🛒</div>
          <div class="text-sm text-red-200 mb-2">Expenses</div>
          <div class="text-3xl font-bold text-red-300 mb-2">
            {{ formatCurrency(expenses) }}
          </div>
          <div class="text-xs text-red-200">
            {{ ((expenses / income) * 100).toFixed(1) }}% of income
          </div>
          <!-- Mini bar -->
          <div class="mt-3 h-2 bg-red-900/50 rounded-full overflow-hidden">
            <div
              class="h-full bg-red-400 transition-all duration-1000"
              :style="{ width: `${(expenses / income) * 100}%` }"
            />
          </div>
        </div>

        <!-- Debt -->
        <div
          class="bg-orange-500/20 backdrop-blur-lg rounded-2xl p-6 border-2 border-orange-400 transform hover:scale-105 transition-all animate-slide-up"
          style="animation-delay: 0.2s"
        >
          <div class="text-5xl mb-3">💳</div>
          <div class="text-sm text-orange-200 mb-2">Debt Payments</div>
          <div class="text-3xl font-bold text-orange-300 mb-2">
            {{ formatCurrency(debt) }}
          </div>
          <div class="text-xs text-orange-200">
            {{ ((debt / income) * 100).toFixed(1) }}% of income
          </div>
          <!-- Mini bar -->
          <div class="mt-3 h-2 bg-orange-900/50 rounded-full overflow-hidden">
            <div
              class="h-full bg-orange-400 transition-all duration-1000"
              :style="{ width: `${(debt / income) * 100}%` }"
            />
          </div>
        </div>

        <!-- Savings -->
        <div
          class="bg-green-500/20 backdrop-blur-lg rounded-2xl p-6 border-2 border-green-400 transform hover:scale-105 transition-all animate-slide-up"
          style="animation-delay: 0.4s"
        >
          <div class="text-5xl mb-3">💎</div>
          <div class="text-sm text-green-200 mb-2">Savings</div>
          <div class="text-3xl font-bold text-green-300 mb-2">
            {{ formatCurrency(savings) }}
          </div>
          <div class="text-xs text-green-200">
            {{ ((savings / income) * 100).toFixed(1) }}% of income
          </div>
          <!-- Mini bar -->
          <div class="mt-3 h-2 bg-green-900/50 rounded-full overflow-hidden">
            <div
              class="h-full bg-green-400 transition-all duration-1000"
              :style="{ width: `${(savings / income) * 100}%` }"
            />
          </div>
        </div>
      </div>

      <!-- Summary Text -->
      <div
        class="mt-16 text-xl md:text-2xl text-blue-100 animate-fade-in-delayed"
      >
        <div v-if="savings > 0">
          You're building wealth by saving
          <span class="font-bold text-green-300">{{
            formatCurrency(savings)
          }}</span>
          each month! 🚀
        </div>
        <div v-else-if="savings === 0">
          You're breaking even. Let's find ways to save more! 💪
        </div>
        <div v-else>
          Spending more than earning. Time to adjust the budget! ⚠️
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  income: number;
  expenses: number;
  savings: number;
  debt: number;
}

defineProps<Props>();

// Helper to format currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};
</script>

<style scoped>
@keyframes float {
  0%,
  100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes dash {
  to {
    stroke-dashoffset: -100;
  }
}

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fade-in-delayed {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}

.animate-dash {
  animation: dash 2s linear infinite;
}

.animate-slide-up {
  animation: slide-up 0.8s ease-out forwards;
  opacity: 0;
}

.animate-fade-in-delayed {
  animation: fade-in-delayed 1s ease-out 1.5s forwards;
  opacity: 0;
}
</style>
