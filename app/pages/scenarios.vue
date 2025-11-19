<template>
  <UPage>
    <UPageHeader
      :title="$t('scenarios.title')"
      :description="$t('scenarios.subtitle')"
    />

    <UPageBody>
      <!-- Coming Soon Card -->
      <UCard>
        <div class="text-center py-12">
          <UIcon
            name="i-heroicons-calculator"
            class="text-6xl text-gray-400 mb-4 mx-auto"
          />
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {{ $t("scenarios.financialScenarios") }}
          </h2>
          <p class="text-gray-500 dark:text-gray-400 mb-6">
            {{ $t("scenarios.comingSoon") }}
          </p>
          <UButton to="/dashboard" color="gray" variant="soft">
            {{ $t("scenarios.backToDashboard") }}
          </UButton>
        </div>
      </UCard>
    </UPageBody>
  </UPage>
</template>

<script setup lang="ts">
definePageMeta({
  title: "Financial Scenarios",
  middleware: "auth",
});
</script>
