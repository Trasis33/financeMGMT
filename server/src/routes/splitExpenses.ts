import { Router, Request, Response, NextFunction } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { authMiddleware } from '../middleware/auth';
import {
  getSplitExpenses,
  getSplitExpense,
  createSplitExpense,
  updateSplitExpense,
  deleteSplitExpense,
  getBalances
} from '../controllers/splitExpenses';

const router = Router();

interface IdParam extends ParamsDictionary {
  id: string;
}

type AsyncRequestHandler<P = ParamsDictionary, ResBody = any, ReqBody = any> = (
  req: Request<P, ResBody, ReqBody>,
  res: Response<ResBody>,
  next: NextFunction
) => Promise<void | Response>;

// Create an async middleware wrapper to handle Promise rejections
const asyncHandler = <P = ParamsDictionary, ResBody = any, ReqBody = any>(
  handler: AsyncRequestHandler<P, ResBody, ReqBody>
) => {
  return (req: Request<P, ResBody, ReqBody>, res: Response<ResBody>, next: NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
};

// Apply middleware
router.use(asyncHandler(authMiddleware));

// Basic routes
router.get('/', asyncHandler(getSplitExpenses));
router.post('/', asyncHandler(createSplitExpense));

// Balances route must come before ID-based routes to avoid parameter collision
router.get('/balances', asyncHandler(getBalances));

// ID-based routes
router.get('/:id', asyncHandler<IdParam>(getSplitExpense));
router.put('/:id', asyncHandler<IdParam>(updateSplitExpense));
router.delete('/:id', asyncHandler<IdParam>(deleteSplitExpense));

export default router;