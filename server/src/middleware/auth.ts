import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

declare global {
  namespace Express {
    interface Request {
      user?: any;
      userId?: number;
    }
  }
}

interface JwtPayload extends jwt.JwtPayload {
  userId: number;
  tokenId?: string;
}

const JWT_SECRET = process.env.JWT_SECRET!;

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No auth token provided');
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
      req.user = decoded;
      req.userId = decoded.userId;
      next();
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        console.log('Token expired, client should refresh');
        return res.status(401).json({ error: 'Token expired' });
      }
      console.error('Token validation error:', err);
      return res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const refreshMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No refresh token provided');
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET, { ignoreExpiration: true }) as JwtPayload;
      
      // Allow refresh if token is expired but not too old (within 24h)
      const now = Math.floor(Date.now() / 1000);
      if (!decoded.iat) {
        console.log('Invalid token - missing issued at timestamp');
        return res.status(401).json({ error: 'Invalid token' });
      }
      
      const tokenAge = now - decoded.iat;
      const maxRefreshAge = 24 * 60 * 60; // 24 hours
      
      if (tokenAge > maxRefreshAge) {
        console.log('Token too old for refresh');
        return res.status(401).json({ error: 'Token too old for refresh' });
      }
      
      req.user = decoded;
      next();
    } catch (err) {
      console.error('Refresh token validation error:', err);
      return res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    console.error('Refresh middleware error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
