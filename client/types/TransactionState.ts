export interface Transaction {
  id: number;
  date: string;
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  category: string;
}
export interface CreateTransaction {
  date: string;
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  category: string;
}
export interface MonthlyReport {
  month: string;
  income: number;
  expenses: number;
  balance: number;
}
export interface TransactionState {
  transactions: Transaction[];
  monthlyReports: MonthlyReport[];
  isLoading: boolean;
  error: string | null;
}
