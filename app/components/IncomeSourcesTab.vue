<template>
  <div class="py-6">
    <div class="flex justify-between items-center mb-6">
      <div class="flex items-center gap-3">
        <UIcon name="i-heroicons-banknotes" class="h-6 w-6 text-neutral-400" />
        <div>
          <h3 class="text-xl font-semibold text-neutral-900 dark:text-white">
            Income Sources
          </h3>
          <p class="text-neutral-600 dark:text-neutral-400">
            Manage {{ personName }}'s income sources
          </p>
        </div>
      </div>
      <UButton icon="i-heroicons-plus" @click="onAddClick">
        Add Income Source
      </UButton>
    </div>

    <div v-if="loading" class="text-center py-8">
      <UIcon
        name="i-heroicons-arrow-path"
        class="animate-spin h-6 w-6 mx-auto"
      />
    </div>
    <div v-else-if="incomeSources.length === 0" class="text-center py-12">
      <UIcon
        name="i-heroicons-banknotes"
        class="mx-auto h-12 w-12 text-neutral-400 mb-4"
      />
      <h4 class="text-lg font-medium text-neutral-900 dark:text-white mb-2">
        No Income Sources
      </h4>
      <p class="text-neutral-600 dark:text-neutral-400 mb-4">
        Add {{ personName }}'s first income source to get started.
      </p>
      <UButton variant="soft" icon="i-heroicons-plus" @click="onAddClick">
        Add Income Source
      </UButton>
    </div>
    <div v-else class="space-y-4">
      <UCard v-for="income in incomeSources" :key="income.id">
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-2">
              <h4 class="font-semibold text-neutral-900 dark:text-white">
                {{ income.name }}
              </h4>
              <UBadge :color="income.isActive ? 'success' : 'error'">
                {{ income.isActive ? "Active" : "Inactive" }}
              </UBadge>
            </div>
            <p
              class="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-1"
            >
              ${{ income.amount }} {{ income.frequency }}
            </p>
            <div class="text-sm text-neutral-600 dark:text-neutral-400">
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
              @click="onEditClick(income)"
            />
            <UButton
              size="sm"
              variant="ghost"
              color="error"
              icon="i-heroicons-trash"
              @click="onDeleteClick(income)"
            />
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SelectIncomeSource } from "~~/database/validation-schemas";

interface Props {
  incomeSources: SelectIncomeSource[];
  loading: boolean;
  personName: string;
}

interface Emits {
  addIncome: [];
  editIncome: [income: SelectIncomeSource];
  deleteIncome: [income: SelectIncomeSource];
}

defineProps<Props>();
const emit = defineEmits<Emits>();

const onAddClick = () => emit("addIncome");
const onEditClick = (income: SelectIncomeSource) => emit("editIncome", income);
const onDeleteClick = (income: SelectIncomeSource) =>
  emit("deleteIncome", income);

function formatDate(date: Date | string) {
  if (date instanceof Date) {
    return date.toLocaleDateString();
  }
  return new Date(date).toLocaleDateString();
}
</script>
