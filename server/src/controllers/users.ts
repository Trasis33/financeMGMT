import { Request, Response, NextFunction } from 'express';
import { prisma } from '../index';

export const getUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    res.json(users);
  } catch (error) {
    next(error);
  }
};