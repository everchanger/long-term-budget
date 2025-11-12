<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
    <!-- Navigation Header -->
    <header
      class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <!-- Logo and Brand -->
          <div class="flex items-center">
            <NuxtLink to="/" class="flex items-center space-x-2">
              <UIcon
                name="i-heroicons-chart-bar"
                class="text-2xl text-blue-600 dark:text-blue-400"
              />
              <span class="text-xl font-bold text-gray-900 dark:text-white"
                >Budget Planner</span
              >
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
              to="/economy"
              class="text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium"
            >
              Economy
            </NuxtLink>
            <NuxtLink
              to="/financial-story"
              class="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              active-class="text-blue-600 dark:text-blue-400"
            >
              <span class="flex items-center gap-1">
                <UIcon name="i-heroicons-sparkles" class="text-lg" />
                Your Story
              </span>
            </NuxtLink>
            <NuxtLink
              to="/projections"
              class="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              active-class="text-blue-600 dark:text-blue-400"
            >
              Projections
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
            <!-- Authentication controls -->
            <template v-if="session">
              <!-- Authenticated state -->
              <span
                class="hidden md:block text-sm text-gray-600 dark:text-gray-300"
              >
                {{ session.user.name }}
              </span>
              <UButton
                variant="ghost"
                icon="i-heroicons-arrow-right-on-rectangle"
                :loading="isSigningOut"
                @click="handleSignOut"
              >
                <span class="hidden md:inline ml-2">Sign Out</span>
              </UButton>
            </template>
            <template v-else>
              <!-- Unauthenticated state -->
              <UButton
                variant="solid"
                color="primary"
                @click="navigateTo('/auth')"
              >
                Sign In
              </UButton>
            </template>

            <!-- Theme toggle -->
            <UButton
              variant="ghost"
              icon="i-heroicons-sun"
              class="dark:hidden"
              @click="$colorMode.preference = 'dark'"
            />
            <UButton
              variant="ghost"
              icon="i-heroicons-moon"
              class="hidden dark:block"
              @click="$colorMode.preference = 'light'"
            />

            <!-- Mobile menu button -->
            <UButton
              variant="ghost"
              icon="i-heroicons-bars-3"
              class="md:hidden"
              @click="isMobileMenuOpen = !isMobileMenuOpen"
            />
          </div>
        </div>

        <!-- Mobile Navigation -->
        <div
          v-show="isMobileMenuOpen"
          class="md:hidden border-t border-gray-200 dark:border-gray-700 pt-4 pb-3"
        >
          <div class="space-y-1">
            <!-- User info on mobile (when authenticated) -->
            <div
              v-if="session"
              class="px-3 py-2 border-b border-gray-200 dark:border-gray-700 mb-2"
            >
              <p class="text-sm text-gray-600 dark:text-gray-300">
                Signed in as
              </p>
              <p class="text-sm font-medium text-gray-900 dark:text-white">
                {{ session.user.name }}
              </p>
            </div>
            <!-- Sign in button on mobile (when not authenticated) -->
            <div
              v-else
              class="px-3 py-2 border-b border-gray-200 dark:border-gray-700 mb-2"
            >
              <UButton
                variant="solid"
                color="primary"
                block
                @click="
                  navigateTo('/auth');
                  isMobileMenuOpen = false;
                "
              >
                Sign In
              </UButton>
            </div>

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
              to="/economy"
              class="block text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white px-3 py-2 rounded-md text-base font-medium transition-colors"
              active-class="text-blue-600 dark:text-blue-400"
              @click="isMobileMenuOpen = false"
            >
              Economy
            </NuxtLink>
            <NuxtLink
              to="/scenarios"
              class="block text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white px-3 py-2 rounded-md text-base font-medium transition-colors"
              active-class="text-blue-600 dark:text-blue-400"
              @click="isMobileMenuOpen = false"
            >
              Scenarios
            </NuxtLink>

            <!-- Sign out button on mobile -->
            <button
              v-if="session"
              class="block w-full text-left text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white px-3 py-2 rounded-md text-base font-medium transition-colors border-t border-gray-200 dark:border-gray-700 mt-2 pt-4"
              :disabled="isSigningOut"
              @click="handleSignOut"
            >
              <UIcon
                name="i-heroicons-arrow-right-on-rectangle"
                class="inline mr-2"
              />
              {{ isSigningOut ? "Signing out..." : "Sign Out" }}
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <slot />
    </main>

    <!-- Footer -->
    <footer
      class="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700"
    >
      <div class="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <div
          class="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400"
        >
          <p>&copy; 2025 Long-Term Budget Planner</p>
          <div class="flex space-x-4">
            <a
              href="#"
              class="hover:text-gray-900 dark:hover:text-white transition-colors"
              >Privacy</a
            >
            <a
              href="#"
              class="hover:text-gray-900 dark:hover:text-white transition-colors"
              >Terms</a
            >
            <a
              href="#"
              class="hover:text-gray-900 dark:hover:text-white transition-colors"
              >Support</a
            >
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
// Define session type based on Better Auth structure
interface SessionData {
  user: {
    id: string;
    email: string;
    name: string;
    emailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
    image?: string | null;
  };
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
    ipAddress?: string | null;
    userAgent?: string | null;
  };
}

// Mobile menu state
const isMobileMenuOpen = ref(false);

// Authentication state
const auth = useAuth();
const session = ref<SessionData | null>(null);
const isSigningOut = ref(false);

// Get session function
const updateSession = async () => {
  if (import.meta.client) {
    try {
      const sessionData = await auth.getSession();
      session.value = sessionData.data;
    } catch {
      session.value = null;
    }
  }
};

// Get session on mount (client side only)
onMounted(updateSession);

// Handle sign out
const handleSignOut = async () => {
  try {
    isSigningOut.value = true;
    await auth.signOut();
    session.value = null; // Clear session immediately
    await navigateTo("/auth");
  } catch (error) {
    console.error("Sign out error:", error);
  } finally {
    isSigningOut.value = false;
  }
};

// Close mobile menu when route changes and update session
const route = useRoute();
watch(
  () => route.path,
  () => {
    isMobileMenuOpen.value = false;
    updateSession(); // Update session on route change
  }
);
</script>
