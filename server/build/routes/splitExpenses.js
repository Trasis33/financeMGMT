"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const splitExpenses_1 = require("../controllers/splitExpenses");
const router = (0, express_1.Router)();
// Create an async middleware wrapper to handle Promise rejections
const asyncHandler = (handler) => {
    return (req, res, next) => {
        Promise.resolve(handler(req, res, next)).catch(next);
    };
};
// Apply middleware
router.use(auth_1.authMiddleware);
// Basic routes
router.get('/', asyncHandler(splitExpenses_1.getSplitExpenses));
router.post('/', asyncHandler(splitExpenses_1.createSplitExpense));
// ID-based routes
router.get('/:id', asyncHandler(splitExpenses_1.getSplitExpense));
router.put('/:id', asyncHandler(splitExpenses_1.updateSplitExpense));
router.delete('/:id', asyncHandler(splitExpenses_1.deleteSplitExpense));
exports.default = router;
