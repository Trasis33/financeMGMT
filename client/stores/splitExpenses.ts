import { defineStore } from 'pinia'
import type { SplitExpense, Balance, Share } from '../types/api'

interface SplitExpensesState {
  expenses: SplitExpense[]
  balances: Balance[]
  isLoading: boolean
  error: string | null
}

export const useSplitExpensesStore = defineStore('splitExpenses', {
  state: (): SplitExpensesState => ({
    expenses: [],
    balances: [],
    isLoading: false,
    error: null
  }),

  actions: {
    async fetchSplitExpenses() {
      this.isLoading = true
      this.error = null
      
      try {
        const { data, error } = await useApiFetch<{ expenses: SplitExpense[] }>(
          '/api/split-expenses'
        )

        if (error.value) {
          throw new Error('Failed to fetch split expenses')
        }

        if (data.value) {
          this.expenses = data.value.expenses || []
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to fetch split expenses'
        console.error('Error fetching split expenses:', error)
      } finally {
        this.isLoading = false
      }
    },

    async createSplitExpense(data: any) {
      this.isLoading = true
      this.error = null
      
      try {
        const { data: responseData, error } = await useApiFetch<{ expense: SplitExpense }>(
          '/api/split-expenses',
          {
            method: 'POST',
            body: data
          }
        )

        if (error.value) {
          throw new Error('Failed to create split expense')
        }

        if (responseData.value?.expense) {
          this.expenses = [responseData.value.expense, ...this.expenses]
          return responseData.value.expense
        }
        throw new Error('Failed to create split expense: No data returned')
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to create split expense'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async updateSplitExpense(id: number, data: any) {
      this.isLoading = true
      this.error = null
      
      try {
        const { data: responseData, error } = await useApiFetch<{ expense: SplitExpense }>(
          `/api/split-expenses/${id}`,
          {
            method: 'PUT',
            body: data
          }
        )

        if (error.value) {
          throw new Error('Failed to update split expense')
        }

        if (responseData.value?.expense) {
          this.expenses = this.expenses.map(expense => 
            expense.id === id ? responseData.value!.expense : expense
          )
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to update split expense'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async deleteSplitExpense(id: number) {
      this.isLoading = true
      this.error = null
      
      try {
        const { error } = await useApiFetch(
          `/api/split-expenses/${id}`,
          {
            method: 'DELETE'
          }
        )

        if (error.value) {
          throw new Error('Failed to delete split expense')
        }

        this.expenses = this.expenses.filter(expense => expense.id !== id)
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to delete split expense'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async getBalances() {
      this.isLoading = true
      this.error = null
      
      try {
        const { data, error } = await useApiFetch<{ balances: Balance[] }>(
          '/api/split-expenses/balances'
        )

        if (error.value) {
          throw new Error('Failed to fetch balances')
        }

        if (data.value) {
          this.balances = data.value.balances || []
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to fetch balances'
        console.error('Error fetching balances:', error)
      } finally {
        this.isLoading = false
      }
    },

    async settleExpense(id: number) {
      this.isLoading = true
      this.error = null
      
      try {
        const { error } = await useApiFetch(
          `/api/split-expenses/${id}/settle`,
          {
            method: 'POST'
          }
        )

        if (error.value) {
          throw new Error('Failed to settle expense')
        }

        await this.fetchSplitExpenses()
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to settle expense'
        throw error
      } finally {
        this.isLoading = false
      }
    }
  }
})
