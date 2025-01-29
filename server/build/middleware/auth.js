"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const TOKEN_EXPIRY_WINDOW = 5 * 60; // 5 minutes in seconds
const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            res.status(401).json({ message: 'No token provided' });
            return;
        }
        const token = authHeader.split(' ')[1];
        if (!token) {
            res.status(401).json({ message: 'Invalid token format' });
            return;
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            req.userId = decoded.userId;
            // Check if token is about to expire (within 5 minutes)
            const now = Math.floor(Date.now() / 1000);
            if (decoded.exp && decoded.exp - now < TOKEN_EXPIRY_WINDOW) {
                console.log('Token close to expiry, generating new token');
                // Generate new token
                const payload = { userId: decoded.userId };
                const newToken = jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });
                // Set new token in response headers
                res.setHeader('Access-Control-Expose-Headers', 'Authorization');
                res.setHeader('Authorization', `Bearer ${newToken}`);
            }
            next();
        }
        catch (err) {
            if (err instanceof jsonwebtoken_1.default.TokenExpiredError) {
                // Check for refresh token
                const refreshToken = req.cookies.refresh_token;
                if (refreshToken) {
                    try {
                        const decoded = jsonwebtoken_1.default.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
                        // Generate new access token
                        const newToken = jsonwebtoken_1.default.sign({ userId: decoded.userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
                        res.setHeader('Access-Control-Expose-Headers', 'Authorization');
                        res.setHeader('Authorization', `Bearer ${newToken}`);
                        req.userId = decoded.userId;
                        next();
                        return;
                    }
                    catch (refreshErr) {
                        console.error('Refresh token verification failed:', refreshErr);
                    }
                }
                res.status(401).json({ message: 'Token expired' });
                return;
            }
            if (err instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                res.status(401).json({ message: 'Invalid token' });
                return;
            }
            throw err;
        }
    }
    catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
exports.authMiddleware = authMiddleware;
