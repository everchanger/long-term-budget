<template>
  <UModal v-model:open="isOpen">
    <template #header>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        {{ isEditing ? $t("income.editSource") : $t("income.addSource") }}
      </h3>
    </template>

    <template #body>
      <div class="space-y-4">
        <UFormField :label="$t('income.nameRequired')" name="name" required>
          <UInput
            id="income-name"
            v-model="formState.name"
            type="text"
            :placeholder="$t('income.namePlaceholder')"
            icon="i-lucide-briefcase"
            data-testid="income-source-input"
          />
        </UFormField>

        <UFormField :label="$t('income.amountRequired')" name="amount" required>
          <UInput
            id="income-amount"
            v-model="formState.amount"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            icon="i-lucide-dollar-sign"
            data-testid="income-amount-input"
          />
        </UFormField>

        <UFormField
          :label="$t('income.frequencyRequired')"
          name="frequency"
          required
        >
          <USelect
            id="income-frequency"
            v-model="formState.frequency"
            :items="frequencyOptions"
            :placeholder="$t('income.selectFrequency')"
            value-key="value"
            label-key="label"
            :ui="{ content: 'min-w-fit' }"
          />
        </UFormField>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-3">
        <UButton variant="ghost" @click="handleCancel">{{
          $t("common.cancel")
        }}</UButton>
        <UButton
          :loading="loading"
          :disabled="!isFormValid"
          data-testid="income-modal-submit-button"
          @click="handleSubmit"
        >
          {{ isEditing ? $t("common.update") : $t("common.add") }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { z } from "zod";
import type { SelectItem } from "@nuxt/ui";
import type {
  SelectIncomeSource,
  insertIncomeSourceSchema,
} from "~~/database/validation-schemas";

// Form state inferred from Zod schema (omitting personId which is added later)
type FormState = Omit<z.infer<typeof insertIncomeSourceSchema>, "personId">;

interface Props {
  open?: boolean;
  incomeSource?: SelectIncomeSource | null;
  loading?: boolean;
}

interface Emits {
  "update:open": [value: boolean];
  submit: [formData: FormState];
  cancel: [];
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  incomeSource: null,
  loading: false,
});

const emit = defineEmits<Emits>();
const { t } = useI18n();

// Frequency options with icons
const frequencyOptions: SelectItem[] = [
  { label: t("time.monthly"), value: "monthly", icon: "i-lucide-calendar" },
  { label: t("time.yearly"), value: "yearly", icon: "i-lucide-calendar-days" },
  { label: t("time.weekly"), value: "weekly", icon: "i-lucide-clock" },
  { label: t("time.biWeekly"), value: "bi-weekly", icon: "i-lucide-clock" },
];

// Reactive form state
const formState = reactive<FormState>({
  name: "",
  amount: "",
  frequency: "monthly", // Default to a valid value instead of empty string
});

// Computed properties
const isOpen = computed({
  get: () => props.open,
  set: (value: boolean) => emit("update:open", value),
});

const isEditing = computed(() => !!props.incomeSource);

const isFormValid = computed(() => {
  const amount = parseFloat(formState.amount);
  return (
    formState.name.trim() !== "" &&
    formState.amount !== "" &&
    amount > 0 &&
    formState.frequency !== undefined
  );
});

// Watch for changes in incomeSource prop to populate form
watch(
  () => props.incomeSource,
  (newIncomeSource) => {
    if (newIncomeSource) {
      formState.name = newIncomeSource.name;
      formState.amount = newIncomeSource.amount;
      formState.frequency = newIncomeSource.frequency as FormState["frequency"];
    } else {
      resetForm();
    }
  },
  { immediate: true }
);

// Watch for open changes to reset form when closing
watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen && !props.incomeSource) {
      resetForm();
    }
  }
);

// Methods
function resetForm() {
  formState.name = "";
  formState.amount = "";
  formState.frequency = "monthly";
}

function handleCancel() {
  emit("cancel");
  emit("update:open", false);
}

function handleSubmit() {
  if (!isFormValid.value) return;

  emit("submit", {
    name: formState.name.trim(),
    amount: String(formState.amount),
    frequency: formState.frequency,
  });
}
</script>
