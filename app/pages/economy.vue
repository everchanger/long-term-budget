<template>
  <div>
    <div class="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-neutral-900 dark:text-white">
            {{ $t("navigation.economyOverview") }}
          </h1>
        </div>

        <!-- Main Content -->
        <div v-if="userHousehold" class="space-y-6">
          <!-- Overview Stats -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            <div>
              <p class="text-sm text-neutral-600 dark:text-neutral-400">
                {{ $t("household.created") }}
              </p>
              <p class="font-semibold text-lg text-neutral-900 dark:text-white">
                {{ new Date(userHousehold.createdAt).toLocaleDateString() }}
              </p>
            </div>

            <div>
              <p class="text-sm text-neutral-600 dark:text-neutral-400">
                {{ $t("household.members") }}
              </p>
              <p class="font-semibold text-lg text-neutral-900 dark:text-white">
                {{ householdMembersText }}
              </p>
            </div>

            <div v-if="financialSummary">
              <p class="text-sm text-neutral-600 dark:text-neutral-400">
                {{ $t("financialHealth.netWorth") }}
              </p>
              <p
                class="font-semibold text-lg"
                :class="
                  netWorth >= 0
                    ? 'text-neutral-900 dark:text-neutral-100'
                    : 'text-neutral-700 dark:text-neutral-300'
                "
              >
                {{ formatCurrency(netWorth) }}
              </p>
            </div>

            <div>
              <p class="text-sm text-neutral-600 dark:text-neutral-400">
                {{ $t("household.planning") }}
              </p>
              <UButton
                to="/scenarios"
                variant="ghost"
                size="sm"
                class="p-0 h-auto text-left justify-start font-semibold text-lg"
              >
                {{ $t("household.viewScenarios") }}
              </UButton>
            </div>
          </div>

          <!-- Members Section -->
          <div
            class="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700"
          >
            <div
              class="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <div
                    class="w-8 h-8 bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center mr-3"
                  >
                    <UIcon
                      name="i-heroicons-users"
                      class="w-4 h-4 text-neutral-600 dark:text-neutral-400"
                    />
                  </div>
                  <h3
                    class="text-lg font-medium text-neutral-900 dark:text-white"
                  >
                    {{ $t("household.members") }}
                  </h3>
                </div>
                <UButton
                  v-if="householdMembers.length > 0"
                  size="sm"
                  variant="soft"
                  icon="i-heroicons-plus"
                  data-testid="add-person-button"
                  @click="openAddPersonModal"
                >
                  {{ $t("household.addMember") }}
                </UButton>
              </div>
            </div>

            <div class="p-6">
              <div v-if="householdMembers.length > 0" class="space-y-4">
                <div
                  v-for="member in householdMembers"
                  :key="member.id"
                  class="p-6 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div class="flex items-center mb-4 sm:mb-0">
                    <div
                      class="w-12 h-12 bg-neutral-200 dark:bg-neutral-700 rounded-full flex items-center justify-center mr-4"
                    >
                      <span
                        class="text-neutral-700 dark:text-neutral-300 font-semibold"
                        >{{ member.name.charAt(0).toUpperCase() }}</span
                      >
                    </div>
                    <div class="flex-grow">
                      <p
                        class="font-semibold text-lg text-neutral-900 dark:text-white"
                      >
                        {{ member.name }}
                      </p>
                      <p class="text-sm text-neutral-600 dark:text-neutral-400">
                        {{
                          member.age
                            ? `${$t("person.age")}: ${member.age}`
                            : $t("household.ageNotSpecified")
                        }}
                      </p>
                    </div>
                  </div>
                  <div class="flex flex-col sm:flex-row gap-3 sm:justify-end">
                    <UButton
                      :to="`/persons/${member.id}`"
                      size="lg"
                      variant="solid"
                      icon="i-heroicons-chart-bar"
                      class="w-full sm:w-auto justify-center"
                      :data-testid="`person-${member.id}-manage-button`"
                    >
                      {{ $t("household.manageFinances") }}
                    </UButton>
                    <UButton
                      size="lg"
                      variant="soft"
                      color="error"
                      icon="i-heroicons-trash"
                      class="w-full sm:w-auto justify-center"
                      :data-testid="`person-${member.id}-delete-button`"
                      @click="openDeletePersonModal(member)"
                      >{{ $t("common.delete") }}</UButton
                    >
                  </div>
                </div>
              </div>

              <div v-else class="text-center py-12">
                <div
                  class="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <UIcon
                    name="i-heroicons-user-group"
                    class="w-8 h-8 text-neutral-400"
                  />
                </div>
                <h4
                  class="text-lg font-medium text-neutral-900 dark:text-white mb-2"
                >
                  {{ $t("household.noMembersYet") }}
                </h4>
                <p class="text-neutral-600 dark:text-neutral-400 mb-6">
                  {{ $t("household.addFirstMemberDesc") }}
                </p>
                <UButton
                  variant="soft"
                  icon="i-heroicons-plus"
                  data-testid="add-person-button"
                  @click="openAddPersonModal"
                >
                  {{ $t("household.addFirstMember") }}
                </UButton>
              </div>
            </div>
          </div>

          <!-- Financial Summary Section -->
          <div
            v-if="financialSummary && householdMembers.length > 0"
            class="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700"
          >
            <div
              class="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700"
            >
              <div class="flex items-center">
                <div
                  class="w-8 h-8 bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center mr-3"
                >
                  <UIcon
                    name="i-heroicons-chart-bar"
                    class="w-4 h-4 text-neutral-600 dark:text-neutral-400"
                  />
                </div>
                <div>
                  <h3
                    class="text-lg font-medium text-neutral-900 dark:text-white"
                  >
                    {{ $t("household.financialOverview") }}
                  </h3>
                  <p class="text-sm text-neutral-600 dark:text-neutral-400">
                    {{ $t("household.combinedFinances") }}
                  </p>
                </div>
              </div>
            </div>

            <div class="p-6">
              <div
                class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6"
              >
                <!-- Monthly Income -->
                <div
                  class="bg-neutral-50 dark:bg-neutral-900 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700"
                >
                  <div>
                    <p
                      class="text-sm font-medium text-neutral-600 dark:text-neutral-400"
                    >
                      {{ $t("household.monthlyIncome") }}
                    </p>
                    <p
                      class="text-2xl font-bold text-neutral-900 dark:text-white"
                    >
                      {{ formatCurrency(financialSummary.totalMonthlyIncome) }}
                    </p>
                    <p class="text-xs text-neutral-500 dark:text-neutral-500">
                      {{ formatCurrency(financialSummary.totalAnnualIncome) }}
                      {{ $t("household.annually") }}
                    </p>
                  </div>
                </div>

                <!-- Total Savings -->
                <div
                  class="bg-neutral-50 dark:bg-neutral-900 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700"
                >
                  <div>
                    <p
                      class="text-sm font-medium text-neutral-600 dark:text-neutral-400"
                    >
                      {{ $t("household.totalSavings") }}
                    </p>
                    <p
                      class="text-2xl font-bold text-neutral-900 dark:text-white"
                    >
                      {{ formatCurrency(financialSummary.totalSavings) }}
                    </p>
                    <p class="text-xs text-neutral-500 dark:text-neutral-500">
                      {{ financialSummary.savingsAccountsCount }}
                      {{ $t("household.accounts") }}
                    </p>
                  </div>
                </div>

                <!-- Total Debt -->
                <div
                  class="bg-neutral-50 dark:bg-neutral-900 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700"
                >
                  <div>
                    <p
                      class="text-sm font-medium text-neutral-600 dark:text-neutral-400"
                    >
                      {{ $t("household.totalDebt") }}
                    </p>
                    <p
                      class="text-2xl font-bold text-neutral-900 dark:text-white"
                    >
                      {{ formatCurrency(financialSummary.totalDebt) }}
                    </p>
                    <p class="text-xs text-neutral-500 dark:text-neutral-500">
                      {{ financialSummary.loansCount }}
                      {{ $t("loans.title").toLowerCase() }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Net Worth Summary -->
              <div
                class="bg-neutral-50 dark:bg-neutral-800 p-6 rounded-lg border border-neutral-200 dark:border-neutral-700"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center">
                    <div
                      class="w-12 h-12 bg-neutral-100 dark:bg-neutral-700 rounded-xl flex items-center justify-center mr-4"
                    >
                      <UIcon
                        name="i-heroicons-trophy"
                        class="w-6 h-6 text-neutral-600 dark:text-neutral-400"
                      />
                    </div>
                    <div>
                      <p
                        class="text-lg font-medium text-neutral-900 dark:text-white"
                      >
                        {{ $t("household.estimatedNetWorth") }}
                      </p>
                      <p class="text-sm text-neutral-600 dark:text-neutral-400">
                        {{ $t("household.savingsMinusDebt") }}
                      </p>
                    </div>
                  </div>
                  <p
                    class="text-3xl font-bold text-neutral-900 dark:text-neutral-100"
                  >
                    {{ formatCurrency(netWorth) }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Budget Expenses Section -->
          <div
            v-if="userHousehold"
            class="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700"
          >
            <div
              class="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <div
                    class="w-8 h-8 bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center mr-3"
                  >
                    <UIcon
                      name="i-heroicons-currency-dollar"
                      class="w-4 h-4 text-neutral-600 dark:text-neutral-400"
                    />
                  </div>
                  <div>
                    <h3
                      class="text-lg font-medium text-neutral-900 dark:text-white"
                    >
                      {{ $t("household.fixedMonthlyExpenses") }}
                    </h3>
                    <p class="text-sm text-neutral-600 dark:text-neutral-400">
                      {{ $t("household.rentUtilitiesEtc") }}
                    </p>
                  </div>
                </div>
                <UButton
                  size="sm"
                  variant="soft"
                  icon="i-heroicons-plus"
                  data-testid="add-budget-expense-button"
                  @click="openBudgetExpenseModal()"
                >
                  {{ $t("household.addExpense") }}
                </UButton>
              </div>
            </div>

            <div class="p-6">
              <div v-if="budgetExpensesLoading" class="text-center py-8">
                <UIcon
                  name="i-heroicons-arrow-path"
                  class="animate-spin h-6 w-6 mx-auto mb-2 text-neutral-600"
                />
                <p class="text-sm text-neutral-600 dark:text-neutral-400">
                  {{ $t("household.loadingExpenses") }}
                </p>
              </div>

              <div
                v-else-if="budgetExpenses.length === 0"
                class="text-center py-8"
              >
                <UIcon
                  name="i-heroicons-currency-dollar"
                  class="h-12 w-12 mx-auto mb-3 text-neutral-400"
                />
                <p class="text-neutral-600 dark:text-neutral-400 mb-2">
                  {{ $t("household.noBudgetExpenses") }}
                </p>
                <p class="text-sm text-neutral-500 dark:text-neutral-500">
                  {{ $t("household.addFixedExpenses") }}
                </p>
              </div>

              <div v-else class="space-y-3">
                <TransitionGroup name="list" tag="div" class="space-y-3">
                  <div
                    v-for="expense in budgetExpenses"
                    :key="expense.id"
                    class="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg transition-all hover:shadow-md"
                    :data-testid="`budget-expense-${expense.id}`"
                  >
                    <div class="flex items-center gap-3">
                      <div
                        class="w-10 h-10 bg-white dark:bg-neutral-800 rounded-lg flex items-center justify-center"
                      >
                        <UIcon
                          :name="getCategoryIcon(expense.category)"
                          class="w-5 h-5 text-neutral-600 dark:text-neutral-400"
                        />
                      </div>
                      <div>
                        <p class="font-medium text-neutral-900 dark:text-white">
                          {{ expense.name }}
                        </p>
                        <p
                          class="text-sm text-neutral-600 dark:text-neutral-400"
                        >
                          {{ formatCurrency(parseFloat(expense.amount))
                          }}{{ $t("time.perMonth") }}
                        </p>
                      </div>
                    </div>

                    <div class="flex items-center gap-2">
                      <UButton
                        variant="ghost"
                        size="sm"
                        icon="i-heroicons-pencil"
                        :data-testid="`edit-budget-expense-${expense.id}`"
                        @click="openBudgetExpenseModal(expense)"
                      />
                      <UButton
                        variant="ghost"
                        size="sm"
                        icon="i-heroicons-trash"
                        :data-testid="`delete-budget-expense-${expense.id}`"
                        @click="confirmDeleteBudgetExpense(expense)"
                      />
                    </div>
                  </div>
                </TransitionGroup>

                <!-- Total -->
                <div
                  class="pt-3 border-t border-neutral-200 dark:border-neutral-700"
                >
                  <div class="flex items-center justify-between mb-2">
                    <p
                      class="text-sm font-medium text-neutral-600 dark:text-neutral-400"
                    >
                      {{ $t("economy.totalMonthlyExpenses") }}
                    </p>
                    <p
                      class="text-lg font-bold text-neutral-900 dark:text-white"
                    >
                      {{ formatCurrency(totalMonthlyExpenses) }}
                    </p>
                  </div>
                  <div class="flex items-center justify-between">
                    <p class="text-xs text-neutral-500 dark:text-neutral-500">
                      {{ $t("economy.projectedAnnualCost") }}
                    </p>
                    <p
                      class="text-sm font-medium text-neutral-600 dark:text-neutral-400"
                    >
                      {{ formatCurrency(totalMonthlyExpenses * 12) }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Savings Goals Section -->
          <div
            v-if="userHousehold && householdMembers.length > 0"
            class="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700"
          >
            <div
              class="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <div
                    class="w-8 h-8 bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center mr-3"
                  >
                    <UIcon
                      name="i-heroicons-flag"
                      class="w-4 h-4 text-neutral-600 dark:text-neutral-400"
                    />
                  </div>
                  <div>
                    <h3
                      class="text-lg font-medium text-neutral-900 dark:text-white"
                    >
                      {{ $t("savingsGoals.title") }}
                    </h3>
                    <p class="text-sm text-neutral-600 dark:text-neutral-400">
                      {{ $t("savingsGoals.trackYourObjectives") }}
                    </p>
                  </div>
                </div>
                <UButton
                  size="sm"
                  variant="soft"
                  icon="i-heroicons-plus"
                  @click="() => openSavingsGoalModal()"
                >
                  {{ $t("savingsGoals.addGoal") }}
                </UButton>
              </div>
            </div>

            <div class="p-6">
              <div v-if="savingsGoalsLoading" class="text-center py-8">
                <UIcon
                  name="i-heroicons-arrow-path"
                  class="animate-spin h-6 w-6 mx-auto mb-2 text-neutral-600"
                />
                <p class="text-sm text-neutral-600 dark:text-neutral-400">
                  {{ $t("savingsGoals.loadingGoals") }}
                </p>
              </div>

              <div v-else-if="activeGoals.length > 0" class="space-y-4">
                <div
                  v-for="goal in activeGoals"
                  :key="goal.id"
                  class="p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700"
                >
                  <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center">
                      <div class="mr-3">
                        <h4
                          class="font-semibold text-neutral-900 dark:text-white"
                        >
                          {{ goal.name }}
                        </h4>
                        <p
                          v-if="goal.description"
                          class="text-sm text-neutral-600 dark:text-neutral-400"
                        >
                          {{ goal.description }}
                        </p>
                      </div>
                      <div v-if="goal.priority" class="flex items-center">
                        <UBadge
                          :color="
                            goal.priority === 3
                              ? 'error'
                              : goal.priority === 2
                              ? 'warning'
                              : 'success'
                          "
                          size="sm"
                        >
                          {{
                            goal.priority === 3
                              ? "High"
                              : goal.priority === 2
                              ? "Medium"
                              : "Low"
                          }}
                          Priority
                        </UBadge>
                      </div>
                    </div>
                    <div class="flex items-center space-x-2">
                      <UButton
                        size="sm"
                        variant="ghost"
                        icon="i-heroicons-pencil"
                        @click="editSavingsGoal(goal)"
                      />
                      <UButton
                        size="sm"
                        variant="ghost"
                        color="error"
                        icon="i-heroicons-trash"
                        @click="deleteSavingsGoal(goal.id)"
                      />
                    </div>
                  </div>

                  <!-- Progress Bar -->
                  <div class="mb-3">
                    <div class="flex justify-between text-sm mb-1">
                      <span class="text-neutral-600 dark:text-neutral-400">{{
                        $t("savingsGoals.progress")
                      }}</span>
                      <span class="font-medium"
                        >{{ getGoalProgress(goal).toFixed(1) }}%</span
                      >
                    </div>
                    <div
                      class="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2"
                    >
                      <div
                        class="bg-neutral-600 dark:bg-neutral-400 h-2 rounded-full transition-all duration-300"
                        :style="{
                          width: `${Math.min(getGoalProgress(goal), 100)}%`,
                        }"
                      />
                    </div>
                    <div
                      class="flex justify-between text-xs text-neutral-500 dark:text-neutral-500 mt-1"
                    >
                      <span>{{ formatCurrency(goal.currentAmount) }}</span>
                      <span>{{
                        formatCurrency(parseFloat(goal.targetAmount))
                      }}</span>
                    </div>
                  </div>

                  <!-- Goal Details -->
                  <div class="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p class="text-neutral-600 dark:text-neutral-400">
                        {{ $t("savingsGoals.remaining") }}
                      </p>
                      <p class="font-medium">
                        {{ formatCurrency(getRemainingAmount(goal)) }}
                      </p>
                    </div>
                    <div v-if="goal.category">
                      <p class="text-neutral-600 dark:text-neutral-400">
                        {{ $t("savingsGoals.category") }}
                      </p>
                      <p class="font-medium capitalize">
                        {{ goal.category.replace("-", " ") }}
                      </p>
                    </div>
                    <div
                      v-if="
                        financialSummary &&
                        financialSummary.totalMonthlyIncome > 0
                      "
                    >
                      <p class="text-neutral-600 dark:text-neutral-400">
                        {{ $t("savingsGoals.timeToGoal") }}
                      </p>
                      <p class="font-medium">
                        {{ getEstimatedCompletionTime(goal) || "N/A" }}
                      </p>
                    </div>
                  </div>

                  <!-- Quick Actions -->
                  <div
                    class="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700"
                  >
                    <div class="flex items-center justify-between">
                      <div class="flex items-center space-x-2">
                        <UButton
                          v-if="getGoalProgress(goal) >= 100"
                          size="sm"
                          variant="soft"
                          color="success"
                          @click="markGoalAsCompleted(goal)"
                        >
                          {{ $t("savingsGoals.markComplete") }}
                        </UButton>
                      </div>
                      <p class="text-xs text-neutral-500 dark:text-neutral-500">
                        {{ $t("savingsGoals.created") }}
                        {{ new Date(goal.createdAt).toLocaleDateString() }}
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Summary Stats -->
                <div
                  class="mt-6 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700"
                >
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="text-center">
                      <p
                        class="text-2xl font-bold text-neutral-900 dark:text-neutral-100"
                      >
                        {{ formatCurrency(parseFloat(totalTargetAmount)) }}
                      </p>
                      <p class="text-sm text-neutral-600 dark:text-neutral-400">
                        {{ $t("savingsGoals.totalGoalAmount") }}
                      </p>
                    </div>
                    <div class="text-center">
                      <p
                        class="text-2xl font-bold text-neutral-900 dark:text-neutral-100"
                      >
                        {{ formatCurrency(parseFloat(totalCurrentAmount)) }}
                      </p>
                      <p class="text-sm text-neutral-600 dark:text-neutral-400">
                        {{ $t("savingsGoals.totalSaved") }}
                      </p>
                    </div>
                    <div class="text-center">
                      <p
                        class="text-2xl font-bold text-neutral-900 dark:text-neutral-100"
                      >
                        {{ totalProgress.toFixed(1) }}%
                      </p>
                      <p class="text-sm text-neutral-600 dark:text-neutral-400">
                        {{ $t("savingsGoals.overallProgress") }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div v-else class="text-center py-12">
                <div
                  class="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <UIcon
                    name="i-heroicons-flag"
                    class="w-8 h-8 text-neutral-600 dark:text-neutral-400"
                  />
                </div>
                <h4
                  class="text-lg font-medium text-neutral-900 dark:text-white mb-2"
                >
                  {{ $t("savingsGoals.noGoalsYet") }}
                </h4>
                <p class="text-neutral-600 dark:text-neutral-400 mb-6">
                  {{ $t("savingsGoals.setFirstGoal") }}
                </p>
                <UButton
                  variant="soft"
                  icon="i-heroicons-plus"
                  @click="() => openSavingsGoalModal()"
                >
                  {{ $t("savingsGoals.createFirstGoal") }}
                </UButton>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Savings Goal Modal -->
      <SavingsGoalModal
        v-model:open="isSavingsGoalModalOpen"
        :household-id="userHousehold?.id"
        :loading="isSavingsGoalSubmitting"
        :editing-goal="editingSavingsGoal"
        @submit="handleSavingsGoalSubmit"
        @cancel="closeSavingsGoalModal"
      />

      <!-- Budget Expense Modal -->
      <BudgetExpenseModal
        v-model:open="isBudgetExpenseModalOpen"
        :expense="editingBudgetExpense || undefined"
        @submit="handleBudgetExpenseSubmit"
      />

      <!-- Add/Edit Person Modal -->
      <UModal v-model:open="isPersonModalOpen">
        <template #header>
          <h3 class="text-lg font-semibold">
            {{ editingPerson ? "Edit Member" : "Add Member" }}
          </h3>
        </template>

        <template #body>
          <div class="space-y-4">
            <div>
              <label
                for="person-name"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Name *
              </label>
              <input
                id="person-name"
                v-model="personFormState.name"
                type="text"
                placeholder="Enter person's name"
                required
                data-testid="person-name-input"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label
                for="person-age"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Age
              </label>
              <input
                id="person-age"
                v-model="personFormState.age"
                type="number"
                placeholder="Enter age (optional)"
                min="0"
                max="120"
                data-testid="person-age-input"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        </template>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton variant="ghost" @click="closePersonModal">Cancel</UButton>
            <UButton
              :loading="isPersonSubmitting"
              :disabled="!isPersonFormValid"
              data-testid="person-modal-submit-button"
              @click="handlePersonSubmit"
            >
              {{ editingPerson ? "Update" : "Add" }} Member
            </UButton>
          </div>
        </template>
      </UModal>

      <!-- Delete Person Confirmation Modal -->
      <UModal v-model:open="isDeletePersonModalOpen">
        <template #header>
          <h3 class="text-lg font-semibold text-red-600">Delete Member</h3>
        </template>

        <template #body>
          <div class="space-y-3">
            <p>
              Are you sure you want to delete
              <strong>{{ personToDelete?.name }}</strong
              >?
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              This action cannot be undone. All associated financial data will
              also be removed.
            </p>
          </div>
        </template>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton variant="ghost" @click="closeDeletePersonModal"
              >Cancel</UButton
            >
            <UButton
              color="error"
              :loading="isDeletingPerson"
              data-testid="confirm-delete-person-button"
              @click="confirmPersonDelete"
            >
              Delete Member
            </UButton>
          </div>
        </template>
      </UModal>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ApiSuccessResponse } from "~~/server/utils/api-response";
import type { BudgetExpense } from "~/composables/useBudgetExpenses";
import { getCategoryIcon } from "~~/utils/budget-categories";

const { t } = useI18n();
const { formatCurrency } = useFormatters();

// Page metadata
definePageMeta({
  title: "Economy",
  requiresAuth: true,
});

// Types
interface Household {
  id: number;
  name: string;
  createdAt: string;
}

interface Person {
  id: number;
  name: string;
  age: number | null;
  householdId: number;
}

interface FinancialSummary {
  totalMonthlyIncome: number;
  totalAnnualIncome: number;
  totalSavings: number;
  totalDebt: number;
  memberCount: number;
  incomeSourcesCount: number;
  loansCount: number;
  savingsAccountsCount: number;
}

// Reactive state
const isPersonModalOpen = ref(false);
const isDeletePersonModalOpen = ref(false);
const isPersonSubmitting = ref(false);
const isDeletingPerson = ref(false);
const editingPerson = ref<Person | null>(null);
const personToDelete = ref<Person | null>(null);

// Person form state
const personFormState = reactive({
  name: "",
  age: null as number | null,
});

// Note: This is now only used for person creation, household filtering is done by the API

// Fetch data
const { data: householdsResponse } = await useFetch<
  ApiSuccessResponse<Household[]>
>("/api/households");
const households = computed(() => householdsResponse.value?.data ?? []);

const { data: personsResponse, refresh: refreshPersons } = await useFetch<
  ApiSuccessResponse<Person[]>
>("/api/persons");
const persons = computed(() => personsResponse.value?.data ?? []);

// Computed properties
const userHousehold = computed(() => {
  // Since the API now returns only the current user's households, just take the first one
  if (
    !households.value ||
    !Array.isArray(households.value) ||
    households.value.length === 0
  )
    return null;
  return households.value[0] || null;
});

const householdMembers = computed(() => {
  if (!userHousehold.value || !persons.value || !Array.isArray(persons.value))
    return [];
  return persons.value.filter(
    (p: Person) => p.householdId === userHousehold.value!.id
  );
});

const householdMembersCount = computed(() => householdMembers.value.length);

// Fetch financial summary for the household - using watchEffect to handle reactivity properly
const financialSummary = ref<FinancialSummary | null>(null);
const refreshFinancialSummary = async () => {
  if (userHousehold.value) {
    try {
      const response = await $fetch<ApiSuccessResponse<FinancialSummary>>(
        `/api/households/${userHousehold.value.id}/financial-summary`
      );
      financialSummary.value = response.data;
    } catch (error) {
      console.error("Failed to fetch financial summary:", error);
      financialSummary.value = null;
    }
  } else {
    financialSummary.value = null;
  }
};

// Watch for changes in userHousehold and refresh financial summary
watchEffect(() => {
  if (userHousehold.value) {
    refreshFinancialSummary();
  }
});

const householdMembersText = computed(() => {
  const count = householdMembersCount.value;
  if (count === 1) {
    return "1 person";
  } else {
    return `${count} people`;
  }
});

// Methods
const isPersonFormValid = computed(() => {
  return personFormState.name.trim() !== "";
});

const netWorth = computed(() => {
  if (!financialSummary.value) return 0;
  return financialSummary.value.totalSavings - financialSummary.value.totalDebt;
});

// Person Management Methods
function openAddPersonModal() {
  editingPerson.value = null;
  resetPersonForm();
  isPersonModalOpen.value = true;
}

function closePersonModal() {
  isPersonModalOpen.value = false;
  editingPerson.value = null;
  resetPersonForm();
}

function resetPersonForm() {
  personFormState.name = "";
  personFormState.age = null;
}

function openDeletePersonModal(person: Person) {
  personToDelete.value = person;
  isDeletePersonModalOpen.value = true;
}

function closeDeletePersonModal() {
  isDeletePersonModalOpen.value = false;
  personToDelete.value = null;
}

async function handlePersonSubmit() {
  if (!isPersonFormValid.value || !userHousehold.value) return;

  isPersonSubmitting.value = true;

  try {
    const payload = {
      name: personFormState.name.trim(),
      age: personFormState.age,
      householdId: userHousehold.value.id,
    };

    if (editingPerson.value) {
      // Update existing person
      await $fetch(`/api/persons/${editingPerson.value.id}`, {
        method: "PUT",
        body: payload,
      });
    } else {
      // Create new person
      await $fetch("/api/persons", {
        method: "POST",
        body: payload,
      });
    }

    await refreshPersons();
    closePersonModal();

    // Show success notification
    const toast = useToast();
    toast.add({
      title: editingPerson.value ? "Member updated" : "Member added",
      description: `${personFormState.name} has been ${
        editingPerson.value ? "updated" : "added"
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
    isPersonSubmitting.value = false;
  }
}

async function confirmPersonDelete() {
  if (!personToDelete.value) return;

  isDeletingPerson.value = true;

  try {
    await $fetch(`/api/persons/${personToDelete.value.id}`, {
      method: "DELETE",
    });

    await refreshPersons();
    closeDeletePersonModal();

    // Show success notification
    const toast = useToast();
    toast.add({
      title: "Member deleted",
      description: `${personToDelete.value.name} has been removed.`,
      color: "success",
    });
  } catch (error: unknown) {
    const toast = useToast();
    toast.add({
      title: "Error",
      description:
        error instanceof Error ? error.message : "Failed to delete member",
      color: "error",
    });
  } finally {
    isDeletingPerson.value = false;
  }
}

// Savings Goals Management
const savingsGoalsHouseholdId = computed(
  () => userHousehold.value?.id.toString() || ""
);

// Direct modal state management (like person modal)
const isSavingsGoalModalOpen = ref(false);
const isSavingsGoalSubmitting = ref(false);
const editingSavingsGoal = ref<(typeof activeGoals.value)[0] | null>(null);

const openSavingsGoalModal = () => {
  console.log("Opening savings goal modal");
  isSavingsGoalModalOpen.value = true;
  editingSavingsGoal.value = null;
};

const editSavingsGoal = (goal: (typeof activeGoals.value)[0]) => {
  editingSavingsGoal.value = goal;
  isSavingsGoalModalOpen.value = true;
};

const closeSavingsGoalModal = () => {
  isSavingsGoalModalOpen.value = false;
  editingSavingsGoal.value = null;
};

// Get the other functions from the composable
const {
  savingsGoals: _savingsGoalsData,
  savingsGoalsLoading,
  activeGoals,
  totalTargetAmount,
  totalCurrentAmount,
  totalProgress,
  getGoalProgress,
  getRemainingAmount,
  getEstimatedCompletionTime,
  createSavingsGoal,
  updateSavingsGoal,
  deleteSavingsGoal,
  markGoalAsCompleted,
} = useSavingsGoals(savingsGoalsHouseholdId);

// Budget Expenses Management
const isBudgetExpenseModalOpen = ref(false);
const editingBudgetExpense = ref<BudgetExpense | null>(null);

const {
  budgetExpenses,
  loading: budgetExpensesLoading,
  totalMonthlyExpenses,
  fetchBudgetExpenses,
  createBudgetExpense,
  updateBudgetExpense,
  deleteBudgetExpense,
} = useBudgetExpenses();

// Fetch budget expenses on mount
onMounted(() => {
  fetchBudgetExpenses();
});

const openBudgetExpenseModal = (expense?: BudgetExpense) => {
  editingBudgetExpense.value = expense || null;
  isBudgetExpenseModalOpen.value = true;
};

const closeBudgetExpenseModal = () => {
  isBudgetExpenseModalOpen.value = false;
  editingBudgetExpense.value = null;
};

const handleBudgetExpenseSubmit = async (formData: {
  name: string;
  amount: string;
  category: string;
}) => {
  const toast = useToast();
  try {
    if (editingBudgetExpense.value) {
      await updateBudgetExpense(editingBudgetExpense.value.id, formData);
      toast.add({
        title: "Expense Updated",
        description: `${formData.name} has been updated successfully.`,
        color: "success",
      });
    } else {
      await createBudgetExpense(formData);
      toast.add({
        title: "Expense Added",
        description: `${formData.name} has been added to your budget.`,
        color: "success",
      });
    }
    closeBudgetExpenseModal();
  } catch (error) {
    console.error("Failed to save budget expense:", error);
    toast.add({
      title: "Error",
      description:
        error instanceof Error ? error.message : "Failed to save expense",
      color: "error",
    });
  }
};

const confirmDeleteBudgetExpense = async (expense: BudgetExpense) => {
  if (confirm(`Are you sure you want to delete "${expense.name}"?`)) {
    const toast = useToast();
    try {
      await deleteBudgetExpense(expense.id);
      toast.add({
        title: "Expense Deleted",
        description: `${expense.name} has been removed from your budget.`,
        color: "success",
      });
    } catch (error) {
      console.error("Failed to delete budget expense:", error);
      toast.add({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete expense",
        color: "error",
      });
    }
  }
};

// Handle savings goal submission
const handleSavingsGoalSubmit = async (formData: {
  name: string;
  description: string;
  targetAmount: string;
  priority: number;
  category: string;
  savingsAccountIds: number[];
}) => {
  isSavingsGoalSubmitting.value = true;
  try {
    if (editingSavingsGoal.value) {
      await updateSavingsGoal(editingSavingsGoal.value.id, formData);
    } else {
      await createSavingsGoal(formData);
    }
    closeSavingsGoalModal();
  } catch (error) {
    console.error("Error saving goal:", error);
  } finally {
    isSavingsGoalSubmitting.value = false;
  }
};
</script>

<style scoped>
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}
.list-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}
.list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
.list-move {
  transition: transform 0.3s ease;
}
</style>
