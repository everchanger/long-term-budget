<script setup lang="ts">
import * as z from "zod";
import type { AuthFormField, FormSubmitEvent } from "@nuxt/ui";

// Set the page layout to use the auth layout (no container)
definePageMeta({
  layout: "auth",
});

const { signIn, signUp, getSession } = useAuth();
const { t } = useI18n();

const isSignUp = ref(false);
const loading = ref(false);
const error = ref("");

// Check if user is already authenticated and redirect to economy page
onMounted(async () => {
  try {
    const sessionData = await getSession();
    if (sessionData.data) {
      await navigateTo("/economy");
    }
  } catch (error) {
    console.log("Session check failed:", error);
  }
});

// Define validation schema
const signInSchema = z.object({
  email: z.string().email(t("auth.invalidEmail")),
  password: z.string().min(1, t("auth.passwordRequired")),
});

const signUpSchema = z.object({
  name: z.string().min(2, t("auth.nameRequired")),
  email: z.string().email(t("auth.invalidEmail")),
  password: z.string().min(8, t("auth.passwordMinLength")),
});

const authSchema = computed(() =>
  isSignUp.value ? signUpSchema : signInSchema
);

type SignInSchema = z.infer<typeof signInSchema>;
type SignUpSchema = z.infer<typeof signUpSchema>;
type AuthSchema = SignInSchema | SignUpSchema;

// Define form fields dynamically based on isSignUp
const fields = computed((): AuthFormField[] => {
  const baseFields: AuthFormField[] = [
    {
      name: "email",
      type: "email",
      label: t("auth.email"),
      placeholder: t("auth.enterEmail"),
      required: true,
    },
    {
      name: "password",
      type: "password",
      label: t("auth.password"),
      placeholder: t("auth.enterPassword"),
      required: true,
    },
  ];

  if (isSignUp.value) {
    return [
      {
        name: "name",
        type: "text",
        label: t("auth.name"),
        placeholder: t("auth.enterFullName"),
        required: true,
      },
      ...baseFields,
    ];
  }

  return baseFields;
});

const handleSubmit = async (event: FormSubmitEvent<AuthSchema>) => {
  if (loading.value) return;

  loading.value = true;
  error.value = "";

  try {
    if (isSignUp.value) {
      await signUp.email(
        {
          email: event.data.email,
          password: event.data.password,
          name: (event.data as { name?: string }).name || "",
        },
        {
          onSuccess: () => {
            navigateTo("/economy");
          },
          onError: (ctx: { error: { message?: string } }) => {
            error.value = ctx.error.message || t("auth.failedToCreateAccount");
          },
        }
      );
    } else {
      await signIn.email(
        {
          email: event.data.email,
          password: event.data.password,
        },
        {
          onSuccess: () => {
            navigateTo("/economy");
          },
          onError: (ctx: { error: { message?: string } }) => {
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

      <UPageCard class="w-full">
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

        <UAuthForm
          :fields="fields"
          :schema="authSchema"
          :loading="loading"
          :submit="{
            label: isSignUp ? $t('auth.createAccount') : $t('auth.signIn'),
            icon: isSignUp
              ? 'i-heroicons-user-plus'
              : 'i-heroicons-arrow-right-on-rectangle',
          }"
          @submit="handleSubmit"
        >
          <template #validation>
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
          </template>
        </UAuthForm>

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
      </UPageCard>
    </div>
  </div>
</template>
