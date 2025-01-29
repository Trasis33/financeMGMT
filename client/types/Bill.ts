export interface Bill {
  id: number;
  description: string;
  amount: number;
  dueDate: Date;
  creatorId: number;
  isRecurring: boolean;
  recurringPeriod?: string;
  category: string;
  notes?: string;
  participants?: BillParticipant[];
  payments?: BillPayment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface BillParticipant {
  id: number;
  billId: number;
  userId: number;
  share: number;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface BillPayment {
  id: number;
  billId: number;
  userId: number;
  amount: number;
  paymentDate: Date;
  notes?: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export type BillWithParticipants = Bill & {
  participants: BillParticipant[];
  payments: BillPayment[];
  creator: {
    id: number;
    name: string;
    email: string;
  };
};

export interface CreateBillInput {
  description: string;
  amount: number;
  dueDate: string; // ISO date string for form input
  isRecurring: boolean;
  recurringPeriod?: string;
  category: string;
  notes?: string;
  participants: {
    userId: number;
    share: number;
  }[];
}

export interface UpdateBillInput extends Partial<Omit<CreateBillInput, 'participants'>> {
  id: number;
  participants?: {
    userId: number;
    share: number;
  }[];
}

export interface CreateBillPaymentInput {
  billId: number;
  amount: number;
  notes?: string;
}

export interface BillsFilterOptions {
  startDate?: Date;
  endDate?: Date;
  category?: string;
  isRecurring?: boolean;
  isPaid?: boolean;
}

export interface BillsSortOptions {
  field: 'dueDate' | 'amount' | 'createdAt';
  direction: 'asc' | 'desc';
}

export interface BillStatistics {
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
  overdueBills: number;
  upcomingBills: number;
  billsByCategory: Record<string, number>;
}