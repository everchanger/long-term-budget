<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";

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

// Authentication state
const auth = useAuth();
const session = ref<SessionData | null>(null);
const isSigningOut = ref(false);
const route = useRoute();
const { t } = useI18n();

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
    session.value = null;
    await navigateTo("/auth");
  } catch (error) {
    console.error("Sign out error:", error);
  } finally {
    isSigningOut.value = false;
  }
};

// Navigation items
const navItems = computed<NavigationMenuItem[]>(() => [
  {
    label: t("navigation.home"),
    to: "/economy",
    active: route.path === "/economy",
  },
  {
    label: t("navigation.projections"),
    to: "/projections",
    active: route.path.startsWith("/projections"),
  },
]);

// Watch route changes to update session
watch(() => route.path, updateSession);
</script>

<template>
  <UApp>
    <UHeader>
      <template #title>
        <NuxtLink to="/" class="flex items-center gap-2">
          <UIcon
            name="i-heroicons-chart-bar"
            class="text-2xl text-blue-600 dark:text-blue-400"
          />
          <span class="font-bold text-xl">{{ $t("common.appName") }}</span>
        </NuxtLink>
      </template>

      <!-- Desktop navigation -->
      <UNavigationMenu v-if="session" :items="navItems" />

      <template #right>
        <!-- Auth controls when logged in -->
        <template v-if="session">
          <span class="hidden md:block text-sm text-muted">
            {{ session.user.name }}
          </span>
          <UButton
            variant="ghost"
            icon="i-heroicons-cog-6-tooth"
            to="/settings"
            :title="$t('navigation.settings')"
            :aria-label="$t('navigation.settings')"
          />
          <UButton
            variant="ghost"
            icon="i-heroicons-arrow-right-on-rectangle"
            :loading="isSigningOut"
            :title="$t('auth.signOut')"
            :aria-label="$t('auth.signOut')"
            @click="handleSignOut"
          />
        </template>

        <!-- Sign in button when logged out -->
        <UButton
          v-else
          variant="solid"
          color="primary"
          @click="navigateTo('/auth')"
        >
          {{ $t("auth.signIn") }}
        </UButton>

        <!-- Theme toggle -->
        <UColorModeSwitch />
      </template>

      <!-- Mobile menu body -->
      <template #body>
        <div v-if="session" class="px-3 py-2 border-b border-default mb-2">
          <p class="text-sm text-muted">
            {{ $t("auth.signedInAs") }}
          </p>
          <p class="text-sm font-medium">
            {{ session.user.name }}
          </p>
        </div>
        <div v-else class="px-3 py-2 border-b border-default mb-2">
          <UButton
            variant="solid"
            color="primary"
            block
            @click="navigateTo('/auth')"
          >
            {{ $t("auth.signIn") }}
          </UButton>
        </div>
        <UNavigationMenu
          v-if="session"
          :items="navItems"
          orientation="vertical"
          class="-mx-2.5"
        />
      </template>
    </UHeader>

    <UMain>
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </UMain>

    <UFooter>
      <template #left>
        <p class="text-sm text-muted">© 2025 {{ $t("common.appName") }}</p>
      </template>

      <template #right>
        <div class="flex gap-4 text-sm">
          <NuxtLink
            to="#"
            class="text-muted hover:text-default transition-colors"
          >
            Privacy
          </NuxtLink>
          <NuxtLink
            to="#"
            class="text-muted hover:text-default transition-colors"
          >
            Terms
          </NuxtLink>
          <NuxtLink
            to="#"
            class="text-muted hover:text-default transition-colors"
          >
            Support
          </NuxtLink>
        </div>
      </template>
    </UFooter>
  </UApp>
</template>
