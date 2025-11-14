<script setup lang="ts">
import { useUserPreferences } from "~/composables/useUserPreferences";

definePageMeta({
  middleware: ["auth"],
});

const toast = useToast();
const { locale, currency, setLocale, setCurrency } = useUserPreferences();

// Language options
const languageOptions = [
  { value: "sv", text: "Svenska" },
  { value: "en", text: "English" },
];

// Currency options
const currencyOptions = [
  { value: "SEK", text: "SEK (kr)" },
  { value: "USD", text: "USD ($)" },
];

// Track if we're saving
const isSaving = ref(false);

// Local state for selections
const selectedLanguage = ref(locale.value);
const selectedCurrency = ref(currency.value);

// Watch for changes from the composable (in case updated elsewhere)
watch(locale, (newLocale) => {
  selectedLanguage.value = newLocale;
});

watch(currency, (newCurrency) => {
  selectedCurrency.value = newCurrency;
});

// Save preferences
const savePreferences = async () => {
  isSaving.value = true;
  try {
    // Update locale if changed
    if (selectedLanguage.value !== locale.value) {
      await setLocale(selectedLanguage.value as "en" | "sv");
    }
    // Update currency if changed
    if (selectedCurrency.value !== currency.value) {
      await setCurrency(selectedCurrency.value as "USD" | "SEK");
    }
    toast.add({
      title: "Settings updated successfully",
      color: "success",
    });
  } catch (error) {
    console.error("Failed to update preferences:", error);
    toast.add({
      title: "Failed to update settings",
      color: "error",
    });
  } finally {
    isSaving.value = false;
  }
};

// Check if there are unsaved changes
const hasChanges = computed(() => {
  return (
    selectedLanguage.value !== locale.value ||
    selectedCurrency.value !== currency.value
  );
});
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
          Settings
        </h1>
        <p class="mt-2 text-gray-600 dark:text-gray-400">
          Manage your language and currency preferences
        </p>
      </div>

      <!-- Settings Card -->
      <UCard>
        <div class="space-y-6">
          <!-- Language Selection -->
          <div>
            <label
              for="language"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Language
            </label>
            <USelect
              v-model="selectedLanguage"
              :options="languageOptions"
              option-attribute="text"
              value-attribute="value"
              class="w-full"
              data-testid="language-select"
            />
          </div>

          <!-- Currency Selection -->
          <div>
            <label
              for="currency"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Currency
            </label>
            <USelect
              v-model="selectedCurrency"
              :options="currencyOptions"
              option-attribute="text"
              value-attribute="value"
              class="w-full"
              data-testid="currency-select"
            />
          </div>

          <!-- Save Button -->
          <div class="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <UButton
              color="primary"
              :loading="isSaving"
              :disabled="!hasChanges"
              @click="savePreferences"
            >
              Save Changes
            </UButton>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>
