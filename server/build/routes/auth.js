"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../controllers/auth");
const auth_2 = require("../middleware/auth");
const index_1 = require("../index");
const router = (0, express_1.Router)();
// Create an async middleware wrapper to handle Promise rejections
const asyncHandler = (handler) => {
    return async (req, res, next) => {
        try {
            await handler(req, res, next);
        }
        catch (error) {
            next(error);
        }
    };
};
// Public routes
router.post('/login', asyncHandler(auth_1.login));
router.post('/register', asyncHandler(auth_1.register));
router.post('/refresh', asyncHandler(auth_1.refresh));
// Protected routes (require authentication)
router.use(auth_2.authMiddleware);
router.post('/logout', asyncHandler(auth_1.logout));
router.post('/revoke-all', asyncHandler(auth_1.revokeAllSessions));
// User profile handlers
const getProfile = async (req, res) => {
    const userId = req.userId;
    if (!userId) {
        res.status(401).json({ message: 'Not authenticated' });
        return;
    }
    const user = await index_1.prisma.user.findUnique({
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
const updateProfile = async (req, res) => {
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
    const user = await index_1.prisma.user.update({
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
exports.default = router;
