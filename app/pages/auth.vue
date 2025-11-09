<template>
  <div class="py-12">
    <div class="max-w-md w-full mx-auto space-y-8 px-4">
      <!-- Header -->
      <div class="text-center">
        <h2
          class="text-3xl font-bold tracking-tight text-gray-900 dark:text-white"
        >
          {{ isSignUp ? "Create your account" : "Sign in to your account" }}
        </h2>
        <p class="mt-4 text-gray-600 dark:text-gray-400 leading-relaxed">
          {{
            isSignUp
              ? "Join us today to start your financial journey"
              : "Welcome back to your financial journey"
          }}
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
              Sign In
            </UButton>
            <UButton
              :variant="isSignUp ? 'solid' : 'ghost'"
              class="flex-1"
              @click="isSignUp = true"
            >
              Sign Up
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
          <UFormField v-if="isSignUp" label="Name" name="name" required>
            <UInput
              id="name"
              v-model="name"
              type="text"
              placeholder="Enter your full name"
              icon="i-heroicons-user"
              required
            />
          </UFormField>

          <UFormField label="Email" name="email" required>
            <UInput
              id="email"
              v-model="email"
              type="email"
              placeholder="Enter your email"
              icon="i-heroicons-envelope"
              required
              data-testid="auth-email-input"
            />
          </UFormField>

          <UFormField label="Password" name="password" required>
            <UInput
              id="password"
              v-model="password"
              type="password"
              placeholder="Enter your password"
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
            {{ isSignUp ? "Create Account" : "Sign In" }}
          </UButton>
        </form>

        <template #footer>
          <div class="text-center text-sm text-gray-500 dark:text-gray-400">
            {{
              isSignUp ? "Already have an account?" : "Don't have an account?"
            }}
            <UButton
              :label="isSignUp ? 'Sign in here' : 'Sign up here'"
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
            error.value = ctx.error.message || "Failed to create account";
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
            error.value = ctx.error.message || "Failed to sign in";
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
