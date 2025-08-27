<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {{ isLogin ? 'Sign in to your account' : 'Create your account' }}
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          {{ isLogin ? "Don't have an account?" : "Already have an account?" }}
          <button class="font-medium text-indigo-600 hover:text-indigo-500" @click="toggleMode">
            {{ isLogin ? 'Sign up' : 'Sign in' }}
          </button>
        </p>
      </div>

      <form class="mt-8 space-y-6" @submit.prevent="handleSubmit">
        <div class="space-y-4">
          <div v-if="!isLogin">
            <label for="name" class="block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <UInput id="name" v-model="form.name" type="text" required placeholder="Enter your full name"
              class="mt-1" />
          </div>

          <div>
            <label for="email" class="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <UInput id="email" v-model="form.email" type="email" required placeholder="Enter your email" class="mt-1" />
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-gray-700">
              Password
            </label>
            <UInput id="password" v-model="form.password" type="password" required placeholder="Enter your password"
              class="mt-1" />
          </div>
        </div>

        <div v-if="error" class="text-red-600 text-sm">
          {{ error }}
        </div>

        <div>
          <UButton type="submit" :loading="loading" block size="lg" class="w-full">
            {{ isLogin ? 'Sign in' : 'Create account' }}
          </UButton>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false,
})

const router = useRouter()
const { signUp, signIn } = useAuth()

const isLogin = ref(true)
const loading = ref(false)
const error = ref('')

const form = reactive({
  name: '',
  email: '',
  password: '',
})

const toggleMode = () => {
  isLogin.value = !isLogin.value
  error.value = ''
  form.name = ''
  form.email = ''
  form.password = ''
}

const handleSubmit = async () => {
  try {
    loading.value = true
    error.value = ''

    if (isLogin.value) {
      // Sign in
      const { error: errorResponse } = await signIn.email({
        email: form.email,
        password: form.password,
      })
      if (errorResponse) {
        error.value = errorResponse.message || 'Failed to sign in'
        return
      }
    } else {
      // Sign up
      const { error: responseError } = await signUp.email({
        email: form.email,
        password: form.password,
        name: form.name,
      })

      if (responseError) {
        error.value = responseError.message || 'Failed to create account'
        return
      }
    }

    // Redirect to dashboard on success
    await router.push('/dashboard')
  } catch (err: unknown) {
    error.value = (err as any).data?.message || 'An unexpected error occurred'
    console.error('Auth error:', err)
  } finally {
    loading.value = false
  }
}
</script>
