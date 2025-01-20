import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getMonthlyReports
} from '../controllers/transactions';

const router = Router();

// Create an async middleware wrapper to handle Promise rejections
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Apply auth middleware to all transaction routes
router.use(authMiddleware);

// GET /api/transactions
router.get('/', asyncHandler(getTransactions));

// GET /api/transactions/reports/monthly
router.get('/reports/monthly', asyncHandler(getMonthlyReports));

// POST /api/transactions
router.post('/', asyncHandler(createTransaction));

// GET /api/transactions/:id
router.get('/:id', asyncHandler(getTransaction));

// PUT /api/transactions/:id
router.put('/:id', asyncHandler(updateTransaction));

// DELETE /api/transactions/:id
router.delete('/:id', asyncHandler(deleteTransaction));

export default router;