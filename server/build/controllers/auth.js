"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.revokeAllSessions = exports.logout = exports.refresh = exports.register = exports.login = void 0;
const index_1 = require("../index");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRY = '30d'; // 30 days
const createCookieOptions = (maxAge) => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge,
    path: '/'
});
// Generate tokens
const generateTokens = async (userId, rememberMe = false) => {
    const jwtSecret = process.env.JWT_SECRET;
    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
    if (!jwtSecret || !jwtRefreshSecret) {
        throw new Error('JWT secrets not configured');
    }
    // Create access token
    const accessToken = jsonwebtoken_1.default.sign({ userId }, jwtSecret, {
        expiresIn: ACCESS_TOKEN_EXPIRY
    });
    // Calculate expiry for refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (rememberMe ? 30 : 1));
    try {
        // Create and update refresh token in a transaction
        return await index_1.prisma.$transaction(async (tx) => {
            // First create the token record
            const createdToken = await tx.refreshTokens.create({
                data: {
                    token: (0, uuid_1.v4)(), // Temporary token
                    userId,
                    expiresAt,
                    userAgent: '',
                    ipAddress: ''
                }
            });
            // Create JWT with the token ID
            const refreshToken = jsonwebtoken_1.default.sign({ userId, tokenId: createdToken.id }, jwtRefreshSecret, { expiresIn: REFRESH_TOKEN_EXPIRY });
            // Update the token record with the JWT
            await tx.refreshTokens.update({
                where: { id: createdToken.id },
                data: { token: refreshToken }
            });
            return { accessToken, refreshToken };
        });
    }
    catch (error) {
        console.error('Token generation error:', error);
        throw error;
    }
};
// Login controller
const login = async (req, res) => {
    const { email, password, rememberMe = false } = req.body;
    const user = await index_1.prisma.user.findUnique({ where: { email } });
    if (!user || !await bcrypt_1.default.compare(password, user.password)) {
        res.status(401).json({ message: 'Invalid credentials' });
        return;
    }
    const { accessToken, refreshToken } = await generateTokens(user.id, rememberMe);
    const cookieOptions = createCookieOptions(rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000);
    console.log('Setting login cookie:', {
        rememberMe,
        options: cookieOptions
    });
    res.cookie('refresh_token', refreshToken, cookieOptions);
    res.json({
        user: {
            id: user.id,
            email: user.email,
            name: user.name
        },
        token: accessToken
    });
};
exports.login = login;
// Register controller
const register = async (req, res) => {
    const { email, password, name } = req.body;
    const existingUser = await index_1.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        res.status(400).json({ message: 'Email already registered' });
        return;
    }
    const hashedPassword = await bcrypt_1.default.hash(password, 10);
    const user = await index_1.prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            name
        }
    });
    const { accessToken, refreshToken } = await generateTokens(user.id);
    const cookieOptions = createCookieOptions(24 * 60 * 60 * 1000);
    console.log('Setting register cookie:', { options: cookieOptions });
    res.cookie('refresh_token', refreshToken, cookieOptions);
    res.status(201).json({
        user: {
            id: user.id,
            email: user.email,
            name: user.name
        },
        token: accessToken
    });
};
exports.register = register;
// Refresh token controller
const refresh = async (req, res) => {
    console.log('Refresh request received:', {
        cookies: req.cookies,
        headers: req.headers
    });
    const refreshToken = req.cookies.refresh_token;
    if (!refreshToken) {
        console.log('No refresh token in cookies');
        res.status(401).json({ message: 'No refresh token provided' });
        return;
    }
    try {
        if (!process.env.JWT_REFRESH_SECRET) {
            console.error('JWT_REFRESH_SECRET not configured');
            res.status(500).json({ message: 'Server configuration error' });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        console.log('Decoded refresh token:', { userId: decoded.userId, tokenId: decoded.tokenId });
        const storedToken = await index_1.prisma.refreshTokens.findFirst({
            where: {
                token: refreshToken,
                userId: decoded.userId,
                isRevoked: false,
                expiresAt: { gt: new Date() }
            },
            include: { user: true }
        });
        if (!storedToken) {
            console.log('No valid stored token found');
            res.status(401).json({ message: 'Invalid refresh token' });
            return;
        }
        console.log('Valid stored token found:', { userId: storedToken.userId });
        const isLongTermToken = storedToken.expiresAt > new Date(Date.now() + 24 * 60 * 60 * 1000);
        const { accessToken, refreshToken: newRefreshToken } = await generateTokens(decoded.userId, isLongTermToken);
        await index_1.prisma.refreshTokens.update({
            where: { id: storedToken.id },
            data: { isRevoked: true }
        });
        const cookieOptions = createCookieOptions(isLongTermToken ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000);
        console.log('Setting new refresh token cookie:', {
            isLongTermToken,
            options: cookieOptions
        });
        res.cookie('refresh_token', newRefreshToken, cookieOptions);
        res.json({
            user: {
                id: storedToken.user.id,
                email: storedToken.user.email,
                name: storedToken.user.name
            },
            token: accessToken
        });
    }
    catch (error) {
        console.error('Token refresh error:', error);
        res.status(401).json({ message: 'Invalid refresh token' });
    }
};
exports.refresh = refresh;
// Logout controller
const logout = async (req, res) => {
    const refreshToken = req.cookies.refresh_token;
    if (refreshToken) {
        await index_1.prisma.refreshTokens.updateMany({
            where: { token: refreshToken },
            data: { isRevoked: true }
        });
    }
    res.clearCookie('refresh_token', createCookieOptions(0));
    res.json({ message: 'Logged out successfully' });
};
exports.logout = logout;
// Revoke all sessions controller
const revokeAllSessions = async (req, res) => {
    const userId = req.userId;
    if (!userId) {
        res.status(401).json({ message: 'Not authenticated' });
        return;
    }
    await index_1.prisma.refreshTokens.updateMany({
        where: {
            userId,
            isRevoked: false
        },
        data: { isRevoked: true }
    });
    res.clearCookie('refresh_token', createCookieOptions(0));
    res.json({ message: 'All sessions revoked successfully' });
};
exports.revokeAllSessions = revokeAllSessions;
