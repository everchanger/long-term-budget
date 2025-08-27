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
        <UButton to="/auth" size="lg" icon="i-heroicons-chart-bar" class="px-8 py-3">
          Get Started
        </UButton>
        <UButton to="/auth" color="neutral" variant="soft" size="lg" icon="i-heroicons-arrow-right-on-rectangle"
          class="px-8 py-3">
          Sign In
        </UButton>
      </div>
    </div>

    <!-- Features Grid -->
    <div class="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
      <!-- Household Economics Card -->
      <UCard class="text-center border-0 bg-gray-50 dark:bg-gray-800/50">
        <template #header>
          <div class="bg-gray-100 dark:bg-gray-700 w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center">
            <UIcon name="i-heroicons-home" class="text-2xl text-gray-600 dark:text-gray-300" />
          </div>
          <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Household Economics
          </h3>
        </template>
        <p class="text-gray-600 dark:text-gray-300 leading-relaxed">
          Model your household's complete financial picture including income, expenses, savings, and loans across all
          family
          members.
        </p>
      </UCard>

      <!-- Scenario Planning Card -->
      <UCard class="text-center border-0 bg-gray-50 dark:bg-gray-800/50">
        <template #header>
          <div class="bg-gray-100 dark:bg-gray-700 w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center">
            <UIcon name="i-heroicons-chart-bar-square" class="text-2xl text-gray-600 dark:text-gray-300" />
          </div>
          <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Scenario Planning
          </h3>
        </template>
        <p class="text-gray-600 dark:text-gray-300 leading-relaxed">
          Compare "what-if" scenarios like paying off debt early vs. investing, or buying vs. renting decisions over
          months
          and years.
        </p>
      </UCard>

      <!-- Long-Term Projections Card -->
      <UCard class="text-center border-0 bg-gray-50 dark:bg-gray-800/50">
        <template #header>
          <div class="bg-gray-100 dark:bg-gray-700 w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center">
            <UIcon name="i-heroicons-presentation-chart-line" class="text-2xl text-gray-600 dark:text-gray-300" />
          </div>
          <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Long-Term Projections
          </h3>
        </template>
        <p class="text-gray-600 dark:text-gray-300 leading-relaxed">
          Visualize your financial trajectory over time and understand the long-term impact of today's financial
          decisions.
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

// Check authentication status and redirect accordingly
onMounted(async () => {
  // Only run on client side
  if (import.meta.client) {
    try {
      const { getSession } = useAuth()
      const session = await getSession()
      if (session.data) {
        await navigateTo('/dashboard')
      }
    } catch {
      // User is not authenticated, stay on landing page
      console.log('User not authenticated')
    }
  }
})
</script>
