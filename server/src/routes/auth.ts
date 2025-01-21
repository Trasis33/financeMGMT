import { Router, Response, NextFunction, Request, RequestHandler } from 'express';
import {
  login,
  register,
  logout,
  refresh,
  revokeAllSessions
} from '../controllers/auth';
import { authMiddleware } from '../middleware/auth';
import { prisma } from '../index';
import { TypedRequestBody } from '../types/express';

const router = Router();

interface UpdateProfileBody {
  name: string;
}

type AsyncRequestHandler<P = any, ResBody = any, ReqBody = any> = (
  req: Request<P, ResBody, ReqBody>,
  res: Response<ResBody>,
  next: NextFunction
) => Promise<void>;

// Create an async middleware wrapper to handle Promise rejections
const asyncHandler = (handler: AsyncRequestHandler): RequestHandler => {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};

// Debug middleware for auth routes
const debugAuth: RequestHandler = (req, res, next) => {
  console.log('Auth request:', {
    path: req.path,
    method: req.method,
    cookies: req.cookies,
    headers: req.headers
  });
  next();
};

// Public routes
router.use(debugAuth);
router.post('/login', asyncHandler(login));
router.post('/register', asyncHandler(register));
router.get('/refresh', asyncHandler(refresh));

// Protected routes (require authentication)
router.use(authMiddleware);
router.post('/logout', asyncHandler(logout));
router.post('/revoke-all', asyncHandler(revokeAllSessions));

// User profile handlers
const getProfile: AsyncRequestHandler = async (req, res) => {
  const userId = req.userId;
    
  if (!userId) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true
    }
  });

  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  res.json({ user });
};

const updateProfile: AsyncRequestHandler<{}, any, UpdateProfileBody> = async (req, res) => {
  const userId = req.userId;
    
  if (!userId) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }

  const { name } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    res.status(400).json({ message: 'Valid name is required' });
    return;
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { name: name.trim() },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true
    }
  });

  res.json({ user });
};

// Profile routes
router.get('/profile', asyncHandler(getProfile));
router.put('/profile', asyncHandler(updateProfile));

export default router;