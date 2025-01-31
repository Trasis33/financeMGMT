import { Router, Response, NextFunction } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { billsController } from '../controllers/bills';
import { authMiddleware } from '../middleware/auth';
import { AuthRequest } from '../types/bills';

const router = Router();

interface IdParam extends ParamsDictionary {
  id: string;
}

interface BillIdParam extends ParamsDictionary {
  billId: string;
}

type AsyncRequestHandler<P = ParamsDictionary, ResBody = any, ReqBody = any> = (
  req: AuthRequest & { params: P },
  res: Response<ResBody>,
  next: NextFunction
) => Promise<void>;

// Create an async middleware wrapper to handle Promise rejections
const asyncHandler = <P = ParamsDictionary, ResBody = any, ReqBody = any>(
  handler: (req: AuthRequest & { params: P }, res: Response<ResBody>, next: NextFunction) => Promise<any>
) => {
  return (req: AuthRequest & { params: P }, res: Response<ResBody>, next: NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
};

// Protect all routes with auth middleware
router.use(asyncHandler(authMiddleware));

// Statistics route must come before other routes to avoid parameter collision
router.get('/statistics/overview', asyncHandler(billsController.getBillStatistics));

// CRUD operations
router.post('/', asyncHandler(billsController.createBill));
router.get('/', asyncHandler(billsController.getBills));
router.get('/:id', asyncHandler<IdParam>(billsController.getBill));
router.put('/:id', asyncHandler<IdParam>(billsController.updateBill));
router.delete('/:id', asyncHandler<IdParam>(billsController.deleteBill));

// Bill payments
router.post('/:billId/payments', asyncHandler<BillIdParam>(billsController.addPayment));

export default router;