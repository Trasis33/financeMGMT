<template>
  <div>
    <!-- Page header -->
    <div class="pb-5 border-b border-gray-200 sm:flex sm:items-center sm:justify-between">
      <h1 class="text-2xl font-semibold text-gray-900">Split Expenses</h1>
      <div class="mt-3 sm:mt-0 sm:ml-4">
        <button
          @click="navigateTo('/split-expenses/new')"
          class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Add Split Expense
        </button>
      </div>
    </div>

    <!-- Balance Overview -->
    <div class="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="balance in balances"
        :key="balance.userId"
        class="bg-white overflow-hidden shadow rounded-lg"
      >
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                <span class="text-primary-600 font-medium text-lg">
                  {{ getInitials(balance.userName) }}
                </span>
              </div>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">
                  {{ balance.userName }}
                </dt>
                <dd class="flex items-baseline">
                  <div
                    :class="[
                      'text-2xl font-semibold',
                      balance.netBalance > 0 ? 'text-green-600' : balance.netBalance < 0 ? 'text-red-600' : 'text-gray-900'
                    ]"
                  >
                    {{ formatCurrency(balance.netBalance) }}
                  </div>
                </dd>
              </dl>
            </div>
          </div>
          <div class="mt-4 border-t border-gray-200 pt-4">
            <div v-if="balance.owes.length > 0">
              <p class="text-sm text-gray-500">Owes:</p>
              <ul class="mt-2 divide-y divide-gray-200">
                <li
                  v-for="debt in balance.owes"
                  :key="debt.userId"
                  class="py-2 text-sm"
                >
                  <span class="text-gray-900">{{ debt.userName }}:</span>
                  <span class="text-red-600 ml-1">{{ formatCurrency(debt.amount) }}</span>
                </li>
              </ul>
            </div>
            <div v-if="balance.isOwed.length > 0">
              <p class="text-sm text-gray-500 mt-2">Is owed:</p>
              <ul class="mt-2 divide-y divide-gray-200">
                <li
                  v-for="credit in balance.isOwed"
                  :key="credit.userId"
                  class="py-2 text-sm"
                >
                  <span class="text-gray-900">{{ credit.userName }}:</span>
                  <span class="text-green-600 ml-1">{{ formatCurrency(credit.amount) }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Split Expenses List -->
    <div class="mt-8">
      <div class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
        <table class="min-w-full divide-y divide-gray-300">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                Description
              </th>
              <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Paid By
              </th>
              <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Total Amount
              </th>
              <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Your Share
              </th>
              <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Status
              </th>
              <th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-6">
                <span class="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 bg-white">
            <tr v-for="expense in splitExpenses" :key="expense.id">
              <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900 sm:pl-6">
                {{ expense.description }}
              </td>
              <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                {{ expense.payer?.name }}
              </td>
              <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                {{ formatCurrency(expense.amount) }}
              </td>
              <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                {{ formatCurrency(getUserShare(expense)) }}
              </td>
              <td class="whitespace-nowrap px-3 py-4 text-sm">
                <span
                  :class="[
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    isExpenseSettled(expense) ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  ]"
                >
                  {{ isExpenseSettled(expense) ? 'Settled' : 'Pending' }}
                </span>
              </td>
              <td class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                <button
                  v-if="!isExpenseSettled(expense) && expense.paidBy !== userId"
                  @click="handleSettle(expense)"
                  class="text-primary-600 hover:text-primary-900"
                >
                  Settle
                </button>
                <button
                  v-if="expense.paidBy === userId && canEdit(expense)"
                  @click="handleEdit(expense)"
                  class="text-primary-600 hover:text-primary-900 ml-4"
                >
                  Edit
                </button>
                <button
                  v-if="expense.paidBy === userId && canDelete(expense)"
                  @click="handleDelete(expense)"
                  class="text-red-600 hover:text-red-900 ml-4"
                >
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth']
})

const { fetchSplitExpenses, getBalances, settleExpense, deleteSplitExpense } = useSplitExpenses()
const userId = computed(() => useState('user').value?.id)

const splitExpenses = ref([])
const balances = ref([])
const isLoading = ref(false)

// Load split expenses and balances
const loadData = async () => {
  isLoading.value = true
  try {
    const [expensesData, balancesData] = await Promise.all([
      fetchSplitExpenses(),
      getBalances()
    ])
    splitExpenses.value = expensesData
    balances.value = balancesData
  } catch (error) {
    console.error('Error loading data:', error)
  } finally {
    isLoading.value = false
  }
}

// Get user's share of an expense
const getUserShare = (expense: any) => {
  const userShare = expense.shares.find((share: any) => share.userId === userId.value)
  return userShare ? userShare.amount : 0
}

// Check if expense is settled for current user
const isExpenseSettled = (expense: any) => {
  const userShare = expense.shares.find((share: any) => share.userId === userId.value)
  return userShare ? userShare.settled : true
}

// Check if expense can be edited
const canEdit = (expense: any) => {
  return expense.shares.every((share: any) => !share.settled || share.userId === userId.value)
}

// Check if expense can be deleted
const canDelete = (expense: any) => {
  return expense.shares.every((share: any) => !share.settled || share.userId === userId.value)
}

// Handle settle expense
const handleSettle = async (expense: any) => {
  try {
    await settleExpense(expense.id)
    await loadData()
  } catch (error) {
    console.error('Error settling expense:', error)
  }
}

// Handle edit expense
const handleEdit = (expense: any) => {
  navigateTo(`/split-expenses/${expense.id}`)
}

// Handle delete expense
const handleDelete = async (expense: any) => {
  if (!confirm('Are you sure you want to delete this expense?')) return

  try {
    await deleteSplitExpense(expense.id)
    await loadData()
  } catch (error) {
    console.error('Error deleting expense:', error)
  }
}

// Format utilities
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
}

// Load initial data
onMounted(() => {
  loadData()
})</script>