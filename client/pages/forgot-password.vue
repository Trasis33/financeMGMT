<template>
  <div>
    <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
      Reset your password
    </h2>
    <p class="mt-2 text-center text-sm text-gray-600">
      Enter your email address and we'll send you a link to reset your password.
    </p>

    <div class="mt-8">
      <div class="mt-6">
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <div class="mt-1">
              <input
                id="email"
                v-model="email"
                name="email"
                type="email"
                autocomplete="email"
                required
                class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              :disabled="isLoading"
              class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              <span v-if="isLoading">Sending reset link...</span>
              <span v-else>Send reset link</span>
            </button>
          </div>
        </form>

        <div v-if="error" class="mt-4 text-sm text-red-600">
          {{ error }}
        </div>

        <div v-if="success" class="mt-4 text-sm text-green-600">
          {{ success }}
        </div>

        <div class="mt-6 text-center">
          <NuxtLink to="/login" class="text-sm text-primary-600 hover:text-primary-500">
            Back to login
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'guest',
  middleware: ['guest']
})

const email = ref('')
const isLoading = ref(false)
const error = ref('')
const success = ref('')

const handleSubmit = async () => {
  try {
    isLoading.value = true
    error.value = ''
    success.value = ''

    // TODO: Implement password reset functionality
    // For now, just show a success message
    success.value = 'If an account exists with this email, you will receive a password reset link shortly.'
  } catch (err) {
    console.error('Password reset request failed:', err)
    error.value = 'Failed to send reset link. Please try again.'
  } finally {
    isLoading.value = false
  }
}
</script>
