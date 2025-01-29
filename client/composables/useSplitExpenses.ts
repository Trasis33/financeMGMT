import { ref } from 'vue'
import { useAuth } from './useAuth'
import type { CreateSplitExpenseData, SplitExpense, Balance, Owes, Participant, SimpleSplitExpense, Share } from "../types/SplitExpense";

export const useSplitExpenses = () => {
  const config = useRuntimeConfig()
  const API_BASE = config.public.apiBase
  const { getAuthToken } = useAuth()

  const expenses = ref<SplitExpense[]>([])
  const balances = ref<Balance[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const getHeaders = () => {
    const token = getAuthToken()
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }

  const fetchSplitExpenses = async () => {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await $fetch<{ expenses: SimpleSplitExpense[] }>(`${API_BASE}/api/split-expenses`, {
        headers: getHeaders()
      })
      const transformedExpenses = response.expenses.map((expense: SimpleSplitExpense) => ({
        ...expense,
        shares: expense.participants.map((p: Participant): Share => ({
          userId: p.userId,
          amount: p.share * expense.amount,
          share: p.share,
          settled: false
        })),
        paidBy: expense.paidById,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })) as SplitExpense[]
      expenses.value = transformedExpenses
      return transformedExpenses
    } catch (err) {
      console.error('Error fetching split expenses:', err)
      error.value = 'Failed to fetch split expenses'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const fetchBalances = async () => {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await $fetch<any>(`${API_BASE}/api/split-expenses/balances`, {
        headers: getHeaders()
      })
      
      // Transform the API response to match the expected Balance interface
      const balanceData = response.data || response.balances || []
      balances.value = balanceData.map((b: any) => ({
        userId: b.userId || b.user_id,
        userName: b.userName || b.user_name || '',
        owes: (b.owes || []).map((o: any) => ({
          userId: o.userId || o.user_id,
          userName: o.userName || o.user_name || '',
          amount: o.amount || 0
        })),
        isOwed: (b.isOwed || []).map((o: any) => ({
          userId: o.userId || o.user_id,
          userName: o.userName || o.user_name || '',
          amount: o.amount || 0
        })),
        netBalance: b.netBalance || b.net_balance || b.balance || 0
      }))
      
      return balances.value
    } catch (err) {
      console.error('Error fetching balances:', err)
      error.value = 'Failed to fetch balances'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const createSplitExpense = async (data: CreateSplitExpenseData) => {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await $fetch<{ expense: SplitExpense }>(`${API_BASE}/api/split-expenses`, {
        method: 'POST',
        body: {
          ...data,
          paidById: data.paidById
        },
        headers: getHeaders()
      })

      if (response.expense) {
        expenses.value = [response.expense, ...expenses.value]
        await fetchBalances()
      }

      return response.expense
    } catch (err) {
      console.error('Error creating split expense:', err)
      error.value = 'Failed to create split expense'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const updateSplitExpense = async (id: number, data: Partial<CreateSplitExpenseData>) => {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await $fetch<{ expense: SplitExpense }>(`${API_BASE}/api/split-expenses/${id}`, {
        method: 'PUT',
        body: data,
        headers: getHeaders()
      })

      if (response.expense) {
        expenses.value = expenses.value.map(e => e.id === id ? response.expense : e)
        await fetchBalances()
      }

      return response.expense
    } catch (err) {
      console.error('Error updating split expense:', err)
      error.value = 'Failed to update split expense'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const deleteSplitExpense = async (id: number) => {
    try {
      isLoading.value = true
      error.value = null
      
      await $fetch(`${API_BASE}/api/split-expenses/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      })

      expenses.value = expenses.value.filter(e => e.id !== id)
      await fetchBalances()
    } catch (err) {
      console.error('Error deleting split expense:', err)
      error.value = 'Failed to delete split expense'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const settleExpense = async (id: number) => {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await $fetch<{ success: boolean }>(`${API_BASE}/api/split-expenses/${id}/settle`, {
        method: 'POST',
        headers: getHeaders()
      })

      return response
    } catch (err) {
      console.error('Error settling expense:', err)
      error.value = 'Failed to settle expense'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const fetchSplitExpense = async (id: number) => {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await $fetch<{ expense: SimpleSplitExpense }>(`${API_BASE}/api/split-expenses/${id}`, {
        headers: getHeaders()
      })

      if (!response.expense) throw new Error('Split expense not found')

      // Transform the data to match the expected format
      return {
        ...response.expense,
        shares: response.expense.participants.map((p: Participant): Share => ({
          userId: p.userId,
          amount: p.share * response.expense.amount,
          share: p.share,
          settled: false
        })),
        paidBy: response.expense.paidById,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as SplitExpense
    } catch (err) {
      console.error('Error fetching split expense:', err)
      error.value = 'Failed to fetch split expense'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    expenses,
    balances,
    isLoading,
    error,
    fetchSplitExpenses,
    fetchBalances,
    createSplitExpense,
    updateSplitExpense,
    deleteSplitExpense,
    settleExpense,
    fetchSplitExpense
  }
}
