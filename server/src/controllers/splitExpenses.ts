import { Request, Response, NextFunction } from 'express';
import { prisma } from '../index';

interface SplitExpenseCreate {
  description: string;
  amount: number;
  date: string;
  participantIds: number[];
  shares?: { [userId: number]: number };  // Optional custom share ratios
}

interface SplitExpenseUpdate {
  description?: string;
  amount?: number;
  date?: string;
  participantIds?: number[];
  shares?: { [userId: number]: number };
}

export const getSplitExpenses = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId;
    const expenses = await prisma.splitExpense.findMany({
      where: {
        participants: {
          some: {
            userId
          }
        }
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        },
        participants: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      },
      orderBy: { date: 'desc' }
    });

    res.json({ expenses });
  } catch (error) {
    next(error);
  }
};

export const getSplitExpense = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const expense = await prisma.splitExpense.findFirst({
      where: {
        id: parseInt(id),
        participants: {
          some: {
            userId
          }
        }
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        },
        participants: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    });

    if (!expense) {
      res.status(404).json({ message: 'Split expense not found' });
      return;
    }

    res.json({ expense });
  } catch (error) {
    next(error);
  }
};

export const createSplitExpense = async (
  req: Request<{}, {}, SplitExpenseCreate>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { description, amount, shares } = req.body;
    const creatorId = req.userId;

    if (!creatorId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    // Validate required fields
    if (!description || !amount || !shares) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }

    // Validate shares
    const participantIds = shares.map(share => share.userId);
    const uniqueParticipantIds = [...new Set([...participantIds, creatorId])];
    
    // Validate participants exist
    const participants = await prisma.user.findMany({
      where: {
        id: {
          in: uniqueParticipantIds
        }
      }
    });

    if (participants.length !== uniqueParticipantIds.length) {
      res.status(400).json({ message: 'One or more participants not found' });
      return;
    }

    // Calculate total shares
    const totalShares = shares.reduce((sum, share) => sum + share.amount, 0);
    if (Math.abs(totalShares - amount) > 0.01) {
      res.status(400).json({ message: 'Total shares must equal the total amount' });
      return;
    }

    // Create split expense with participants
    const splitExpense = await prisma.splitExpense.create({
      data: {
        description,
        amount,
        date: new Date(), // Add current date as default
        creatorId,
        participants: {
          create: shares.map(share => ({
            userId: share.userId,
            share: share.amount,
            settled: false
          }))
        }
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        },
        participants: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    });

    res.status(201).json({ expense: splitExpense });
  } catch (error) {
    next(error);
  }
};

export const updateSplitExpense = async (
  req: Request<{ id: string }, {}, SplitExpenseUpdate>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { description, amount, date, participantIds, shares } = req.body;
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    // Check if expense exists and user is creator
    const existingExpense = await prisma.splitExpense.findFirst({
      where: {
        id: parseInt(id),
        creatorId: userId
      },
      include: {
        participants: true
      }
    });

    if (!existingExpense) {
      res.status(404).json({ message: 'Split expense not found or unauthorized' });
      return;
    }

    // Prepare update data
    const updateData: any = {
      ...(description && { description }),
      ...(amount && { amount }),
      ...(date && { date: new Date(date) })
    };

    // Update participants if provided
    if (participantIds) {
      const uniqueParticipantIds = [...new Set([...participantIds, userId])];
      
      // Validate participants exist
      const participants = await prisma.user.findMany({
        where: {
          id: {
            in: uniqueParticipantIds
          }
        }
      });

      if (participants.length !== uniqueParticipantIds.length) {
        res.status(400).json({ message: 'One or more participants not found' });
        return;
      }

      // Calculate shares
      const defaultShare = 1 / uniqueParticipantIds.length;
      const participantShares = uniqueParticipantIds.reduce((acc, pId) => {
        acc[pId] = shares?.[pId] ?? defaultShare;
        return acc;
      }, {} as { [key: number]: number });

      // Validate shares sum to 1
      const shareSum = Object.values(participantShares).reduce((sum, share) => sum + share, 0);
      if (Math.abs(shareSum - 1) > 0.0001) {
        res.status(400).json({ message: 'Share proportions must sum to 1' });
        return;
      }

      // Update participants
      await prisma.splitExpenseParticipant.deleteMany({
        where: { splitExpenseId: parseInt(id) }
      });

      updateData.participants = {
        create: uniqueParticipantIds.map(pId => ({
          userId: pId,
          share: participantShares[pId]
        }))
      };
    }

    // Update expense
    const updatedExpense = await prisma.splitExpense.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        },
        participants: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    });

    res.json({ expense: updatedExpense });
  } catch (error) {
    next(error);
  }
};

export const deleteSplitExpense = async (
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

    // Check if expense exists and user is creator
    const expense = await prisma.splitExpense.findFirst({
      where: {
        id: parseInt(id),
        creatorId: userId
      }
    });

    if (!expense) {
      res.status(404).json({ message: 'Split expense not found or unauthorized' });
      return;
    }

    // Delete expense and all related participants
    await prisma.splitExpense.delete({
      where: { id: parseInt(id) }
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

interface Balance {
  userId: number;
  userName: string;
  netBalance: number;
  owes: Array<{
    userId: number;
    userName: string;
    amount: number;
  }>;
  isOwed: Array<{
    userId: number;
    userName: string;
    amount: number;
  }>;
}

export const getBalances = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId;

    // Get all split expenses where the user is a participant
    type SplitExpenseWithParticipants = {
      id: number;
      amount: number;
      creatorId: number;
      participants: Array<{
        userId: number;
        share: number;
        user: {
          id: number;
          name: string;
        };
      }>;
    };

    const expenses = await prisma.splitExpense.findMany({
      where: {
        participants: {
          some: {
            userId
          }
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    // Calculate balances
    const balances = new Map<number, Balance>();

    // Initialize balances for all users involved in expenses
    expenses.forEach((expense: SplitExpenseWithParticipants) => {
      expense.participants.forEach((participant: { userId: number; share: number; user: { id: number; name: string } }) => {
        const { id: userId, name: userName } = participant.user;
        if (!balances.has(userId)) {
          balances.set(userId, {
            userId,
            userName,
            netBalance: 0,
            owes: [],
            isOwed: []
          });
        }
      });
    });

    // Calculate amounts owed/owing
    expenses.forEach((expense: SplitExpenseWithParticipants) => {
      const paidByUserId = expense.creatorId;
      const totalAmount = expense.amount;

      expense.participants.forEach((participant: { userId: number; share: number; user: { id: number; name: string } }) => {
        const participantShare = totalAmount * participant.share;
        const participantUserId = participant.userId;

        if (participantUserId !== paidByUserId) {
          // Update the participant's balance (they owe the payer)
          const participantBalance = balances.get(participantUserId)!;
          participantBalance.netBalance -= participantShare;

          // Update the payer's balance (they are owed by the participant)
          const payerBalance = balances.get(paidByUserId)!;
          payerBalance.netBalance += participantShare;

          // Record the debt relationship
          participantBalance.owes.push({
            userId: paidByUserId,
            userName: balances.get(paidByUserId)!.userName,
            amount: participantShare
          });

          payerBalance.isOwed.push({
            userId: participantUserId,
            userName: participantBalance.userName,
            amount: participantShare
          });
        }
      });
    });

    // Convert Map to array and round numbers
    const balanceArray = Array.from(balances.values()).map(balance => ({
      ...balance,
      netBalance: Math.round(balance.netBalance * 100) / 100,
      owes: balance.owes.map(debt => ({
        ...debt,
        amount: Math.round(debt.amount * 100) / 100
      })),
      isOwed: balance.isOwed.map(credit => ({
        ...credit,
        amount: Math.round(credit.amount * 100) / 100
      }))
    }));

    res.json(balanceArray);
  } catch (error) {
    next(error);
  }
};
