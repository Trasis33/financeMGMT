export interface User {
  id: number;
  name: string;
  email: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ProfileResponse {
  user: User;
}

export type TransactionType = 'INCOME' | 'EXPENSE'

export interface Transaction {
  id: number;
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export interface MonthlyReport {
  month: string;
  income: number;
  expenses: number;
  balance: number;
}

export interface CreateTransactionPayload {
  date: string;
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  category: string;
}

export interface UpdateTransactionPayload {
  date?: string;
  description?: string;
  amount?: number;
  type?: 'INCOME' | 'EXPENSE';
  category?: string;
}

export interface ApiResponse<T> {
  data: T;
  error: string | null;
}

export interface ApiError {
  message: string;
  status?: number;
}

export interface SplitExpense {
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
  }
}

export interface Share {
  userId: number;
  amount: number;
  user?: {
    id: number;
    name: string;
  }
}

export interface Balance {
  userId: number;
  balance: number;
  user: {
    id: number;
    name: string;
  }
}
