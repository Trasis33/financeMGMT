<template>
  <div>
    <!-- Page header -->
    <div class="pb-5 border-b border-gray-200 sm:flex sm:items-center sm:justify-between">
      <h1 class="text-2xl font-semibold text-gray-900">Dashboard</h1>
      <div class="mt-3 sm:mt-0 sm:ml-4">
        <NuxtLink
          to="/transactions/new"
          class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Add Transaction
        </NuxtLink>
      </div>
    </div>

    <ClientOnly>
      <!-- Dashboard Content -->
      <Suspense>
        <template #default>
          <div class="mt-6">
            <!-- Loading state -->
            <div v-if="pending" class="flex justify-center items-center py-8">
              <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
            </div>

            <!-- Error state -->
            <div v-else-if="error" class="rounded-md bg-red-50 p-4">
              <div class="flex">
                <div class="flex-shrink-0">
                  <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                  </svg>
                </div>
                <div class="ml-3">
                  <h3 class="text-sm font-medium text-red-800">{{ error }}</h3>
                </div>
              </div>
            </div>

            <template v-else>
              <!-- Account balance cards -->
              <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <!-- Total Balance -->
                <div class="bg-white overflow-hidden shadow rounded-lg">
                  <div class="p-5">
                    <div class="flex items-center">
                      <div class="flex-shrink-0">
                        <svg class="h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                      </div>
                      <div class="ml-5 w-0 flex-1">
                        <dl>
                          <dt class="text-sm font-medium text-gray-500 truncate">
                            Total Balance
                          </dt>
                          <dd class="flex items-baseline">
                            <div class="text-2xl font-semibold text-gray-900">
                              {{ formatCurrency(data?.monthlyData?.balance || 0) }}
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Monthly Income -->
                <div class="bg-white overflow-hidden shadow rounded-lg">
                  <div class="p-5">
                    <div class="flex items-center">
                      <div class="flex-shrink-0">
                        <svg class="h-6 w-6 text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 11l5-5m0 0l5 5m-5-5v12" />
                        </svg>
                      </div>
                      <div class="ml-5 w-0 flex-1">
                        <dl>
                          <dt class="text-sm font-medium text-gray-500 truncate">
                            Monthly Income
                          </dt>
                          <dd class="flex items-baseline">
                            <div class="text-2xl font-semibold text-gray-900">
                              {{ formatCurrency(data?.monthlyData?.income || 0) }}
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Monthly Expenses -->
                <div class="bg-white overflow-hidden shadow rounded-lg">
                  <div class="p-5">
                    <div class="flex items-center">
                      <div class="flex-shrink-0">
                        <svg class="h-6 w-6 text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                        </svg>
                      </div>
                      <div class="ml-5 w-0 flex-1">
                        <dl>
                          <dt class="text-sm font-medium text-gray-500 truncate">
                            Monthly Expenses
                          </dt>
                          <dd class="flex items-baseline">
                            <div class="text-2xl font-semibold text-gray-900">
                              {{ formatCurrency(data?.monthlyData?.expenses || 0) }}
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Recent Transactions -->
              <div class="mt-8">
                <div class="flex items-center justify-between">
                  <h3 class="text-lg font-medium text-gray-900">Recent Transactions</h3>
                  <NuxtLink
                    to="/transactions"
                    class="text-sm font-medium text-primary-600 hover:text-primary-500"
                  >
                    View all
                  </NuxtLink>
                </div>
                <div class="mt-4 overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                  <table class="min-w-full divide-y divide-gray-300">
                    <thead class="bg-gray-50">
                      <tr>
                        <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Date</th>
                        <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Description</th>
                        <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Category</th>
                        <th scope="col" class="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Amount</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200 bg-white">
                      <tr v-for="transaction in data?.transactions" :key="transaction.id">
                        <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900 sm:pl-6">
                          {{ formatDate(transaction.date) }}
                        </td>
                        <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {{ transaction.description }}
                        </td>
                        <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {{ transaction.category }}
                        </td>
                        <td :class="[
                          'whitespace-nowrap px-3 py-4 text-sm text-right',
                          transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                        ]">
                          {{ formatCurrency(transaction.amount) }}
                        </td>
                      </tr>
                      <tr v-if="!data?.transactions?.length">
                        <td colspan="4" class="px-3 py-4 text-sm text-gray-500 text-center">
                          No transactions found
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </template>
          </div>
        </template>
        <template #fallback>
          <div class="mt-6 flex justify-center items-center py-8">
            <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        </template>
      </Suspense>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default',
  middleware: ['auth']
})

interface TransactionState {
  transactions: Array<{
    id: number
    date: string
    description: string
    amount: number
    type: 'INCOME' | 'EXPENSE'
    category: string
  }>
}

interface MonthlyData {
  balance: number
  income: number
  expenses: number
}

interface DashboardData {
  transactions: TransactionState['transactions']
  monthlyData: MonthlyData
}

// Format utilities
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const route = useRoute()

// Fetch data
const { data, pending, error, refresh } = useAsyncData<DashboardData>(
  'dashboard',
  async () => {
    const { fetchTransactions, fetchMonthlyReports, getCurrentMonthData } = useTransactions()

    // Fetch data in parallel
    await Promise.all([
      fetchTransactions(5),
      fetchMonthlyReports()
    ])

    // Return the processed data
    const transactionState = useState<TransactionState>('transactions')
    return {
      transactions: transactionState.value?.transactions || [],
      monthlyData: getCurrentMonthData.value
    }
  },
  {
    server: false,
    lazy: true,
    immediate: true
  }
)

onMounted(() => {
  // Any side effects or initializations can be placed here
  console.log('Component mounted');
})

// Refresh data when returning to dashboard
watch(
  () => route.path,
  (newPath) => {
    if (newPath === '/dashboard') {
      refresh()
    }
  }
)
</script>