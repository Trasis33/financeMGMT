"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bills_1 = require("../controllers/bills");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Create an async middleware wrapper to handle Promise rejections
const asyncHandler = (handler) => {
    return (req, res, next) => {
        Promise.resolve(handler(req, res, next)).catch(next);
    };
};
// Protect all routes with auth middleware
router.use(auth_1.authMiddleware);
// Statistics route must come before other routes to avoid parameter collision
router.get('/statistics/overview', asyncHandler(bills_1.billsController.getBillStatistics));
// CRUD operations
router.post('/', asyncHandler(bills_1.billsController.createBill));
router.get('/', asyncHandler(bills_1.billsController.getBills));
router.get('/:id', asyncHandler(bills_1.billsController.getBill));
router.put('/:id', asyncHandler(bills_1.billsController.updateBill));
router.delete('/:id', asyncHandler(bills_1.billsController.deleteBill));
// Bill payments
router.post('/:billId/payments', asyncHandler(bills_1.billsController.addPayment));
exports.default = router;
