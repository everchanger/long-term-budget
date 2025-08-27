<template>
  <div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div class="text-center">
        <h2 class="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          {{ isSignUp ? 'Create your account' : 'Sign in to your account' }}
        </h2>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {{ isSignUp ? 'Join us today' : 'Welcome back' }}
        </p>
      </div>

      <UCard class="w-full">
        <template #header>
          <div class="flex justify-center space-x-1">
            <UButton :variant="!isSignUp ? 'solid' : 'ghost'" class="flex-1" @click="isSignUp = false">
              Sign In
            </UButton>
            <UButton :variant="isSignUp ? 'solid' : 'ghost'" class="flex-1" @click="isSignUp = true">
              Sign Up
            </UButton>
          </div>
        </template>

        <form class="space-y-6" @submit.prevent="handleSubmit">
          <UAlert v-if="error" :title="error" color="error" variant="soft"
            :close-button="{ icon: 'i-heroicons-x-mark-20-solid', color: 'red', variant: 'link', padded: false }"
            @close="error = ''" />
          <div v-if="isSignUp">
            <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Name *
            </label>
            <UInput 
              id="name"
              v-model="name" 
              type="text" 
              placeholder="Enter your full name" 
              required 
            />
          </div>

          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email *
            </label>
            <UInput 
              id="email"
              v-model="email" 
              type="email" 
              placeholder="Enter your email" 
              required 
            />
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password *
            </label>
            <UInput 
              id="password"
              v-model="password" 
              type="password" 
              placeholder="Enter your password" 
              required 
            />
          </div>


          <UButton type="submit" :loading="loading" :disabled="loading" block size="lg">
            {{ isSignUp ? 'Create Account' : 'Sign In' }}
          </UButton>
        </form>

        <template #footer>
          <div class="text-center text-sm text-gray-500 dark:text-gray-400">
            {{ isSignUp ? 'Already have an account?' : "Don't have an account?" }}
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
  layout: 'default'
})

const { signIn, signUp } = useAuth()

const email = ref('')
const password = ref('')
const name = ref('')
const isSignUp = ref(false)
const loading = ref(false)
const error = ref('')

const handleSubmit = async () => {
  if (loading.value) return

  loading.value = true
  error.value = ''

  try {
    if (isSignUp.value) {
      await signUp.email({
        email: email.value,
        password: password.value,
        name: name.value,
      }, {
        onRequest: () => {
          console.log('SignUp request')
        },
        onSuccess: () => {
          console.log('SignUp success')
          navigateTo('/dashboard')
        },
        onError: (ctx: { error: { message?: string } }) => {
          console.error('SignUp error:', ctx)
          error.value = ctx.error.message || 'Failed to create account'
        }
      })
    } else {
      await signIn.email({
        email: email.value,
        password: password.value,
      }, {
        onRequest: () => {
          console.log('SignIn request')
        },
        onSuccess: () => {
          console.log('SignIn success')
          navigateTo('/dashboard')
        },
        onError: (ctx: { error: { message?: string } }) => {
          console.error('SignIn error:', ctx)
          error.value = ctx.error.message || 'Failed to sign in'
        }
      })
    }
  } catch (err: unknown) {
    console.error('Auth error:', err)
    error.value = err instanceof Error ? err.message : 'An error occurred'
  } finally {
    loading.value = false
  }
}
</script>
