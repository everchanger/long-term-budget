<template>
  <div class="py-12">
    <!-- Hero Section -->
    <div class="text-center max-w-4xl mx-auto mb-16">
      <UIcon name="i-heroicons-chart-bar" class="text-6xl text-neutral-600 dark:text-neutral-400 mx-auto mb-6" />
      <h1 class="text-5xl font-bold text-neutral-900 dark:text-white mb-6">
        Long-Term Budget Planner
      </h1>
      <p class="text-xl text-neutral-600 dark:text-neutral-300 mb-8 leading-relaxed">
        Take control of your financial future with our comprehensive planning tool. 
        Model scenarios, track expenses, and make informed decisions about your money.
      </p>
      
      <div class="flex justify-center space-x-4">
        <UButton 
          to="/dashboard" 
          size="lg"
          icon="i-heroicons-chart-bar"
          class="px-8 py-3"
        >
          Go to Dashboard
        </UButton>
        <UButton 
          color="neutral" 
          variant="soft" 
          size="lg"
          icon="i-heroicons-information-circle"
          class="px-8 py-3"
        >
          Learn More
        </UButton>
      </div>
    </div>

    <!-- Features Grid -->
    <div class="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
      <UCard class="text-center">
        <template #header>
          <UIcon name="i-heroicons-users" class="text-3xl text-neutral-600 dark:text-neutral-400 mx-auto mb-4" />
          <h3 class="text-xl font-semibold text-neutral-900 dark:text-white">
            Household Management
          </h3>
        </template>
        <p class="text-neutral-600 dark:text-neutral-300">
          Manage multiple household members and their individual financial profiles.
        </p>
      </UCard>

      <UCard class="text-center">
        <template #header>
          <UIcon name="i-heroicons-banknotes" class="text-3xl text-neutral-600 dark:text-neutral-400 mx-auto mb-4" />
          <h3 class="text-xl font-semibold text-neutral-900 dark:text-white">
            Scenario Modeling
          </h3>
        </template>
        <p class="text-neutral-600 dark:text-neutral-300">
          Compare different financial scenarios and see the long-term impact of your decisions.
        </p>
      </UCard>

      <UCard class="text-center">
        <template #header>
          <UIcon name="i-heroicons-chart-pie" class="text-3xl text-neutral-600 dark:text-neutral-400 mx-auto mb-4" />
          <h3 class="text-xl font-semibold text-neutral-900 dark:text-white">
            Detailed Analytics
          </h3>
        </template>
        <p class="text-neutral-600 dark:text-neutral-300">
          Get insights into your spending patterns and financial health over time.
        </p>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
// Page meta
definePageMeta({
  title: 'Long-Term Budget Planner'
})
</script>
