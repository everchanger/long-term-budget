<template>
  <div class="py-12">
    <div class="max-w-md w-full mx-auto space-y-8 px-4">
      <!-- Header -->
      <div class="text-center">
        <h2
          class="text-3xl font-bold tracking-tight text-gray-900 dark:text-white"
        >
          {{
            isSignUp ? $t("auth.createYourAccount") : $t("auth.signInToAccount")
          }}
        </h2>
        <p class="mt-4 text-gray-600 dark:text-gray-400 leading-relaxed">
          {{ isSignUp ? $t("auth.joinToday") : $t("auth.welcomeBack") }}
        </p>
      </div>

      <UCard class="border-0 bg-gray-50 dark:bg-gray-800/50 w-full">
        <template #header>
          <div class="flex justify-center space-x-1">
            <UButton
              :variant="!isSignUp ? 'solid' : 'ghost'"
              class="flex-1"
              @click="isSignUp = false"
            >
              {{ $t("auth.signIn") }}
            </UButton>
            <UButton
              :variant="isSignUp ? 'solid' : 'ghost'"
              class="flex-1"
              @click="isSignUp = true"
            >
              {{ $t("auth.signUp") }}
            </UButton>
          </div>
        </template>

        <form class="space-y-6" @submit.prevent="handleSubmit">
          <UAlert
            v-if="error"
            :title="error"
            color="error"
            variant="soft"
            :close-button="{
              icon: 'i-heroicons-x-mark-20-solid',
              color: 'red',
              variant: 'link',
              padded: false,
            }"
            @close="error = ''"
          />

          <!-- Name field -->
          <UFormField
            v-if="isSignUp"
            :label="$t('auth.name')"
            name="name"
            required
          >
            <UInput
              id="name"
              v-model="name"
              type="text"
              :placeholder="$t('auth.enterFullName')"
              icon="i-heroicons-user"
              required
            />
          </UFormField>

          <UFormField :label="$t('auth.email')" name="email" required>
            <UInput
              id="email"
              v-model="email"
              type="email"
              :placeholder="$t('auth.enterEmail')"
              icon="i-heroicons-envelope"
              required
              data-testid="auth-email-input"
            />
          </UFormField>

          <UFormField :label="$t('auth.password')" name="password" required>
            <UInput
              id="password"
              v-model="password"
              type="password"
              :placeholder="$t('auth.enterPassword')"
              icon="i-heroicons-lock-closed"
              required
              data-testid="auth-password-input"
            />
          </UFormField>

          <UButton
            type="submit"
            :loading="loading"
            :disabled="loading"
            block
            size="lg"
            :icon="
              isSignUp
                ? 'i-heroicons-user-plus'
                : 'i-heroicons-arrow-right-on-rectangle'
            "
            data-testid="auth-submit-button"
          >
            {{ isSignUp ? $t("auth.createAccount") : $t("auth.signIn") }}
          </UButton>
        </form>

        <template #footer>
          <div class="text-center text-sm text-gray-500 dark:text-gray-400">
            {{
              isSignUp
                ? $t("auth.alreadyHaveAccount")
                : $t("auth.dontHaveAccount")
            }}
            <UButton
              :label="isSignUp ? $t('auth.signInHere') : $t('auth.signUpHere')"
              variant="link"
              class="p-0"
              @click="isSignUp = !isSignUp"
            />
          </div>
        </template>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
// Set the page layout to use the default layout for consistent styling
definePageMeta({
  layout: "default",
});

const { signIn, signUp, getSession } = useAuth();
const { t } = useI18n();

const email = ref("");
const password = ref("");
const name = ref("");
const isSignUp = ref(false);
const loading = ref(false);
const error = ref("");

// Check if user is already authenticated and redirect to homepage
onMounted(async () => {
  try {
    const sessionData = await getSession();
    if (sessionData.data) {
      // User is already signed in, redirect to homepage
      await navigateTo("/");
    }
  } catch (error) {
    // If there's an error getting session, let them stay on auth page
    console.log("Session check failed:", error);
  }
});

const handleSubmit = async () => {
  if (loading.value) return;

  loading.value = true;
  error.value = "";

  try {
    if (isSignUp.value) {
      await signUp.email(
        {
          email: email.value,
          password: password.value,
          name: name.value,
        },
        {
          onRequest: () => {
            console.log("SignUp request");
          },
          onSuccess: () => {
            console.log("SignUp success");
            navigateTo("/");
          },
          onError: (ctx: { error: { message?: string } }) => {
            console.error("SignUp error:", ctx);
            error.value = ctx.error.message || t("auth.failedToCreateAccount");
          },
        }
      );
    } else {
      await signIn.email(
        {
          email: email.value,
          password: password.value,
        },
        {
          onRequest: () => {
            console.log("SignIn request");
          },
          onSuccess: () => {
            console.log("SignIn success");
            navigateTo("/");
          },
          onError: (ctx: { error: { message?: string } }) => {
            console.error("SignIn error:", ctx);
            error.value = ctx.error.message || t("auth.failedToSignIn");
          },
        }
      );
    }
  } catch (err: unknown) {
    console.error("Auth error:", err);
    error.value = err instanceof Error ? err.message : "An error occurred";
  } finally {
    loading.value = false;
  }
};
</script>
