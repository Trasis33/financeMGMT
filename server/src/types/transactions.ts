export type TransactionType = 'INCOME' | 'EXPENSE';

export interface TransactionCreate {
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
}

export interface TransactionUpdate {
  date?: string;
  description?: string;
  amount?: number;
  type?: TransactionType;
  category?: string;
}

export interface MonthlyReport {
  month: string;
  income: number;
  expenses: number;
  balance: number;
}

export interface Transaction extends TransactionCreate {
  id: number;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
}