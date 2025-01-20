<template>
  <div>
    <!-- Page header -->
    <div class="pb-5 border-b border-gray-200">
      <h1 class="text-2xl font-semibold text-gray-900">Profile Settings</h1>
    </div>

    <!-- Profile Form -->
    <div class="mt-6">
      <form @submit.prevent="handleSubmit" class="space-y-6 max-w-xl">
        <!-- Name -->
        <FormInput
          id="name"
          label="Full Name"
          type="text"
          v-model="form.name"
          :error="errors.name"
          autocomplete="name"
          required
        />

        <!-- Email -->
        <FormInput
          id="email"
          label="Email Address"
          type="email"
          v-model="form.email"
          :error="errors.email"
          autocomplete="email"
          required
        />

        <!-- Current Password -->
        <FormInput
          v-if="form.newPassword"
          id="currentPassword"
          label="Current Password"
          type="password"
          v-model="form.currentPassword"
          :error="errors.currentPassword"
          autocomplete="current-password"
        />

        <!-- New Password -->
        <div>
          <div class="flex items-center justify-between">
            <label
              for="newPassword"
              class="block text-sm font-medium text-gray-700"
            >
              New Password
            </label>
            <button
              v-if="!form.newPassword"
              type="button"
              @click="form.newPassword = ''"
              class="text-sm font-medium text-primary-600 hover:text-primary-500"
            >
              Change Password
            </button>
          </div>
          <div v-if="form.newPassword" class="mt-1">
            <FormInput
              id="newPassword"
              type="password"
              v-model="form.newPassword"
              :error="errors.newPassword"
              autocomplete="new-password"
            />
          </div>
        </div>

        <!-- Error Message -->
        <div
          v-if="errorMessage"
          class="rounded-md bg-red-50 p-4"
        >
          <div class="flex">
            <div class="flex-shrink-0">
              <svg
                class="h-5 w-5 text-red-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-red-800">
                {{ errorMessage }}
              </h3>
            </div>
          </div>
        </div>

        <!-- Success Message -->
        <div
          v-if="successMessage"
          class="rounded-md bg-green-50 p-4"
        >
          <div class="flex">
            <div class="flex-shrink-0">
              <svg
                class="h-5 w-5 text-green-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-green-800">
                {{ successMessage }}
              </h3>
            </div>
          </div>
        </div>

        <!-- Form Actions -->
        <div class="flex justify-end">
          <button
            type="submit"
            :disabled="isLoading"
            class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
          >
            <template v-if="isLoading">
              <svg
                class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                />
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Saving...
            </template>
            <template v-else>
              Save Changes
            </template>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { UpdateProfileData } from '~/types/auth'

definePageMeta({
  middleware: ['auth']
})

const { updateProfile } = useAuth()
const user = useState('user')

// Form state
const form = ref({
  name: user.value?.name || '',
  email: user.value?.email || '',
  currentPassword: '',
  newPassword: null as string | null
})
const errors = ref<Record<string, string>>({})
const errorMessage = ref('')
const successMessage = ref('')
const isLoading = ref(false)

// Form validation
const validateForm = () => {
  errors.value = {}
  let isValid = true

  if (!form.value.name.trim()) {
    errors.value.name = 'Name is required'
    isValid = false
  }

  if (!form.value.email) {
    errors.value.email = 'Email is required'
    isValid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
    errors.value.email = 'Please enter a valid email address'
    isValid = false
  }

  if (form.value.newPassword) {
    if (!form.value.currentPassword) {
      errors.value.currentPassword = 'Current password is required to set a new password'
      isValid = false
    }

    if (form.value.newPassword.length < 6) {
      errors.value.newPassword = 'New password must be at least 6 characters'
      isValid = false
    }
  }

  return isValid
}

// Form submission
const handleSubmit = async () => {
  if (!validateForm()) return

  isLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const updateData: UpdateProfileData = {
      name: form.value.name,
      email: form.value.email
    }

    if (form.value.newPassword) {
      updateData.currentPassword = form.value.currentPassword
      updateData.newPassword = form.value.newPassword
    }

    await updateProfile(updateData)
    
    // Reset password fields
    form.value.currentPassword = ''
    form.value.newPassword = null

    successMessage.value = 'Profile updated successfully'
  } catch (error: any) {
    errorMessage.value = error.message || 'An error occurred while updating your profile'
  } finally {
    isLoading.value = false
  }
}</script>