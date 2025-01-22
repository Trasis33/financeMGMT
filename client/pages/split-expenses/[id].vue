<template>
  <div>
    <!-- Page header -->
    <div class="pb-5 border-b border-gray-200">
      <h1 class="text-2xl font-semibold text-gray-900">
        {{ isEdit ? 'Edit Split Expense' : 'New Split Expense' }}
      </h1>
    </div>

    <!-- Split Expense Form -->
    <div class="mt-6">
      <form @submit.prevent="handleSubmit" class="space-y-6 max-w-3xl">
        <!-- Description -->
        <FormInput
          id="description"
          label="Description"
          type="text"
          v-model="form.description"
          :error="errors.description"
          required
        />

        <!-- Total Amount -->
        <FormInput
          id="amount"
          label="Total Amount"
          type="number"
          step="0.01"
          v-model="form.amount"
          :error="errors.amount"
          required
        />

        <!-- Shares -->
        <div>
          <div class="flex justify-between items-center mb-4">
            <label class="block text-sm font-medium text-gray-700">Split Between</label>
            <button
              type="button"
              @click="addShare"
              class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Add Person
            </button>
          </div>

          <div
            v-for="(share, index) in form.shares"
            :key="index"
            class="flex items-center space-x-4 mb-4"
          >
            <!-- User Selection -->
            <div class="flex-grow">
              <label :for="'user-' + index" class="sr-only">User</label>
              <select
                :id="'user-' + index"
                v-model="share.userId"
                class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                required
              >
                <option value="" disabled>Select a user</option>
                <option
                  v-for="user in availableUsers"
                  :key="user.id"
                  :value="user.id"
                  :disabled="isUserSelected(user.id, index)"
                >
                  {{ user.name }}
                </option>
              </select>
              <p
                v-if="errors[`shares.${index}.userId`]"
                class="mt-2 text-sm text-red-600"
              >
                {{ errors[`shares.${index}.userId`] }}
              </p>
            </div>

            <!-- Amount -->
            <div class="w-48">
              <label :for="'amount-' + index" class="sr-only">Amount</label>
              <input
                :id="'amount-' + index"
                type="number"
                step="0.01"
                v-model="share.amount"
                class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                required
                :placeholder="'Amount'"
              >
              <p
                v-if="errors[`shares.${index}.amount`]"
                class="mt-2 text-sm text-red-600"
              >
                {{ errors[`shares.${index}.amount`] }}
              </p>
            </div>

            <!-- Remove Button -->
            <button
              type="button"
              @click="removeShare(index)"
              class="inline-flex items-center p-1.5 border border-transparent rounded-full text-red-600 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              :disabled="form.shares.length <= 2"
            >
              <svg
                class="h-5 w-5"
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
            </button>
          </div>

          <!-- Split Evenly Button -->
          <button
            type="button"
            @click="splitEvenly"
            class="mt-2 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Split Evenly
          </button>
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

        <!-- Form Actions -->
        <div class="flex justify-end space-x-3">
          <button
            type="button"
            @click="navigateTo('/split-expenses')"
            class="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Cancel
          </button>
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
              {{ isEdit ? 'Update' : 'Create' }} Split Expense
            </template>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const config = useRuntimeConfig()
const token = useState('token')
interface User {
  id: number;
  name: string;
}
const currentUser = useState<User>('user')
const { createSplitExpense, updateSplitExpense } = useSplitExpenses()

definePageMeta({
  middleware: ['auth']
})

// Form state
const isEdit = computed(() => !!route.params.id && route.params.id !== 'new')
const form = ref({
  description: '',
  amount: '',
  shares: [
    { userId: currentUser.value?.id, amount: '' }
  ]
})
const errors = ref<Record<string, string>>({})
const errorMessage = ref('')
const isLoading = ref(false)
const availableUsers = ref<User[]>([])

// Load users for share selection
const loadUsers = async () => {
  try {
    const response = await fetch(
      `${config.public.apiBaseUrl}/api/users`,
      {
        headers: {
          'Authorization': `Bearer ${token.value}`
        }
      }
    )

    if (!response.ok) throw new Error('Failed to fetch users')

    availableUsers.value = await response.json()
  } catch (error) {
    console.error('Error loading users:', error)
    errorMessage.value = 'Failed to load users'
  }
}

// Load existing split expense if in edit mode
onMounted(async () => {
  await loadUsers()

  if (isEdit.value) {
    try {
      const response = await fetch(
        `${config.public.apiBaseUrl}/api/split-expenses/${route.params.id}`,
        {
          headers: {
            'Authorization': `Bearer ${token.value}`
          }
        }
      )

      if (!response.ok) throw new Error('Failed to fetch split expense')

      const splitExpense = await response.json()
      form.value = {
        description: splitExpense.description,
        amount: splitExpense.amount,
        shares: splitExpense.shares.map((share: any) => ({
          userId: share.userId,
          amount: share.amount
        }))
      }
    } catch (error) {
      console.error('Error loading split expense:', error)
      errorMessage.value = 'Failed to load split expense'
    }
  }
})

// Check if user is already selected in another share
const isUserSelected = (userId: number, currentIndex: number) => {
  return form.value.shares.some(
    (share, index) => index !== currentIndex && share.userId === userId
  )
}

// Add new share
const addShare = () => {
  form.value.shares.push({ userId: 0, amount: '' })
}

// Remove share
const removeShare = (index: number) => {
  if (form.value.shares.length > 2) {
    form.value.shares.splice(index, 1)
  }
}

// Split amount evenly between all shares
const splitEvenly = () => {
  const amount = Number(form.value.amount)
  if (!amount) return

  const shareCount = form.value.shares.length
  const evenShare = (amount / shareCount).toFixed(2)
  
  form.value.shares.forEach(share => {
    share.amount = evenShare
  })
}

// Form validation
const validateForm = () => {
  errors.value = {}
  let isValid = true

  if (!form.value.description) {
    errors.value.description = 'Description is required'
    isValid = false
  }

  if (!form.value.amount || Number(form.value.amount) <= 0) {
    errors.value.amount = 'Please enter a valid amount'
    isValid = false
  }

  // Validate shares
  let totalShares = 0
  form.value.shares.forEach((share, index) => {
    if (!share.userId) {
      errors.value[`shares.${index}.userId`] = 'Please select a user'
      isValid = false
    }

    if (!share.amount || Number(share.amount) <= 0) {
      errors.value[`shares.${index}.amount`] = 'Please enter a valid amount'
      isValid = false
    } else {
      totalShares += Number(share.amount)
    }
  })

  // Validate total shares equals total amount
  if (Math.abs(totalShares - Number(form.value.amount)) > 0.01) {
    errorMessage.value = 'Total shares must equal the total amount'
    isValid = false
  }

  return isValid
}

// Form submission
const handleSubmit = async () => {
  if (!validateForm()) return

  isLoading.value = true
  errorMessage.value = ''

  try {
    const data = {
      ...form.value,
      amount: Number(form.value.amount),
      shares: form.value.shares.map(share => ({
        ...share,
        amount: Number(share.amount)
      }))
    }

    if (isEdit.value) {
      await updateSplitExpense(Number(route.params.id), data)
    } else {
      await createSplitExpense(data)
    }

    navigateTo('/split-expenses')
  } catch (error: any) {
    errorMessage.value = error.message || 'An error occurred while saving the split expense'
  } finally {
    isLoading.value = false
  }
}</script>