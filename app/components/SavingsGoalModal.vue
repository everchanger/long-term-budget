<template>
  <UModal v-model:open="isOpen">
    <template #header>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        {{
          isEditing ? $t("savingsGoals.editGoal") : $t("savingsGoals.addGoal")
        }}
      </h3>
    </template>

    <template #body>
      <form class="space-y-6" @submit.prevent="handleSubmit">
        <!-- Goal Name -->
        <div>
          <label
            for="goal-name"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {{ $t("savingsGoals.goalNameRequired") }}
          </label>
          <input
            id="goal-name"
            v-model="formState.name"
            type="text"
            required
            :placeholder="$t('savingsGoals.goalNamePlaceholder')"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <!-- Description -->
        <div>
          <label
            for="goal-description"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {{ $t("savingsGoals.description") }}
          </label>
          <textarea
            id="goal-description"
            v-model="formState.description"
            rows="3"
            :placeholder="$t('savingsGoals.descriptionPlaceholder')"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <!-- Target Amount -->
        <div>
          <label
            for="goal-target-amount"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {{ $t("savingsGoals.targetAmountRequired") }}
          </label>
          <input
            id="goal-target-amount"
            v-model="formState.targetAmount"
            type="number"
            step="0.01"
            min="0.01"
            required
            placeholder="0.00"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label
            for="goal-priority"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {{ $t("savingsGoals.priority") }}
          </label>
          <select
            id="goal-priority"
            v-model="formState.priority"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="1">{{ $t("savingsGoals.priorityLow") }}</option>
            <option value="2">{{ $t("savingsGoals.priorityMedium") }}</option>
            <option value="3">{{ $t("savingsGoals.priorityHigh") }}</option>
          </select>
        </div>

        <!-- Category -->
        <div>
          <label
            for="goal-category"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {{ $t("savingsGoals.category") }}
          </label>
          <select
            id="goal-category"
            v-model="formState.category"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">{{ $t("savingsGoals.selectCategory") }}</option>
            <option value="Emergency Fund">
              {{ $t("savingsGoals.categoryEmergencyFund") }}
            </option>
            <option value="Vacation">
              {{ $t("savingsGoals.categoryVacation") }}
            </option>
            <option value="Car">{{ $t("savingsGoals.categoryCar") }}</option>
            <option value="House">
              {{ $t("savingsGoals.categoryHouse") }}
            </option>
            <option value="Education">
              {{ $t("savingsGoals.categoryEducation") }}
            </option>
            <option value="Retirement">
              {{ $t("savingsGoals.categoryRetirement") }}
            </option>
            <option value="Investment">
              {{ $t("savingsGoals.categoryInvestment") }}
            </option>
            <option value="Other">
              {{ $t("savingsGoals.categoryOther") }}
            </option>
          </select>
        </div>

        <!-- Linked Savings Accounts -->
        <div
          v-if="availableSavingsAccounts && availableSavingsAccounts.length > 0"
        >
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            {{ $t("savingsGoals.trackFromAccounts") }}
          </label>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
            {{ $t("savingsGoals.trackFromAccountsHelp") }}
          </p>
          <div
            class="space-y-2 max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md p-3"
          >
            <label
              v-for="account in availableSavingsAccounts"
              :key="account.id"
              class="flex items-start gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded cursor-pointer"
            >
              <input
                v-model="formState.savingsAccountIds"
                type="checkbox"
                :value="account.id"
                class="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <span class="font-medium text-gray-900 dark:text-white">
                    {{ account.name }}
                  </span>
                  <span
                    v-if="personNameMap[account.personId]"
                    class="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full"
                  >
                    {{ personNameMap[account.personId] }}
                  </span>
                </div>
                <div class="text-sm text-gray-600 dark:text-gray-400">
                  {{ formatCurrency(parseFloat(account.currentBalance)) }}
                  <span v-if="account.monthlyDeposit">
                    · {{ formatCurrency(parseFloat(account.monthlyDeposit))
                    }}{{ $t("time.perMonth") }}
                  </span>
                </div>
              </div>
            </label>
          </div>
          <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {{ $t("savingsGoals.unselectedTracksAll") }}
          </p>
        </div>

        <!-- Progress Preview (for editing only) -->
        <div
          v-if="isEditing"
          class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4"
        >
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {{ $t("savingsGoals.currentProgress") }}
          </h4>
          <div class="text-sm text-gray-600 dark:text-gray-400">
            <p>
              {{ $t("savingsGoals.progressCalculatedAuto") }}
            </p>
          </div>
        </div>

        <!-- Auto-calculation Notice -->
        <div
          class="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700"
        >
          <div class="flex items-start">
            <UIcon
              name="i-heroicons-information-circle"
              class="h-5 w-5 text-neutral-500 mt-0.5 mr-3 flex-shrink-0"
            />
            <div>
              <h4
                class="text-sm font-medium text-neutral-800 dark:text-neutral-200 mb-1"
              >
                {{ $t("savingsGoals.autoTracking") }}
              </h4>
              <p class="text-sm text-neutral-700 dark:text-neutral-300">
                {{ $t("savingsGoals.autoTrackingHelp") }}
              </p>
            </div>
          </div>
        </div>
      </form>
    </template>

    <template #footer>
      <div class="flex justify-end space-x-3">
        <UButton color="neutral" variant="ghost" @click="handleCancel">
          {{ $t("common.cancel") }}
        </UButton>
        <UButton :loading="loading" @click="handleSubmit">
          {{ isEditing ? $t("common.update") : $t("common.create") }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { z } from "zod";
import type {
  SelectSavingsAccount,
  SelectPerson,
  SelectSavingsGoal,
  insertSavingsGoalSchema,
} from "~~/database/validation-schemas";
import type { ApiSuccessResponse } from "~~/server/utils/api-response";

interface Props {
  open?: boolean;
  loading?: boolean;
  householdId?: number;
  editingGoal?: (SelectSavingsGoal & { savingsAccountIds?: number[] }) | null;
}

// Form state inferred from Zod schema (omitting householdId which is added later)
// Also includes savingsAccountIds which is handled separately in the API
type FormState = Omit<
  z.infer<typeof insertSavingsGoalSchema>,
  "householdId"
> & {
  savingsAccountIds: number[];
};

interface Emits {
  "update:open": [value: boolean];
  submit: [data: FormState];
  cancel: [];
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  loading: false,
  householdId: undefined,
  editingGoal: null,
});

const emit = defineEmits<Emits>();

const { formatCurrency } = useFormatters();

const formState = reactive<FormState>({
  name: "",
  description: "",
  targetAmount: "",
  priority: 1,
  category: "",
  savingsAccountIds: [],
});

const isEditing = computed(() => props.editingGoal !== null);

// Computed properties
const isOpen = computed({
  get: () => props.open,
  set: (value: boolean) => emit("update:open", value),
});

// Fetch available savings accounts for the household
const { data: availableSavingsAccountsResponse } = await useFetch<
  ApiSuccessResponse<SelectSavingsAccount[]>
>("/api/savings-accounts", {
  query: computed(() => (props.householdId ? {} : null)),
  immediate: false,
  watch: [() => props.open, () => props.householdId],
});

const availableSavingsAccounts = computed(
  () => availableSavingsAccountsResponse.value?.data ?? []
);

// Fetch persons to show account ownership
const { data: householdPersonsResponse } = await useFetch<
  ApiSuccessResponse<SelectPerson[]>
>("/api/persons", {
  immediate: false,
  watch: [() => props.open, () => props.householdId],
});

const householdPersons = computed(
  () => householdPersonsResponse.value?.data ?? []
);

// Create a lookup map for person names
const personNameMap = computed(() => {
  if (!householdPersons.value) return {};
  return householdPersons.value.reduce((map, person) => {
    map[person.id] = person.name;
    return map;
  }, {} as Record<number, string>);
});

// Reset form when modal closes
const resetForm = () => {
  formState.name = "";
  formState.description = "";
  formState.targetAmount = "";
  formState.priority = 1;
  formState.category = "";
  formState.savingsAccountIds = [];
};

// Watch for editing goal changes
watch(
  () => props.editingGoal,
  (newGoal) => {
    if (newGoal) {
      // Populate form with goal data
      formState.name = newGoal.name;
      formState.description = newGoal.description || "";
      formState.targetAmount = newGoal.targetAmount;
      formState.priority = newGoal.priority || 1;
      formState.category = newGoal.category || "";
      formState.savingsAccountIds = newGoal.savingsAccountIds || [];
    } else {
      resetForm();
    }
  },
  { immediate: true }
);

// Watch for modal close to reset form
watch(
  () => props.open,
  (newValue) => {
    if (!newValue && !props.editingGoal) {
      resetForm();
    }
  }
);

const handleSubmit = () => {
  emit("submit", {
    name: formState.name,
    description: formState.description,
    targetAmount: String(formState.targetAmount),
    priority: formState.priority,
    category: formState.category,
    savingsAccountIds: formState.savingsAccountIds,
  });
};

const handleCancel = () => {
  emit("cancel");
  emit("update:open", false);
};
</script>
