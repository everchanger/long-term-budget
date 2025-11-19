<script setup lang="ts">
definePageMeta({
  layout: "auth",
  title: "Long-Term Budget Planner",
});

const { getSession } = useAuth();

onMounted(async () => {
  // If user is logged in, redirect to economy page
  try {
    const sessionData = await getSession();
    if (sessionData?.data) {
      await navigateTo("/economy");
    }
  } catch (error) {
    // User not logged in, stay on landing page
    console.log("Session check failed:", error);
  }
});
</script>

<template>
  <div class="py-12">
    <!-- Hero Section -->
    <div class="text-center max-w-4xl mx-auto mb-16">
      <UIcon
        name="i-heroicons-chart-bar"
        class="text-6xl text-neutral-600 dark:text-neutral-400 mx-auto mb-6"
      />
      <h1 class="text-5xl font-bold text-neutral-900 dark:text-white mb-6">
        {{ $t("home.title") }}
      </h1>
      <p
        class="text-xl text-neutral-600 dark:text-neutral-300 mb-8 leading-relaxed"
      >
        {{ $t("home.subtitle") }}
      </p>

      <div class="flex justify-center space-x-4">
        <UButton
          to="/auth"
          size="lg"
          icon="i-heroicons-chart-bar"
          class="px-8 py-3"
        >
          {{ $t("home.getStarted") }}
        </UButton>
        <UButton
          to="/auth"
          color="neutral"
          variant="soft"
          size="lg"
          icon="i-heroicons-arrow-right-on-rectangle"
          class="px-8 py-3"
        >
          {{ $t("auth.signIn") }}
        </UButton>
      </div>
    </div>

    <!-- Features Grid -->
    <div class="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
      <!-- Economy Card -->
      <UCard class="text-center border-0 bg-gray-50 dark:bg-gray-800/50">
        <template #header>
          <div
            class="bg-gray-100 dark:bg-gray-700 w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center"
          >
            <UIcon
              name="i-heroicons-home"
              class="text-2xl text-gray-600 dark:text-gray-300"
            />
          </div>
          <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
            {{ $t("home.features.economy.title") }}
          </h3>
        </template>
        <p class="text-gray-600 dark:text-gray-300 leading-relaxed">
          {{ $t("home.features.economy.description") }}
        </p>
      </UCard>

      <!-- Scenario Planning Card -->
      <UCard class="text-center border-0 bg-gray-50 dark:bg-gray-800/50">
        <template #header>
          <div
            class="bg-gray-100 dark:bg-gray-700 w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center"
          >
            <UIcon
              name="i-heroicons-chart-bar-square"
              class="text-2xl text-gray-600 dark:text-gray-300"
            />
          </div>
          <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
            {{ $t("home.features.scenarios.title") }}
          </h3>
        </template>
        <p class="text-gray-600 dark:text-gray-300 leading-relaxed">
          {{ $t("home.features.scenarios.description") }}
        </p>
      </UCard>

      <!-- Long-Term Projections Card -->
      <UCard class="text-center border-0 bg-gray-50 dark:bg-gray-800/50">
        <template #header>
          <div
            class="bg-gray-100 dark:bg-gray-700 w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center"
          >
            <UIcon
              name="i-heroicons-presentation-chart-line"
              class="text-2xl text-gray-600 dark:text-gray-300"
            />
          </div>
          <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
            {{ $t("home.features.projections.title") }}
          </h3>
        </template>
        <p class="text-gray-600 dark:text-gray-300 leading-relaxed">
          {{ $t("home.features.projections.description") }}
        </p>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts"></script>
