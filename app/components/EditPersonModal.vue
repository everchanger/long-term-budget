<template>
  <UModal v-model:open="isOpen">
    <template #header>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        {{ $t("person.editPerson") }}
      </h3>
    </template>

    <template #body>
      <div class="space-y-4">
        <UFormField :label="$t('person.name')" name="name" required>
          <UInput
            id="edit-person-name"
            v-model="formState.name"
            type="text"
            :placeholder="$t('person.namePlaceholder')"
            icon="i-lucide-user"
          />
        </UFormField>

        <UFormField :label="$t('person.age')" name="age">
          <UInput
            id="edit-person-age"
            v-model="formState.age"
            type="number"
            :placeholder="$t('person.agePlaceholder')"
            min="0"
            max="120"
            icon="i-lucide-cake"
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
          @click="handleSubmit"
        >
          {{ $t("common.update") }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type {
  SelectPerson,
  UpdatePerson,
} from "~~/database/validation-schemas";

interface Props {
  open?: boolean;
  person?: SelectPerson | null;
  loading?: boolean;
}

interface Emits {
  "update:open": [value: boolean];
  submit: [formData: UpdatePerson];
  cancel: [];
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  person: null,
  loading: false,
});

const emit = defineEmits<Emits>();

// Reactive form state
const formState = reactive({
  name: "",
  age: null as number | null,
});

// Computed properties
const isOpen = computed({
  get: () => props.open,
  set: (value: boolean) => emit("update:open", value),
});

const isFormValid = computed(() => {
  return formState.name.trim() !== "";
});

// Watch for changes in person prop to populate form
watch(
  () => props.person,
  (newPerson) => {
    if (newPerson) {
      formState.name = newPerson.name;
      formState.age = newPerson.age;
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
    if (!isOpen && !props.person) {
      resetForm();
    }
  }
);

// Methods
function resetForm() {
  formState.name = "";
  formState.age = null;
}

function handleCancel() {
  emit("cancel");
  emit("update:open", false);
}

function handleSubmit() {
  if (!isFormValid.value) return;

  emit("submit", {
    name: formState.name.trim(),
    age: formState.age === null ? undefined : formState.age,
  });
}
</script>
