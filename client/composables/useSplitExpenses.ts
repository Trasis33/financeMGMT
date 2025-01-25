import type { SplitExpense, CreateSplitExpenseData, Balance } from "../types/SplitExpense";

export const useSplitExpenses = () => {
  const config = useRuntimeConfig()
  const token = useState('token')

  const fetchSplitExpenses = async () => {
    try {
      const response = await fetch(
        `${config.public.apiBaseUrl}/api/split-expenses`,
        {
          headers: {
            'Authorization': `Bearer ${token.value}`
          }
        }
      )

      if (!response.ok) throw new Error('Failed to fetch split expenses')

      const data = await response.json()
      // Map the participants array to shares array and ensure amounts are calculated
      return data.expenses.map((expense: any) => ({
        ...expense,
        shares: expense.participants.map((p: any) => ({
          ...p,
          amount: p.share * expense.amount // Calculate the actual amount
        })),
        paidBy: expense.creatorId,
        payer: expense.creator
      })) as SplitExpense[]
    } catch (error) {
      console.error('Error fetching split expenses:', error)
      throw error
    }
  }

  const createSplitExpense = async (data: CreateSplitExpenseData) => {
    try {
      console.log('Creating split expense with data:', data);
      
      const response = await fetch(
        `${config.public.apiBaseUrl}/api/split-expenses`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token.value}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestData)
        }
      )

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to create split expense')
      }

      console.log('Split expense created:', result);
      return result
    } catch (error) {
      console.error('Error creating split expense:', error)
      throw error
    }
  }

  const updateSplitExpense = async (id: number, data: Partial<CreateSplitExpenseData>) => {
    try {
      const response = await fetch(
        `${config.public.apiBaseUrl}/api/split-expenses/${id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token.value}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        }
      )

      if (!response.ok) throw new Error('Failed to update split expense')

      return await response.json() as SplitExpense
    } catch (error) {
      console.error('Error updating split expense:', error)
      throw error
    }
  }

  const deleteSplitExpense = async (id: number) => {
    try {
      const response = await fetch(
        `${config.public.apiBaseUrl}/api/split-expenses/${id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token.value}`
          }
        }
      )

      if (!response.ok) throw new Error('Failed to delete split expense')
    } catch (error) {
      console.error('Error deleting split expense:', error)
      throw error
    }
  }

  const getBalances = async () => {
    try {
      const response = await fetch(
        `${config.public.apiBaseUrl}/api/split-expenses/balances`,
        {
          headers: {
            'Authorization': `Bearer ${token.value}`
          }
        }
      )

      if (!response.ok) throw new Error('Failed to fetch balances')

      return await response.json() as Balance[]
    } catch (error) {
      console.error('Error fetching balances:', error)
      throw error
    }
  }

  const settleExpense = async (id: number) => {
    try {
      const response = await fetch(
        `${config.public.apiBaseUrl}/api/split-expenses/${id}/settle`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token.value}`
          }
        }
      )

      if (!response.ok) throw new Error('Failed to settle expense')

      return await response.json()
    } catch (error) {
      console.error('Error settling expense:', error)
      throw error
    }
  }

  const fetchSplitExpense = async (id: number) => {
    try {
      const response = await fetch(
        `${config.public.apiBaseUrl}/api/split-expenses/${id}`,
        {
          headers: {
            'Authorization': `Bearer ${token.value}`
          }
        }
      )

      if (!response.ok) throw new Error('Failed to fetch split expense')

      const data = await response.json()
      if (!data.expense) throw new Error('Split expense not found')

      // Transform the data to match the expected format
      return {
        ...data.expense,
        shares: data.expense.participants || []
      }
    } catch (error) {
      console.error('Error fetching split expense:', error)
      throw error
    }
  }

  return {
    fetchSplitExpenses,
    createSplitExpense,
    updateSplitExpense,
    deleteSplitExpense,
    getBalances,
    settleExpense,
    fetchSplitExpense
  }
}
