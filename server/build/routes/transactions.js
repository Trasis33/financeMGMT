"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const transactions_1 = require("../controllers/transactions");
const router = (0, express_1.Router)();
// Create an async middleware wrapper to handle Promise rejections
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
// Apply auth middleware to all transaction routes
router.use(auth_1.authMiddleware);
// GET /api/transactions
router.get('/', asyncHandler(transactions_1.getTransactions));
// GET /api/transactions/reports/monthly
router.get('/reports/monthly', asyncHandler(transactions_1.getMonthlyReports));
// POST /api/transactions
router.post('/', asyncHandler(transactions_1.createTransaction));
// GET /api/transactions/:id
router.get('/:id', asyncHandler(transactions_1.getTransaction));
// PUT /api/transactions/:id
router.put('/:id', asyncHandler(transactions_1.updateTransaction));
// DELETE /api/transactions/:id
router.delete('/:id', asyncHandler(transactions_1.deleteTransaction));
exports.default = router;
