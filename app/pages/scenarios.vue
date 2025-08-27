<template>
  <div>
    <!-- Page Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Scenarios</h1>
      <p class="mt-2 text-gray-600 dark:text-gray-400">
        Create and compare financial scenarios
      </p>
    </div>

    <!-- Coming Soon Card -->
    <UCard>
      <div class="text-center py-12">
        <UIcon name="i-heroicons-calculator" class="text-6xl text-gray-400 mb-4 mx-auto" />
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">Financial Scenarios</h2>
        <p class="text-gray-500 dark:text-gray-400 mb-6">
          This feature is coming soon! You'll be able to model and compare different financial scenarios here.
        </p>
        <UButton to="/dashboard" color="gray" variant="soft">
          Back to Dashboard
        </UButton>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  title: 'Financial Scenarios',
  middleware: 'auth'
})
</script>
