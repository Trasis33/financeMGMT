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
// Generate tokens
const generateTokens = async (userId, rememberMe = false) => {
    const accessToken = jsonwebtoken_1.default.sign({ userId }, process.env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (rememberMe ? 30 : 1));
    return await index_1.prisma.$transaction(async (tx) => {
        const createdToken = await tx.refreshTokens.create({
            data: {
                token: (0, uuid_1.v4)(),
                userId,
                expiresAt,
                userAgent: '',
                ipAddress: ''
            }
        });
        const refreshToken = jsonwebtoken_1.default.sign({ userId, tokenId: createdToken.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
        await tx.refreshTokens.update({
            where: { id: createdToken.id },
            data: { token: refreshToken }
        });
        return { accessToken, refreshToken };
    });
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
    await index_1.prisma.refreshTokens.update({
        where: { token: refreshToken },
        data: {
            userAgent: req.headers['user-agent'] || '',
            ipAddress: req.ip
        }
    });
    res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000
    });
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
    res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000
    });
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
    const refreshToken = req.cookies.refresh_token;
    if (!refreshToken) {
        res.status(401).json({ message: 'No refresh token provided' });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
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
            res.status(401).json({ message: 'Invalid refresh token' });
            return;
        }
        const { accessToken, refreshToken: newRefreshToken } = await generateTokens(decoded.userId, storedToken.expiresAt > new Date(Date.now() + 24 * 60 * 60 * 1000));
        await index_1.prisma.refreshTokens.update({
            where: { id: storedToken.id },
            data: { isRevoked: true }
        });
        res.cookie('refresh_token', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: storedToken.expiresAt.getTime() - Date.now()
        });
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
        res.status(401).json({ message: 'Invalid refresh token' });
        return;
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
    res.clearCookie('refresh_token');
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
    res.clearCookie('refresh_token');
    res.json({ message: 'All sessions revoked successfully' });
};
exports.revokeAllSessions = revokeAllSessions;
