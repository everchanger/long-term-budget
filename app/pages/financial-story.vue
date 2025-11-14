<template>
  <div class="min-h-screen text-white overflow-hidden">
    <!-- Loading State -->
    <div
      v-if="loading"
      class="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-800"
    >
      <div class="text-center">
        <div
          class="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-white mb-4"
        />
        <p class="text-xl">{{ $t("financialStory.loading") }}</p>
      </div>
    </div>

    <!-- Story Slides -->
    <div
      v-else-if="data"
      class="h-screen overflow-y-scroll snap-y snap-mandatory scroll-smooth"
    >
      <!-- Slide 1: Welcome -->
      <section
        class="snap-start snap-always h-screen flex items-center justify-center p-8 relative bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900"
      >
        <!-- Animated Background Shapes -->
        <div
          class="absolute inset-0 overflow-hidden pointer-events-none opacity-20"
        >
          <div
            class="absolute top-10 left-10 w-72 h-72 bg-yellow-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob"
          />
          <div
            class="absolute top-20 right-10 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"
          />
          <div
            class="absolute bottom-10 left-1/2 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"
          />
        </div>

        <div class="text-center max-w-4xl animate-fade-in relative z-10">
          <h1
            class="text-6xl md:text-8xl font-black mb-6 bg-gradient-to-r from-yellow-200 to-pink-200 bg-clip-text text-transparent"
          >
            {{ $t("financialStory.yourFinancialSnapshot") }}
          </h1>
          <p class="text-2xl md:text-3xl mb-12 text-purple-100">
            {{ $t("financialStory.whereYouStandNow") }}
          </p>
          <div class="text-lg text-purple-200 animate-bounce">
            {{ $t("financialStory.scrollToExplore") }}
          </div>
        </div>
      </section>

      <!-- Slide 2: Household Overview -->
      <section
        class="snap-start snap-always h-screen flex items-center justify-center p-8 relative bg-gradient-to-br from-blue-900 via-cyan-900 to-teal-900"
      >
        <!-- Animated Background Shapes -->
        <div
          class="absolute inset-0 overflow-hidden pointer-events-none opacity-15"
        >
          <div
            class="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-400 rotate-45 transform animate-float"
            style="clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)"
          />
          <div
            class="absolute bottom-1/4 right-1/4 w-80 h-80 bg-teal-400 rounded-3xl animate-spin-slow"
          />
          <div
            class="absolute top-1/2 right-1/3 w-64 h-64 bg-blue-400 animate-pulse-slow"
            style="
              clip-path: polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%);
            "
          />
        </div>

        <div class="text-center max-w-4xl space-y-8 relative z-10">
          <h2 class="text-5xl md:text-7xl font-black mb-8">
            {{ $t("financialStory.yourHousehold") }}
          </h2>
          <p class="text-2xl md:text-3xl text-cyan-100 mb-12">
            {{
              householdPersons.length === 1
                ? $t("financialStory.flyingSolo")
                : $t("financialStory.householdHas")
            }}
            <span class="font-bold text-yellow-300">{{
              householdPersons.length
            }}</span>
            {{
              householdPersons.length === 1 ? "" : $t("financialStory.people")
            }}
            {{
              householdPersons.length === 1
                ? ""
                : $t("financialStory.buildingWealthTogether")
            }}
          </p>
          <div class="flex justify-center gap-6 flex-wrap">
            <NuxtLink
              v-for="person in householdPersons"
              :key="person.id"
              :to="`/persons/${person.id}`"
              class="bg-white/10 backdrop-blur-lg rounded-2xl p-6 transform hover:scale-105 transition-transform cursor-pointer hover:bg-white/20"
            >
              <div class="text-xl font-semibold">{{ person.name }}</div>
              <div v-if="person.age" class="text-sm text-cyan-200 mt-1">
                {{ $t("financialStory.age") }} {{ person.age }}
              </div>
            </NuxtLink>
          </div>
        </div>
      </section>

      <!-- Slide 3: Total Income (The Big Number) -->
      <section
        class="snap-start snap-always h-screen flex items-center justify-center p-8 relative bg-gradient-to-br from-green-900 via-emerald-900 to-teal-900"
      >
        <!-- Animated Background Shapes -->
        <div
          class="absolute inset-0 overflow-hidden pointer-events-none opacity-20"
        >
          <div class="absolute top-0 left-0 w-full h-full">
            <div
              class="absolute top-10 left-20 w-40 h-40 bg-green-400 rounded-full animate-bounce-slow"
            />
            <div
              class="absolute top-40 right-32 w-32 h-32 bg-emerald-400 rounded-full animate-bounce-slow animation-delay-1000"
            />
            <div
              class="absolute bottom-20 left-1/3 w-48 h-48 bg-teal-400 rounded-full animate-bounce-slow animation-delay-2000"
            />
            <div
              class="absolute top-1/2 right-20 w-36 h-36 bg-green-300 rounded-full animate-bounce-slow animation-delay-3000"
            />
          </div>
          <div
            class="absolute inset-0 bg-gradient-to-t from-green-900/50 to-transparent"
          />
        </div>

        <div class="text-center max-w-4xl relative z-10">
          <p class="text-2xl md:text-3xl mb-6 text-emerald-100">
            {{ $t("financialStory.monthlyIncome") }}
          </p>
          <h2 class="text-7xl md:text-9xl font-black mb-8 text-green-300">
            {{ formatCurrency(data.cashFlow.monthly.income) }}
          </h2>
          <p class="text-xl md:text-2xl text-emerald-100/80">
            {{ $t("financialStory.flowingInEachMonth") }}
          </p>
          <div class="mt-12 text-lg text-emerald-200">
            {{ $t("financialStory.annual") }}:
            <span class="font-bold text-yellow-300">{{
              formatCurrency(data.cashFlow.monthly.income * 12)
            }}</span>
          </div>
        </div>
      </section>

      <!-- Slide 4: Money Flow Animation -->
      <section
        class="snap-start snap-always h-screen flex items-center justify-center p-8 relative overflow-hidden bg-gradient-to-br from-slate-900 via-gray-900 to-zinc-900"
      >
        <!-- Animated Background Shapes -->
        <div
          class="absolute inset-0 overflow-hidden pointer-events-none opacity-10"
        >
          <div
            class="absolute top-1/4 left-10 w-64 h-2 bg-gradient-to-r from-transparent via-white to-transparent animate-slide-right"
          />
          <div
            class="absolute top-1/2 right-10 w-64 h-2 bg-gradient-to-r from-transparent via-white to-transparent animate-slide-left animation-delay-1000"
          />
          <div
            class="absolute bottom-1/4 left-1/4 w-64 h-2 bg-gradient-to-r from-transparent via-white to-transparent animate-slide-right animation-delay-2000"
          />
          <svg
            class="absolute inset-0 w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="20%"
              cy="30%"
              r="100"
              fill="rgba(59, 130, 246, 0.1)"
              class="animate-pulse-slow"
            />
            <circle
              cx="80%"
              cy="60%"
              r="120"
              fill="rgba(239, 68, 68, 0.1)"
              class="animate-pulse-slow animation-delay-1000"
            />
            <circle
              cx="50%"
              cy="80%"
              r="90"
              fill="rgba(34, 197, 94, 0.1)"
              class="animate-pulse-slow animation-delay-2000"
            />
          </svg>
        </div>

        <MoneyFlowVisualization
          :income="data.cashFlow.monthly.income"
          :expenses="data.cashFlow.monthly.expenses"
          :savings="
            data.cashFlow.monthly.netCashFlow > 0
              ? data.cashFlow.monthly.netCashFlow
              : 0
          "
          :debt="data.cashFlow.monthly.debtPayments"
        />
      </section>

      <!-- Slide 5: Net Worth -->
      <section
        class="snap-start snap-always h-screen flex items-center justify-center p-8 relative bg-gradient-to-br from-violet-900 via-purple-900 to-fuchsia-900"
      >
        <!-- Animated Background Shapes -->
        <div
          class="absolute inset-0 overflow-hidden pointer-events-none opacity-15"
        >
          <div
            class="absolute top-20 left-1/4 w-72 h-12 bg-green-400 rotate-12 animate-slide-up"
            style="clip-path: polygon(0 0, 100% 0, 95% 100%, 5% 100%)"
          />
          <div
            class="absolute bottom-32 right-1/4 w-72 h-12 bg-red-400 -rotate-12 animate-slide-down animation-delay-1000"
            style="clip-path: polygon(0 0, 100% 0, 95% 100%, 5% 100%)"
          />
          <div
            class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 border-4 border-purple-400 rounded-full animate-ping-slow"
          />
        </div>

        <div class="text-center max-w-4xl relative z-10">
          <p class="text-3xl md:text-4xl mb-6 text-purple-100">
            {{ $t("financialStory.currentNetWorth") }}
          </p>
          <h2
            class="text-7xl md:text-9xl font-black mb-8"
            :class="
              data.netWorth.total >= 0 ? 'text-green-300' : 'text-orange-300'
            "
          >
            {{ formatCurrency(data.netWorth.total) }}
          </h2>
          <div class="grid grid-cols-2 gap-6 mt-12 max-w-2xl mx-auto">
            <div
              class="bg-white/10 backdrop-blur-lg rounded-2xl p-6 transform hover:scale-105 transition-transform"
            >
              <div class="text-sm text-purple-200 mb-2">
                {{ $t("financialStory.assets") }}
              </div>
              <div class="text-3xl font-bold text-green-300">
                {{ formatCurrency(data.netWorth.assets) }}
              </div>
            </div>
            <div
              class="bg-white/10 backdrop-blur-lg rounded-2xl p-6 transform hover:scale-105 transition-transform"
            >
              <div class="text-sm text-purple-200 mb-2">
                {{ $t("financialStory.debts") }}
              </div>
              <div class="text-3xl font-bold text-red-300">
                {{ formatCurrency(data.netWorth.liabilities) }}
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Slide 6: Savings Rate -->
      <section
        class="snap-start snap-always h-screen flex items-center justify-center p-8 relative bg-gradient-to-br from-amber-900 via-orange-900 to-red-900"
      >
        <!-- Animated Background Shapes -->
        <div
          class="absolute inset-0 overflow-hidden pointer-events-none opacity-20"
        >
          <div
            class="absolute top-1/4 left-10 w-full h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent animate-slide-right-slow"
          />
          <div
            class="absolute top-1/2 left-10 w-full h-1 bg-gradient-to-r from-transparent via-orange-400 to-transparent animate-slide-right-slow animation-delay-2000"
          />
          <div
            class="absolute top-3/4 left-10 w-full h-1 bg-gradient-to-r from-transparent via-red-400 to-transparent animate-slide-right-slow animation-delay-4000"
          />
          <div
            class="absolute bottom-20 right-20 w-64 h-64 bg-yellow-400 rounded-full filter blur-3xl animate-pulse-slow"
          />
        </div>

        <div class="text-center max-w-4xl relative z-10">
          <p class="text-3xl md:text-4xl mb-6 text-orange-100">
            {{ $t("financialStory.savingsRate") }}
          </p>
          <h2 class="text-7xl md:text-9xl font-black mb-8 text-yellow-300">
            {{ data.cashFlow.savingsRate.toFixed(1) }}%
          </h2>
          <p class="text-2xl md:text-3xl text-orange-100 mb-8">
            {{ $t("financialStory.ofIncomeSaved") }}
          </p>

          <!-- Progress bar -->
          <div class="max-w-2xl mx-auto">
            <div class="h-8 bg-white/20 rounded-full overflow-hidden">
              <div
                class="h-full bg-gradient-to-r from-yellow-400 to-green-400 transition-all duration-1000 flex items-center justify-end pr-4"
                :style="{
                  width: `${Math.min(data.cashFlow.savingsRate, 100)}%`,
                }"
              >
                <span class="text-sm font-bold"
                  >{{ data.cashFlow.savingsRate.toFixed(1) }}%</span
                >
              </div>
            </div>
            <div class="flex justify-between text-sm text-blue-200 mt-2">
              <span>0%</span>
              <span>{{ $t("financialStory.recommended") }}: 20%</span>
              <span>100%</span>
            </div>
          </div>

          <div v-if="data.cashFlow.savingsRate >= 20" class="mt-12 text-2xl">
            {{ $t("financialStory.savingsRateExcellent") }}
          </div>
          <div
            v-else-if="data.cashFlow.savingsRate >= 10"
            class="mt-12 text-2xl"
          >
            {{ $t("financialStory.savingsRateGood") }}
          </div>
          <div v-else class="mt-12 text-2xl">
            {{ $t("financialStory.savingsRateFair") }}
          </div>
        </div>
      </section>

      <!-- Slide 7: Emergency Fund -->
      <section
        class="snap-start snap-always h-screen flex items-center justify-center p-8 relative bg-gradient-to-br from-sky-900 via-blue-900 to-indigo-900"
      >
        <!-- Animated Background Shapes -->
        <div
          class="absolute inset-0 overflow-hidden pointer-events-none opacity-15"
        >
          <div
            class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border-8 border-blue-400 rounded-full animate-ping-slower"
          />
          <div
            class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border-8 border-cyan-400 rounded-full animate-ping-slower animation-delay-2000"
          />
          <div
            class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] border-8 border-sky-400 rounded-full animate-ping-slower animation-delay-4000"
          />
        </div>

        <div class="text-center max-w-4xl relative z-10">
          <p class="text-3xl md:text-4xl mb-6 text-blue-100">
            {{ $t("financialStory.safetyNet") }}
          </p>
          <h2 class="text-7xl md:text-9xl font-black mb-8 text-cyan-300">
            {{ data.emergencyFund.monthsOfExpenses.toFixed(1) }}
          </h2>
          <p class="text-2xl md:text-3xl text-blue-100 mb-8">
            {{ $t("financialStory.monthsCovered") }}
          </p>

          <div class="max-w-md mx-auto space-y-4">
            <div class="flex items-center gap-3 text-left">
              <div class="text-3xl">
                {{ data.emergencyFund.monthsOfExpenses >= 6 ? "✅" : "⏳" }}
              </div>
              <div>
                <div class="font-semibold">
                  {{ $t("financialStory.sixMonthsIdeal") }}
                </div>
                <div class="text-sm text-blue-200">
                  {{ $t("financialStory.ultimateSafety") }}
                </div>
              </div>
            </div>
            <div class="flex items-center gap-3 text-left">
              <div class="text-3xl">
                {{ data.emergencyFund.monthsOfExpenses >= 3 ? "✅" : "⏳" }}
              </div>
              <div>
                <div class="font-semibold">
                  {{ $t("financialStory.threeMonthsGood") }}
                </div>
                <div class="text-sm text-blue-200">
                  {{ $t("financialStory.solidCushion") }}
                </div>
              </div>
            </div>
            <div class="flex items-center gap-3 text-left">
              <div class="text-3xl">
                {{ data.emergencyFund.monthsOfExpenses >= 1 ? "✅" : "⏳" }}
              </div>
              <div>
                <div class="font-semibold">
                  {{ $t("financialStory.oneMonthStart") }}
                </div>
                <div class="text-sm text-blue-200">
                  {{ $t("financialStory.buildingUp") }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Slide 8: Debt-to-Income -->
      <section
        v-if="data.debtToIncome.ratio > 0"
        class="h-screen flex items-center justify-center p-8 relative bg-gradient-to-br from-rose-900 via-pink-900 to-red-900"
      >
        <!-- Animated Background Shapes -->
        <div
          class="absolute inset-0 overflow-hidden pointer-events-none opacity-15"
        >
          <div
            class="absolute top-10 left-10 w-40 h-40 bg-pink-400 animate-bounce-slow"
            style="clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)"
          />
          <div
            class="absolute bottom-10 right-10 w-40 h-40 bg-rose-400 animate-bounce-slow animation-delay-2000"
            style="clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)"
          />
          <div
            class="absolute top-1/3 right-1/4 w-32 h-32 bg-red-400 rotate-45 animate-spin-very-slow"
          />
        </div>

        <div class="text-center max-w-4xl relative z-10">
          <p class="text-3xl md:text-4xl mb-6 text-pink-100">
            {{ $t("financialStory.debtToIncomeRatio") }}
          </p>
          <h2 class="text-7xl md:text-9xl font-black mb-8 text-rose-300">
            {{ data.debtToIncome.ratio.toFixed(1) }}%
          </h2>

          <div class="max-w-2xl mx-auto mb-8">
            <div class="h-8 bg-white/20 rounded-full overflow-hidden">
              <div
                class="h-full transition-all duration-1000 flex items-center justify-end pr-4"
                :class="
                  data.debtToIncome.ratio <= 36
                    ? 'bg-gradient-to-r from-green-400 to-blue-400'
                    : 'bg-gradient-to-r from-yellow-400 to-red-400'
                "
                :style="{ width: `${Math.min(data.debtToIncome.ratio, 100)}%` }"
              >
                <span class="text-sm font-bold"
                  >{{ data.debtToIncome.ratio.toFixed(1) }}%</span
                >
              </div>
            </div>
            <div class="flex justify-between text-sm text-blue-200 mt-2">
              <span>{{ $t("financialStory.noDebt") }}</span>
              <span>{{ $t("financialStory.healthyDebt") }}</span>
              <span>50%+</span>
            </div>
          </div>

          <div
            v-if="data.debtToIncome.ratio <= 36"
            class="text-2xl text-green-300"
          >
            {{ $t("financialStory.debtExcellent") }}
          </div>
          <div v-else class="text-2xl text-yellow-300">
            {{ $t("financialStory.debtFocusOnReducing") }}
          </div>
        </div>
      </section>

      <!-- Slide 9: Fun Stat -->
      <section
        class="snap-start snap-always h-screen flex items-center justify-center p-8 relative bg-gradient-to-br from-lime-900 via-green-900 to-emerald-900"
      >
        <!-- Animated Background Shapes -->
        <div
          class="absolute inset-0 overflow-hidden pointer-events-none opacity-15"
        >
          <div
            class="absolute top-20 left-20 w-64 h-64 bg-lime-400 rounded-full animate-float"
          />
          <div
            class="absolute bottom-32 right-32 w-48 h-48 bg-green-400 rounded-full animate-float animation-delay-1000"
          />
        </div>

        <div class="text-center max-w-4xl relative z-10">
          <p class="text-2xl md:text-3xl mb-6 text-lime-100">
            {{ $t("financialStory.monthlySavingsEquals") }}
          </p>
          <h2 class="text-7xl md:text-9xl font-black mb-8 text-yellow-300">
            {{ Math.floor(Math.max(0, data.cashFlow.monthly.netCashFlow) / 5) }}
          </h2>
          <p class="text-2xl md:text-3xl text-lime-100">
            {{ $t("financialStory.fancyLattes") }}
          </p>
          <div class="mt-12 space-y-4 text-xl text-lime-200">
            <div>
              {{ $t("financialStory.or") }}
              {{
                Math.floor(Math.max(0, data.cashFlow.monthly.netCashFlow) / 15)
              }}
              {{ $t("financialStory.movieTickets") }}
            </div>
            <div>
              {{ $t("financialStory.or") }}
              {{
                Math.floor(Math.max(0, data.cashFlow.monthly.netCashFlow) / 60)
              }}
              {{ $t("financialStory.niceDinners") }}
            </div>
          </div>
        </div>
      </section>

      <!-- Slide 10: The Finale -->
      <section
        class="snap-start snap-always h-screen flex items-center justify-center p-8 relative bg-gradient-to-br from-indigo-900 via-violet-900 to-purple-900"
      >
        <!-- Animated Background Shapes - Celebration Theme -->
        <div
          class="absolute inset-0 overflow-hidden pointer-events-none opacity-25"
        >
          <div
            class="absolute top-10 left-10 w-4 h-4 bg-yellow-400 rounded-full animate-float"
          />
          <div
            class="absolute top-20 right-20 w-6 h-6 bg-pink-400 rounded-full animate-float animation-delay-500"
          />
          <div
            class="absolute bottom-20 left-20 w-5 h-5 bg-cyan-400 rounded-full animate-float animation-delay-1000"
          />
          <div
            class="absolute bottom-40 right-40 w-4 h-4 bg-green-400 rounded-full animate-float animation-delay-1500"
          />
          <div
            class="absolute top-1/3 left-1/4 w-3 h-3 bg-orange-400 rounded-full animate-float animation-delay-2000"
          />
          <div
            class="absolute top-2/3 right-1/3 w-5 h-5 bg-purple-400 rounded-full animate-float animation-delay-2500"
          />
          <svg
            class="absolute inset-0 w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            <polygon
              points="50,10 90,90 10,90"
              fill="rgba(251,191,36,0.2)"
              class="animate-spin-very-slow"
              transform-origin="50 50"
            />
            <rect
              x="200"
              y="100"
              width="60"
              height="60"
              fill="rgba(236,72,153,0.2)"
              class="animate-spin-very-slow animation-delay-2000"
              transform-origin="230 130"
            />
          </svg>
        </div>

        <div class="text-center max-w-4xl space-y-12 relative z-10">
          <div class="text-7xl">✨</div>
          <h2
            class="text-5xl md:text-7xl font-black mb-6 bg-gradient-to-r from-yellow-200 via-pink-200 to-purple-200 bg-clip-text text-transparent"
          >
            {{ $t("financialStory.yourFinancialSnapshot") }}
          </h2>
          <div class="space-y-6 text-xl md:text-2xl text-violet-100">
            <div v-if="data.summary.overallHealth === 'excellent'">
              {{ $t("financialStory.financialHealth") }}:
              <span class="text-green-300 font-bold">{{
                $t("financialStory.healthExcellent")
              }}</span>
              🌟
            </div>
            <div v-else-if="data.summary.overallHealth === 'good'">
              {{ $t("financialStory.financialHealth") }}:
              <span class="text-blue-300 font-bold">{{
                $t("financialStory.healthGood")
              }}</span>
              💪
            </div>
            <div v-else-if="data.summary.overallHealth === 'fair'">
              {{ $t("financialStory.financialHealth") }}:
              <span class="text-yellow-300 font-bold">{{
                $t("financialStory.healthFair")
              }}</span>
              📈
            </div>
            <div v-else>
              {{ $t("financialStory.financialHealth") }}:
              <span class="text-orange-300 font-bold">{{
                $t("financialStory.healthBuilding")
              }}</span>
              🚀
            </div>
            <p class="text-lg text-violet-200">
              {{ $t("financialStory.keepMovingForward") }}
            </p>
          </div>

          <div class="flex gap-4 justify-center pt-8 flex-wrap">
            <UButton
              size="xl"
              color="neutral"
              variant="solid"
              @click="navigateTo('/projections')"
            >
              {{ $t("financialStory.detailedProjections") }}
            </UButton>
            <UButton
              size="xl"
              color="neutral"
              variant="outline"
              @click="shareStory"
            >
              <UIcon name="i-heroicons-share" class="mr-2" />
              {{ $t("financialStory.shareSnapshot") }}
            </UButton>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useFinancialHealth } from "~/composables/useFinancialHealth";

definePageMeta({
  middleware: "auth",
});

// Fetch current user's households
const { data: householdsResponse } = await useFetch("/api/households");
const households = computed(() => householdsResponse.value?.data ?? []);

// Get first household
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

// Use financial health composable
const currentHouseholdId = computed(() => userHousehold.value?.id ?? null);
const { data, loading, formatCurrency } =
  useFinancialHealth(currentHouseholdId);

// Get household persons - fetch all persons and filter by household
const { data: allPersonsResponse } = await useFetch("/api/persons");
const householdPersons = computed(() => {
  const response = allPersonsResponse.value;
  if (!response || !response.data) return [];
  const persons = Array.isArray(response.data) ? response.data : [];
  const householdId = userHousehold.value?.id;
  if (!householdId) return [];
  return persons.filter((p) => p.householdId === householdId);
});

// Share functionality
const shareStory = async () => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: "My Financial Story",
        text: `Check out my financial journey! 💰`,
        url: window.location.href,
      });
    } catch {
      // Share cancelled or failed
      console.log("Share cancelled");
    }
  } else {
    // Fallback: copy link
    await navigator.clipboard.writeText(window.location.href);
    alert("Link copied to clipboard!");
  }
};
</script>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes blob {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(30px, -50px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
}

@keyframes bounce-slow {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-25px);
  }
}

@keyframes slide-right {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(200%);
  }
}

@keyframes slide-left {
  from {
    transform: translateX(200%);
  }
  to {
    transform: translateX(-100%);
  }
}

@keyframes slide-right-slow {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(200%);
  }
}

@keyframes slide-up {
  from {
    transform: translateY(100px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes slide-down {
  from {
    transform: translateY(-100px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes ping-slow {
  75%,
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}

@keyframes ping-slower {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  75%,
  100% {
    transform: scale(2);
    opacity: 0;
  }
}

@keyframes spin-slow {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes spin-very-slow {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-fade-in {
  animation: fade-in 1s ease-out;
}

.animate-pulse-slow {
  animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.animate-blob {
  animation: blob 7s ease-in-out infinite;
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}

.animate-bounce-slow {
  animation: bounce-slow 3s ease-in-out infinite;
}

.animate-slide-right {
  animation: slide-right 3s linear infinite;
}

.animate-slide-left {
  animation: slide-left 3s linear infinite;
}

.animate-slide-right-slow {
  animation: slide-right-slow 8s linear infinite;
}

.animate-slide-up {
  animation: slide-up 1s ease-out;
}

.animate-slide-down {
  animation: slide-down 1s ease-out;
}

.animate-ping-slow {
  animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
}

.animate-ping-slower {
  animation: ping-slower 3s cubic-bezier(0, 0, 0.2, 1) infinite;
}

.animate-spin-slow {
  animation: spin-slow 8s linear infinite;
}

.animate-spin-very-slow {
  animation: spin-very-slow 20s linear infinite;
}

.animation-delay-500 {
  animation-delay: 0.5s;
}

.animation-delay-1000 {
  animation-delay: 1s;
}

.animation-delay-1500 {
  animation-delay: 1.5s;
}

.animation-delay-2000 {
  animation-delay: 2s;
}

.animation-delay-2500 {
  animation-delay: 2.5s;
}

.animation-delay-3000 {
  animation-delay: 3s;
}

.animation-delay-4000 {
  animation-delay: 4s;
}

/* Smooth scrolling */
html {
  scroll-behavior: smooth;
}

/* Smooth snap scrolling */
.snap-y {
  scroll-snap-type: y mandatory;
  scroll-padding: 0;
}

.snap-start {
  scroll-snap-align: start;
}

.snap-always {
  scroll-snap-stop: always;
}

/* Add momentum and smooth deceleration */
.overflow-y-scroll {
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
}

/* Hide scrollbar but keep functionality */
.overflow-y-scroll::-webkit-scrollbar {
  display: none;
}

.overflow-y-scroll {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
