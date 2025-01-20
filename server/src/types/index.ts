export interface Transaction {
  id: number;
  userId: number;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  category: string;
  description?: string | null;
  date: Date;
  recurring: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MonthlyReport {
  month: string;
  year: number;
  income: number;
  expenses: number;
  balance: number;
}

export interface SplitExpense {
  id: number;
  amount: number;
  description: string;
  paidBy: number;
  shares: Share[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Share {
  id: number;
  splitExpenseId: number;
  userId: number;
  amount: number;
  settled: boolean;
}

export interface Balance {
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