<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Navigation Header -->
    <header class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <!-- Logo and Brand -->
          <div class="flex items-center">
            <NuxtLink to="/" class="flex items-center space-x-2">
              <UIcon name="i-heroicons-chart-bar" class="text-2xl text-blue-600 dark:text-blue-400" />
              <span class="text-xl font-bold text-gray-900 dark:text-white">Budget Planner</span>
            </NuxtLink>
          </div>

          <!-- Navigation Links -->
          <nav class="hidden md:flex space-x-8">
            <NuxtLink
              to="/"
              class="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              active-class="text-blue-600 dark:text-blue-400"
            >
              Home
            </NuxtLink>
            <NuxtLink
              to="/dashboard"
              class="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              active-class="text-blue-600 dark:text-blue-400"
            >
              Dashboard
            </NuxtLink>
            <NuxtLink
              to="/households"
              class="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              active-class="text-blue-600 dark:text-blue-400"
            >
              Households
            </NuxtLink>
            <NuxtLink
              to="/scenarios"
              class="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              active-class="text-blue-600 dark:text-blue-400"
            >
              Scenarios
            </NuxtLink>
          </nav>

          <!-- Right side actions -->
          <div class="flex items-center space-x-4">
            <!-- Theme toggle -->
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-sun"
              class="dark:hidden"
              @click="$colorMode.preference = 'dark'"
            />
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-moon"
              class="hidden dark:block"
              @click="$colorMode.preference = 'light'"
            />

            <!-- Mobile menu button -->
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-bars-3"
              class="md:hidden"
              @click="isMobileMenuOpen = !isMobileMenuOpen"
            />
          </div>
        </div>

        <!-- Mobile Navigation -->
        <div v-show="isMobileMenuOpen" class="md:hidden border-t border-gray-200 dark:border-gray-700 pt-4 pb-3">
          <div class="space-y-1">
            <NuxtLink
              to="/"
              class="block text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white px-3 py-2 rounded-md text-base font-medium transition-colors"
              active-class="text-blue-600 dark:text-blue-400"
              @click="isMobileMenuOpen = false"
            >
              Home
            </NuxtLink>
            <NuxtLink
              to="/dashboard"
              class="block text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white px-3 py-2 rounded-md text-base font-medium transition-colors"
              active-class="text-blue-600 dark:text-blue-400"
              @click="isMobileMenuOpen = false"
            >
              Dashboard
            </NuxtLink>
            <NuxtLink
              to="/households"
              class="block text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white px-3 py-2 rounded-md text-base font-medium transition-colors"
              active-class="text-blue-600 dark:text-blue-400"
              @click="isMobileMenuOpen = false"
            >
              Households
            </NuxtLink>
            <NuxtLink
              to="/scenarios"
              class="block text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white px-3 py-2 rounded-md text-base font-medium transition-colors"
              active-class="text-blue-600 dark:text-blue-400"
              @click="isMobileMenuOpen = false"
            >
              Scenarios
            </NuxtLink>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto">
      <div class="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
          <p>&copy; 2025 Long-Term Budget Planner. Built with Nuxt 4 & Drizzle ORM.</p>
          <div class="flex space-x-4">
            <a href="#" class="hover:text-gray-900 dark:hover:text-white transition-colors">Privacy</a>
            <a href="#" class="hover:text-gray-900 dark:hover:text-white transition-colors">Terms</a>
            <a href="#" class="hover:text-gray-900 dark:hover:text-white transition-colors">Support</a>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
// Mobile menu state
const isMobileMenuOpen = ref(false)

// Close mobile menu when route changes
const route = useRoute()
watch(() => route.path, () => {
  isMobileMenuOpen.value = false
})
</script>
