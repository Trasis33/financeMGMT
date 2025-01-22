interface Share {
  userId: number;
  amount: number;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  settled: boolean;
}

interface SplitExpense {
  id: number;
  amount: number;
  description: string;
  paidBy: number;
  shares: Share[];
  createdAt: string;
  updatedAt: string;
  payer?: {
    id: number;
    name: string;
    email: string;
  };
}

interface CreateSplitExpenseData {
  amount: number;
  description: string;
  shares: Omit<Share, 'settled'>[];
}

interface Balance {
  userId: number;
  userName: string;
  owes: {
    userId: number;
    userName: string;
    amount: number;
  }[];
  isOwed: {
    userId: number;
    userName: string;
    amount: number;
  }[];
  netBalance: number;
}

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
      // Map the participants array to shares array to match frontend structure
      return data.expenses.map((expense: any) => ({
        ...expense,
        shares: expense.participants,
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
      const response = await fetch(
        `${config.public.apiBaseUrl}/api/split-expenses`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token.value}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        }
      )

      if (!response.ok) throw new Error('Failed to create split expense')

      return await response.json() as SplitExpense
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

  return {
    fetchSplitExpenses,
    createSplitExpense,
    updateSplitExpense,
    deleteSplitExpense,
    getBalances,
    settleExpense
  }
}
