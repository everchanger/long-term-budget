<script setup lang="ts">
import type { SelectItem } from "@nuxt/ui";
import { useUserPreferences } from "~/composables/useUserPreferences";

definePageMeta({
  middleware: ["auth"],
});

const toast = useToast();
const { t } = useI18n();
const { locale, currency, setLocale, setCurrency } = useUserPreferences();

// Language options with icons
const languageOptions: SelectItem[] = [
  { label: "Svenska", value: "sv", icon: "i-lucide-languages" },
  { label: "English", value: "en", icon: "i-lucide-languages" },
];

// Currency options with icons
const currencyOptions: SelectItem[] = [
  { label: "SEK (kr)", value: "SEK", icon: "i-lucide-coins" },
  { label: "USD ($)", value: "USD", icon: "i-lucide-dollar-sign" },
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
      title: t("settings.updateSuccess"),
      color: "success",
    });
  } catch (error) {
    console.error("Failed to update preferences:", error);
    toast.add({
      title: t("settings.updateFailed"),
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
  <UPage>
    <UPageHeader
      :title="$t('settings.title')"
      :description="$t('settings.description')"
    />

    <UPageBody>
      <!-- Settings Card -->
      <UCard>
        <div class="space-y-6">
          <!-- Language Selection -->
          <UFormField :label="$t('settings.language')" name="language">
            <USelect
              v-model="selectedLanguage"
              :items="languageOptions"
              value-key="value"
              label-key="label"
              :ui="{ content: 'min-w-fit' }"
              data-testid="language-select"
            />
          </UFormField>

          <!-- Currency Selection -->
          <UFormField :label="$t('settings.currency')" name="currency">
            <USelect
              v-model="selectedCurrency"
              :items="currencyOptions"
              value-key="value"
              label-key="label"
              :ui="{ content: 'min-w-fit' }"
              data-testid="currency-select"
            />
          </UFormField>

          <USeparator />

          <!-- Theme Selection -->
          <UFormField :label="$t('settings.theme')" name="theme">
            <UColorModeSelect />
          </UFormField>

          <USeparator />

          <!-- Save Button -->
          <div class="flex justify-end">
            <UButton
              color="primary"
              :loading="isSaving"
              :disabled="!hasChanges"
              @click="savePreferences"
            >
              {{ $t("settings.saveChanges") }}
            </UButton>
          </div>
        </div>
      </UCard>
    </UPageBody>
  </UPage>
</template>
