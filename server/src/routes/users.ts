import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth';
import { getUsers } from '../controllers/users';

const router = Router();

// Create an async middleware wrapper to handle Promise rejections
const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Apply middleware
router.use(asyncHandler(authMiddleware));

// Routes
router.get('/', asyncHandler(getUsers));

export default router;