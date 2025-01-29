import type { TransactionState, Transaction, CreateTransaction, MonthlyReport } from '../types/TransactionState'
import { useRuntimeConfig } from '#imports'
import { useAuth } from './useAuth'

export const useTransactions = () => {
  const config = useRuntimeConfig()
  const API_BASE = config.public.apiBase
  const { getAuthToken } = useAuth()

  const state = useState<TransactionState>('transactions', () => {
    // Try to hydrate from local storage with version check
    if (process.client) {
      try {
        const saved = localStorage.getItem('transactions')
        if (saved) {
          const parsed = JSON.parse(saved)
          // Add version check for future migrations
          if (parsed?.version === 1) {
            // Clean up any stale data older than 30 days
            const thirtyDaysAgo = new Date()
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
            
            return {
              ...parsed,
              transactions: parsed.transactions.filter((t: Transaction) => 
                new Date(t.date) >= thirtyDaysAgo
              ),
              version: 1
            }
          }
        }
      } catch (e) {
        console.error('Failed to parse transactions from localStorage', e)
        // Clear corrupted data
        localStorage.removeItem('transactions')
      }
    }
    
    return {
      transactions: [],
      monthlyReports: [],
      isLoading: false,
      error: null
    }
  })

  // Persist to local storage with error handling
  const persistState = (newState: TransactionState) => {
    if (process.client && newState.transactions.length > 0) {
      try {
        localStorage.setItem('transactions', JSON.stringify({
          ...newState,
          version: 1, // Add version for future migrations
          lastUpdated: new Date().toISOString()
        }))
      } catch (e) {
        console.error('Failed to persist transactions:', e)
        // Handle storage quota exceeded
        if (e instanceof DOMException && e.name === 'QuotaExceededError') {
          // Clear oldest transactions to free space
          state.value.transactions = state.value.transactions.slice(-100)
          persistState(state.value) // Retry with reduced data
        }
      }
    }
  }

  watch(() => state.value, persistState, { deep: true })

  const getHeaders = () => {
    const token = getAuthToken()
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }

  // Create transaction
  const createTransaction = async (transaction: CreateTransaction) => {
    state.value.isLoading = true
    state.value.error = null

    try {
      const url = new URL(`${API_BASE}/api/transactions`)
      const response = await $fetch<{ transaction: Transaction }>(url.toString(), {
        method: 'POST',
        body: transaction,
        headers: getHeaders()
      })

      if (response.error) {
        throw new Error('Failed to create transaction')
      }

      if (response.transaction) {
        state.value.transactions = [response.transaction, ...state.value.transactions]
        await fetchMonthlyReports() // Refresh monthly reports
      }

      return response.transaction
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
      const url = new URL(`${API_BASE}/api/transactions`)
      if (limit) {
        url.searchParams.append('limit', limit.toString())
      }

      const response = await $fetch<{ transactions: Transaction[] }>(url.toString(), {
        headers: getHeaders()
      })
      state.value.transactions = response.transactions
    } catch (err) {
      console.error('Error fetching transactions:', err)
      state.value.error = 'Failed to fetch transactions'
    } finally {
      state.value.isLoading = false
    }
  }

  // Fetch monthly reports
  const fetchMonthlyReports = async () => {
    state.value.isLoading = true
    state.value.error = null

    try {
      const response = await $fetch<{ reports: MonthlyReport[] }>(`${API_BASE}/api/transactions/reports/monthly`, {
        headers: getHeaders()
      })
      state.value.monthlyReports = response.reports
    } catch (err) {
      console.error('Error fetching monthly reports:', err)
      state.value.error = 'Failed to fetch monthly reports'
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
      const url = new URL(`${API_BASE}/api/transactions/${id}`)
      const response = await $fetch(url.toString(), {
        method: 'DELETE',
        headers: getHeaders()
      })

      if (response.error) {
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
