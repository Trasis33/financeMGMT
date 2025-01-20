import type { Ref } from 'vue'

interface Transaction {
  id: number
  date: string
  description: string
  amount: number
  type: 'INCOME' | 'EXPENSE'
  category: string
}

interface CreateTransaction {
  date: string
  description: string
  amount: number
  type: 'INCOME' | 'EXPENSE'
  category: string
}

interface MonthlyReport {
  month: string
  income: number
  expenses: number
  balance: number
}

interface TransactionState {
  transactions: Transaction[]
  monthlyReports: MonthlyReport[]
  isLoading: boolean
  error: string | null
}

export const useTransactions = () => {
  const state = useState<TransactionState>('transactions', () => ({
    transactions: [],
    monthlyReports: [],
    isLoading: false,
    error: null
  }))

  // Create transaction
  const createTransaction = async (transaction: CreateTransaction) => {
    state.value.isLoading = true
    state.value.error = null

    try {
      const { data, error } = await useApiFetch<{ transaction: Transaction }>(
        '/api/transactions',
        {
          method: 'POST',
          body: transaction
        }
      )

      if (error.value) {
        throw new Error('Failed to create transaction')
      }

      if (data.value?.transaction) {
        state.value.transactions = [data.value.transaction, ...state.value.transactions]
        await fetchMonthlyReports() // Refresh monthly reports
      }

      return data.value?.transaction
    } catch (err) {
      state.value.error = err instanceof Error ? err.message : 'An error occurred'
      console.error('Error creating transaction:', err)
      throw err
    } finally {
      state.value.isLoading = false
    }
  }

  // Fetch transactions
  const fetchTransactions = async (limit?: number) => {
    state.value.isLoading = true
    state.value.error = null

    try {
      const { data, error } = await useApiFetch<{ transactions: Transaction[] }>(
        `/api/transactions${limit ? `?limit=${limit}` : ''}`
      )

      if (error.value) {
        throw new Error('Failed to fetch transactions')
      }

      if (data.value) {
        state.value.transactions = data.value.transactions || []
      }
    } catch (err) {
      state.value.error = err instanceof Error ? err.message : 'An error occurred'
      console.error('Error fetching transactions:', err)
    } finally {
      state.value.isLoading = false
    }
  }

  // Fetch monthly reports
  const fetchMonthlyReports = async () => {
    state.value.isLoading = true
    state.value.error = null

    try {
      const { data, error } = await useApiFetch<{ reports: MonthlyReport[] }>(
        '/api/transactions/reports/monthly'
      )

      if (error.value) {
        throw new Error('Failed to fetch monthly reports')
      }

      if (data.value) {
        state.value.monthlyReports = data.value.reports || []
      }
    } catch (err) {
      state.value.error = err instanceof Error ? err.message : 'An error occurred'
      console.error('Error fetching monthly reports:', err)
    } finally {
      state.value.isLoading = false
    }
  }

  // Get current month data
  const getCurrentMonthData = computed(() => {
    if (!state.value.monthlyReports.length) {
      return {
        income: 0,
        expenses: 0,
        balance: 0
      }
    }

    return state.value.monthlyReports[state.value.monthlyReports.length - 1]
  })

  // Delete transaction
  const deleteTransaction = async (id: number) => {
    state.value.isLoading = true
    state.value.error = null

    try {
      const { error } = await useApiFetch(
        `/api/transactions/${id}`,
        {
          method: 'DELETE'
        }
      )

      if (error.value) {
        throw new Error('Failed to delete transaction')
      }

      state.value.transactions = state.value.transactions.filter(t => t.id !== id)
      await fetchMonthlyReports() // Refresh monthly reports
    } catch (err) {
      state.value.error = err instanceof Error ? err.message : 'An error occurred'
      console.error('Error deleting transaction:', err)
      throw err
    } finally {
      state.value.isLoading = false
    }
  }

  return {
    transactions: computed(() => state.value.transactions),
    monthlyReports: computed(() => state.value.monthlyReports),
    isLoading: computed(() => state.value.isLoading),
    error: computed(() => state.value.error),
    getCurrentMonthData,
    createTransaction,
    fetchTransactions,
    fetchMonthlyReports,
    deleteTransaction
  }
}