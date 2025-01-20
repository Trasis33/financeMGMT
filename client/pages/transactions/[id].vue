<template>
  <div>
    <div class="pb-5 border-b border-gray-200">
      <h2 class="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
        Edit Transaction
      </h2>
    </div>

    <!-- Loading state -->
    <div v-if="isLoadingLocal" class="flex justify-center items-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
    </div>

    <!-- Error state -->
    <div v-else-if="localError" class="rounded-md bg-red-50 p-4 mt-6">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">{{ localError }}</h3>
        </div>
      </div>
    </div>

    <form v-else @submit.prevent="handleSubmit" class="mt-8 space-y-6">
      <div class="space-y-4">
        <!-- Type Selection -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Type</label>
          <div class="flex space-x-4">
            <button
              type="button"
              @click="form.type = 'INCOME'"
              :class="[
                'flex-1 py-2 px-4 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2',
                form.type === 'INCOME'
                  ? 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500'
              ]"
            >
              Income
            </button>
            <button
              type="button"
              @click="form.type = 'EXPENSE'"
              :class="[
                'flex-1 py-2 px-4 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2',
                form.type === 'EXPENSE'
                  ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500'
              ]"
            >
              Expense
            </button>
          </div>
          <p v-if="errors.type" class="mt-2 text-sm text-red-600">{{ errors.type }}</p>
        </div>

        <!-- Amount -->
        <FormInput
          id="amount"
          v-model="form.amount"
          type="number"
          step="0.01"
          min="0"
          label="Amount"
          :error="errors.amount"
          required
        />

        <!-- Date -->
        <FormInput
          id="date"
          v-model="form.date"
          type="date"
          label="Date"
          :error="errors.date"
          :max="maxDate"
          required
        />

        <!-- Description -->
        <FormInput
          id="description"
          v-model="form.description"
          type="text"
          label="Description"
          :error="errors.description"
          required
        />

        <!-- Category -->
        <div>
          <label for="category" class="block text-sm font-medium text-gray-700">Category</label>
          <select
            id="category"
            v-model="form.category"
            class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
            required
          >
            <option value="">Select a category</option>
            <optgroup v-if="form.type === 'INCOME'" label="Income Categories">
              <option v-for="category in incomeCategories" :key="category" :value="category">
                {{ category }}
              </option>
            </optgroup>
            <optgroup v-else label="Expense Categories">
              <option v-for="category in expenseCategories" :key="category" :value="category">
                {{ category }}
              </option>
            </optgroup>
          </select>
          <p v-if="errors.category" class="mt-2 text-sm text-red-600">{{ errors.category }}</p>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex justify-end space-x-4">
        <button
          type="button"
          @click="handleDelete"
          class="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          :disabled="isLoadingLocal"
        >
          Delete
        </button>
        <NuxtLink
          to="/transactions"
          class="inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Cancel
        </NuxtLink>
        <button
          type="submit"
          :disabled="isLoadingLocal"
          class="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
        >
          <template v-if="isLoadingLocal">
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
</template>

<script setup lang="ts">
import type { Transaction } from '~/types/api'

definePageMeta({
  layout: 'default',
  middleware: ['auth']
})

const route = useRoute()
const router = useRouter()

interface TransactionResponse {
  transaction: Transaction;
}

const isLoadingLocal = ref(false)
const localError = ref<string | null>(null)
const transactionId = computed(() => parseInt(route.params.id as string))

const incomeCategories = [
  'Salary',
  'Freelance',
  'Investment',
  'Business',
  'Gift',
  'Other Income'
]

const expenseCategories = [
  'Housing',
  'Transportation',
  'Food',
  'Utilities',
  'Insurance',
  'Healthcare',
  'Debt',
  'Entertainment',
  'Shopping',
  'Personal Care',
  'Education',
  'Gifts',
  'Other Expenses'
]

const form = ref({
  type: 'EXPENSE' as 'INCOME' | 'EXPENSE',
  amount: '',
  date: '',
  description: '',
  category: ''
})

const errors = ref<Record<string, string>>({})

// Max date is today
const maxDate = new Date().toISOString().split('T')[0]

// Load transaction data
const loadTransaction = async () => {
  isLoadingLocal.value = true
  localError.value = null

  try {
    const { data, error } = await useApiFetch<TransactionResponse>(`/api/transactions/${transactionId.value}`)
    
    if (error.value) {
      throw new Error('Failed to load transaction')
    }

    if (data.value?.transaction) {
      const transaction = data.value.transaction
      form.value = {
        type: transaction.type as 'INCOME' | 'EXPENSE',
        amount: transaction.amount.toString(),
        date: new Date(transaction.date).toISOString().split('T')[0],
        description: transaction.description,
        category: transaction.category
      }
    }
  } catch (err) {
    localError.value = err instanceof Error ? err.message : 'Failed to load transaction'
    console.error('Error loading transaction:', err)
  } finally {
    isLoadingLocal.value = false
  }
}

// Initial load
onMounted(() => {
  loadTransaction()
})

const validateForm = () => {
  errors.value = {}
  let isValid = true

  if (!form.value.type) {
    errors.value.type = 'Type is required'
    isValid = false
  }

  if (!form.value.amount) {
    errors.value.amount = 'Amount is required'
    isValid = false
  } else if (isNaN(Number(form.value.amount)) || Number(form.value.amount) <= 0) {
    errors.value.amount = 'Amount must be a positive number'
    isValid = false
  }

  if (!form.value.date) {
    errors.value.date = 'Date is required'
    isValid = false
  } else {
    const selectedDate = new Date(form.value.date + 'T00:00:00')
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (selectedDate > today) {
      errors.value.date = 'Date cannot be in the future'
      isValid = false
    }
  }

  if (!form.value.description.trim()) {
    errors.value.description = 'Description is required'
    isValid = false
  }

  if (!form.value.category) {
    errors.value.category = 'Category is required'
    isValid = false
  }

  return isValid
}

const handleSubmit = async () => {
  if (!validateForm()) return

  isLoadingLocal.value = true
  localError.value = null

  try {
    const { error } = await useApiFetch(`/api/transactions/${transactionId.value}`, {
      method: 'PUT',
      body: {
        type: form.value.type,
        amount: Number(form.value.amount),
        date: form.value.date,
        description: form.value.description.trim(),
        category: form.value.category
      }
    })

    if (error.value) {
      throw new Error('Failed to update transaction')
    }

    // Redirect back to transactions list
    router.push('/transactions')
  } catch (err) {
    localError.value = err instanceof Error ? err.message : 'Failed to update transaction'
    console.error('Error updating transaction:', err)
  } finally {
    isLoadingLocal.value = false
  }
}

const handleDelete = async () => {
  if (!confirm('Are you sure you want to delete this transaction?')) {
    return
  }

  isLoadingLocal.value = true
  localError.value = null

  try {
    const { error } = await useApiFetch(`/api/transactions/${transactionId.value}`, {
      method: 'DELETE'
    })

    if (error.value) {
      throw new Error('Failed to delete transaction')
    }

    // Redirect back to transactions list
    router.push('/transactions')
  } catch (err) {
    localError.value = err instanceof Error ? err.message : 'Failed to delete transaction'
    console.error('Error deleting transaction:', err)
  } finally {
    isLoadingLocal.value = false
  }
}</script>