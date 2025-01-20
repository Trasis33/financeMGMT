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
    const { description, amount, date, participantIds, shares } = req.body;
    const creatorId = req.userId;

    if (!creatorId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    // Validate participants
    const uniqueParticipantIds = [...new Set([...participantIds, creatorId])];
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
    const participantShares = uniqueParticipantIds.reduce((acc, userId) => {
      acc[userId] = shares?.[userId] ?? defaultShare;
      return acc;
    }, {} as { [key: number]: number });

    // Validate shares sum to 1
    const shareSum = Object.values(participantShares).reduce((sum, share) => sum + share, 0);
    if (Math.abs(shareSum - 1) > 0.0001) {
      res.status(400).json({ message: 'Share proportions must sum to 1' });
      return;
    }

    // Create split expense with participants
    const splitExpense = await prisma.splitExpense.create({
      data: {
        description,
        amount,
        date: new Date(date),
        creatorId,
        participants: {
          create: uniqueParticipantIds.map(userId => ({
            userId,
            share: participantShares[userId]
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