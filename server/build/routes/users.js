"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const users_1 = require("../controllers/users");
const router = (0, express_1.Router)();
// Create an async middleware wrapper to handle Promise rejections
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
// Apply middleware
router.use(auth_1.authMiddleware);
// Routes
router.get('/', asyncHandler(users_1.getUsers));
exports.default = router;
