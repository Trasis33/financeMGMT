import { defineStore } from 'pinia'
import type { Transaction, MonthlyReport, TransactionType } from '../types/api'

interface TransactionsState {
  transactions: Transaction[]
  monthlyReports: MonthlyReport[]
  isLoading: boolean
  error: string | null
  selectedTransaction: Transaction | null
}

export const useTransactionsStore = defineStore('transactions', {
  state: (): TransactionsState => ({
    transactions: [],
    monthlyReports: [],
    isLoading: false,
    error: null,
    selectedTransaction: null
  }),

  getters: {
    currentMonthData: (state) => {
      if (!state.monthlyReports.length) {
        return {
          income: 0,
          expenses: 0,
          balance: 0
        }
      }
      return state.monthlyReports[state.monthlyReports.length - 1]
    },
    recentTransactions: (state) => (limit = 5) => {
      return state.transactions.slice(0, limit)
    },
    transactionCategories: () => {
      return {
        income: [
          'Salary',
          'Freelance',
          'Investment',
          'Business',
          'Gift',
          'Other Income'
        ],
        expense: [
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
      }
    }
  },

  actions: {
    async fetchTransactions(limit?: number, type?: TransactionType) {
      this.isLoading = true
      this.error = null
      
      try {
        const query = new URLSearchParams()
        if (limit) query.set('limit', limit.toString())
        if (type) query.set('type', type)

        const { data, error } = await useApiFetch<{ transactions: Transaction[] }>(
          `/api/transactions?${query.toString()}`
        )

        if (error.value) {
          throw new Error('Failed to fetch transactions')
        }

        if (data.value) {
          this.transactions = data.value.transactions || []
        }
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'An error occurred'
        console.error('Error fetching transactions:', err)
      } finally {
        this.isLoading = false
      }
    },

    async fetchTransactionById(id: number) {
      this.isLoading = true
      this.error = null

      try {
        const { data, error } = await useApiFetch<{ transaction: Transaction }>(
          `/api/transactions/${id}`
        )

        if (error.value) {
          throw new Error('Failed to fetch transaction')
        }

        if (data.value?.transaction) {
          this.selectedTransaction = data.value.transaction
          // Update or add to transactions list
          const index = this.transactions.findIndex(t => t.id === id)
          if (index !== -1) {
            this.transactions.splice(index, 1, data.value.transaction)
          } else {
            this.transactions.unshift(data.value.transaction)
          }
        }
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Failed to fetch transaction'
        console.error('Error fetching transaction:', err)
      } finally {
        this.isLoading = false
      }
    },

    async createTransaction(transaction: Transaction) {
      this.isLoading = true
      this.error = null

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
          this.transactions = [data.value.transaction, ...this.transactions]
          await this.fetchMonthlyReports()
        }
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Failed to create transaction'
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async fetchMonthlyReports() {
      this.isLoading = true
      this.error = null

      try {
        const { data, error } = await useApiFetch<{ reports: MonthlyReport[] }>(
          '/api/transactions/reports/monthly'
        )

        if (error.value) {
          throw new Error('Failed to fetch monthly reports')
        }

        if (data.value) {
          this.monthlyReports = data.value.reports || []
        }
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'An error occurred'
        console.error('Error fetching monthly reports:', err)
      } finally {
        this.isLoading = false
      }
    },

    async updateTransaction(transaction: Transaction) {
      this.isLoading = true
      this.error = null

      try {
        const { data, error } = await useApiFetch<{ transaction: Transaction }>(
          `/api/transactions/${transaction.id}`,
          {
            method: 'PUT',
            body: transaction
          }
        )

        if (error.value) {
          throw new Error('Failed to update transaction')
        }

        if (data.value?.transaction) {
          const index = this.transactions.findIndex(t => t.id === transaction.id)
          if (index !== -1) {
            this.transactions.splice(index, 1, data.value.transaction)
          }
          await this.fetchMonthlyReports()
        }
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Failed to update transaction'
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async deleteTransaction(id: number) {
      this.isLoading = true
      this.error = null

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

        this.transactions = this.transactions.filter(t => t.id !== id)
        await this.fetchMonthlyReports()
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Failed to delete transaction'
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async init() {
      if (this.isLoading) return
      
      try {
        await Promise.all([
          this.fetchTransactions(),
          this.fetchMonthlyReports()
        ])
      } catch (error) {
        console.error('Failed to initialize transactions store:', error)
        throw error
      }
    },

    resetSelectedTransaction() {
      this.selectedTransaction = null
    },

    formatCurrency(amount: number) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(amount)
    },

    formatDate(date: string) {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }
  }
})