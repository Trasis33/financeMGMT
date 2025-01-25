interface Share {
  userId: string | number;
  amount: number;
  share: number;
  user?: {
    id: string | number;
    name: string;
    email: string;
  };
  settled: boolean;
}

export interface SplitExpense {
  id: string | number;
  amount: number;
  description: string;
  paidBy: string | number;
  shares: Share[];
  createdAt: string;
  updatedAt: string;
  payer?: {
    id: string | number;
    name: string;
    email: string;
  };
}

export interface CreateSplitExpenseData {
  description: string;
  amount: number;
  date: string;
  participantIds: (string | number)[];
  shares: { [userId: string | number]: number; };
}

export interface Owes {
  userId: string | number;
  userName: string;
  amount: number;
}

export interface Balance {
  userId: string | number;
  userName: string;
  owes: Owes[];
  isOwed: Owes[];
  netBalance: number;
}

export interface Participant {
  userId: string | number;
  share: number;
}

export interface SimpleSplitExpense {
  id: string | number;
  description: string;
  amount: number;
  date: string;
  participants: Participant[];
}
