import { Request } from 'express';
import { Prisma } from '@prisma/client';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    name: string;
  };
}

// Use Prisma's generated types
type BillWithRelations = Prisma.BillGetPayload<{
  include: {
    participants: {
      include: {
        user: {
          select: {
            id: true;
            name: true;
            email: true;
          };
        };
      };
    };
    payments: {
      include: {
        user: {
          select: {
            id: true;
            name: true;
            email: true;
          };
        };
      };
    };
    creator: {
      select: {
        id: true;
        name: true;
        email: true;
      };
    };
  };
}>;

export interface CreateBillParticipant {
  userId: number;
  share: number;
}

export interface BillFilters {
  startDate?: Date;
  endDate?: Date;
  category?: string;
  isRecurring?: boolean;
  isPaid?: boolean;
}

export type { BillWithRelations };