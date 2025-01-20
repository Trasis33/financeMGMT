import { Request, Response, NextFunction } from 'express';
import { prisma } from '../index';

type TransactionType = 'INCOME' | 'EXPENSE';

interface TransactionCreate {
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
}

interface TransactionUpdate {
  date?: string;
  description?: string;
  amount?: number;
  type?: TransactionType;
  category?: string;
}

// Get all transactions
export const getTransactions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const userId = req.userId;

    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: limit,
    });

    res.json({ transactions });
  } catch (error) {
    next(error);
  }
};

// Get monthly reports
export const getMonthlyReports = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId;
    const currentYear = new Date().getFullYear();
    
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: new Date(currentYear, 0, 1),
          lte: new Date(),
        },
      },
      orderBy: { date: 'asc' },
    });

    const monthlyReports = new Array(12).fill(null).map((_, index) => {
      const monthTransactions = transactions.filter(t => 
        new Date(t.date).getMonth() === index
      );

      const income = monthTransactions
        .filter(t => t.type === 'INCOME')
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = monthTransactions
        .filter(t => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        month: new Date(currentYear, index).toLocaleString('default', { month: 'long' }),
        income,
        expenses,
        balance: income - expenses,
      };
    });

    const currentMonth = new Date().getMonth();
    const reports = monthlyReports.slice(0, currentMonth + 1);

    res.json({ reports });
  } catch (error) {
    next(error);
  }
};

// Get single transaction
export const getTransaction = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const transaction = await prisma.transaction.findFirst({
      where: {
        id: parseInt(id),
        userId,
      },
    });

    if (!transaction) {
      res.status(404).json({ message: 'Transaction not found' });
      return;
    }

    res.json({ transaction });
  } catch (error) {
    next(error);
  }
};

// Create transaction
export const createTransaction = async (
  req: Request<{}, {}, TransactionCreate>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { date, description, amount, type, category } = req.body;
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const transaction = await prisma.transaction.create({
      data: {
        date: new Date(date),
        description,
        amount,
        type,
        category,
        userId
      },
    });

    res.status(201).json({ transaction });
  } catch (error) {
    next(error);
  }
};

// Update transaction
export const updateTransaction = async (
  req: Request<{ id: string }, {}, TransactionUpdate>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { date, description, amount, type, category } = req.body;
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        id: parseInt(id),
        userId,
      },
    });

    if (!existingTransaction) {
      res.status(404).json({ message: 'Transaction not found' });
      return;
    }

    const updatedTransaction = await prisma.transaction.update({
      where: { id: parseInt(id) },
      data: {
        ...(date && { date: new Date(date) }),
        ...(description && { description }),
        ...(amount && { amount }),
        ...(type && { type }),
        ...(category && { category }),
      },
    });

    res.json({ transaction: updatedTransaction });
  } catch (error) {
    next(error);
  }
};

// Delete transaction
export const deleteTransaction = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const transaction = await prisma.transaction.findFirst({
      where: {
        id: parseInt(id),
        userId,
      },
    });

    if (!transaction) {
      res.status(404).json({ message: 'Transaction not found' });
      return;
    }

    await prisma.transaction.delete({
      where: { id: parseInt(id) },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};